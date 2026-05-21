"""
SIGRA Risk Scoring Engine

Motor de cálculo de puntaje de riesgo basado en múltiples variables.
"""

from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.db.models import Q
from safecloud_api.apps.audit.models import AuditLog, KnownIP, KnownDevice
from safecloud_api.apps.companies.models import Document
from safecloud_api.apps.sigra.models import SIGRAEvent, SIGRAAlert
import json


class RiskScorer:
    """
    Motor principal de cálculo de riesgo SIGRA.
    
    Calcula puntaje basado en:
    - Hora del acceso
    - IP del usuario
    - Dispositivo
    - Rol del usuario
    - Criticidad del documento
    - Tipo de acción
    - Volumen de eventos
    - Historial del usuario
    """
    
    # Thresholds de riesgo
    MEDIUM_THRESHOLD = 31
    HIGH_THRESHOLD = 61
    CRITICAL_THRESHOLD = 81
    
    # Puntajes base por evento
    BASE_SCORES = {
        'ANOMALOUS_TIME': 15,  # Acceso fuera de horario
        'UNKNOWN_IP': 20,      # IP desconocida
        'UNKNOWN_DEVICE': 20,  # Dispositivo desconocido
        'FAILED_LOGIN': 15,    # Intento fallido
        'MASS_DOWNLOAD': 25,   # Descarga masiva
        'CRITICAL_DOC': 30,    # Documento crítico
        'PERMISSION_CHANGE': 25,  # Cambio de permisos
        'ROLE_ANOMALY': 25,    # Acción incompatible con rol
        'EXPORT_ATTEMPT': 35,  # Intento de exportación
    }
    
    # Modificadores por contexto
    MODIFIERS = {
        'document_criticality': {
            1: 0,    # Público
            2: 10,   # Interno
            3: 20,   # Confidencial
            4: 30,   # Crítico
        },
        'document_action': {
            'view': 0,      # Solo lectura
            'download': 10, # Descarga
            'edit': 15,     # Edición
            'delete': 20,   # Eliminación
        },
        'good_behavior': -5,      # Usuario sin alertas en 90 días
        'new_user': 10,           # Usuario nuevo (< 1 semana)
        'corporate_ip': -10,      # IP corporativa conocida
        'vpn': -15,               # VPN corporativa
    }
    
    def __init__(self, user: User, company=None):
        self.user = user
        self.company = company or user.companies_set.first()
        self.score_breakdown = {}
    
    def calculate_risk(self, event_data: dict) -> tuple:
        """
        Calcula el puntaje de riesgo para un evento.
        
        Args:
            event_data: Dict con datos del evento
            {
                'action': str,
                'ip_address': str,
                'device_id': str,
                'document_id': int (opcional),
                'timestamp': datetime,
            }
        
        Returns:
            (risk_score: int, risk_level: str, breakdown: dict)
        """
        self.score_breakdown = {}
        base_score = 0
        
        # 1. Puntaje base por tipo de evento
        base_score = self._calculate_event_score(event_data)
        
        # 2. Modificadores por contexto
        context_score = self._calculate_context_modifiers(event_data)
        
        # 3. Detección de anomalías
        anomaly_score = self._calculate_anomaly_score(event_data)
        
        # 4. Modificadores por historial
        history_score = self._calculate_history_modifiers(event_data)
        
        # Score final
        final_score = max(0, base_score + context_score + anomaly_score + history_score)
        
        # Determinar nivel de riesgo
        risk_level = self._get_risk_level(final_score)
        
        return final_score, risk_level, self.score_breakdown
    
    def _calculate_event_score(self, event_data: dict) -> int:
        """Calcula puntaje base según tipo de evento"""
        score = 0
        action = event_data.get('action', 'VIEW_DOC')
        
        # Acceso fuera de horario
        if self._is_outside_business_hours(event_data.get('timestamp')):
            score += self.BASE_SCORES['ANOMALOUS_TIME']
            self.score_breakdown['anomalous_time'] = self.BASE_SCORES['ANOMALOUS_TIME']
        
        # IP desconocida
        if not self._is_known_ip(event_data.get('ip_address')):
            score += self.BASE_SCORES['UNKNOWN_IP']
            self.score_breakdown['unknown_ip'] = self.BASE_SCORES['UNKNOWN_IP']
        
        # Dispositivo desconocido
        if not self._is_known_device(event_data.get('device_id')):
            score += self.BASE_SCORES['UNKNOWN_DEVICE']
            self.score_breakdown['unknown_device'] = self.BASE_SCORES['UNKNOWN_DEVICE']
        
        # Intento fallido de login
        if action == 'FAILED_LOGIN':
            failed_attempts = self._count_failed_attempts()
            if failed_attempts >= 5:
                score += self.BASE_SCORES['FAILED_LOGIN'] + (failed_attempts - 5) * 3
                self.score_breakdown['failed_logins'] = self.BASE_SCORES['FAILED_LOGIN']
        
        return score
    
    def _calculate_context_modifiers(self, event_data: dict) -> int:
        """Calcula modificadores por contexto del evento"""
        score = 0
        
        # Criticidad del documento
        doc_id = event_data.get('document_id')
        if doc_id:
            try:
                doc = Document.objects.get(id=doc_id)
                doc_modifier = self.MODIFIERS['document_criticality'].get(
                    doc.criticality_level, 0
                )
                score += doc_modifier
                self.score_breakdown['document_criticality'] = doc_modifier
                
                # Modificador adicional por acción
                action = event_data.get('action', 'view')
                action_modifier = self.MODIFIERS['document_action'].get(
                    action.lower().replace('_doc', ''), 0
                )
                score += action_modifier
                self.score_breakdown['document_action'] = action_modifier
            except Document.DoesNotExist:
                pass
        
        # Modificadores de IP/VPN
        ip = event_data.get('ip_address')
        if ip:
            if self._is_corporate_ip(ip):
                score += self.MODIFIERS['corporate_ip']
                self.score_breakdown['corporate_ip'] = self.MODIFIERS['corporate_ip']
            if self._is_vpn(ip):
                score += self.MODIFIERS['vpn']
                self.score_breakdown['vpn'] = self.MODIFIERS['vpn']
        
        return score
    
    def _calculate_anomaly_score(self, event_data: dict) -> int:
        """Detecta anomalías en el comportamiento del usuario"""
        score = 0
        
        # Descarga masiva (> 10 documentos en 5 minutos)
        recent_downloads = self._count_recent_downloads(minutes=5)
        if recent_downloads >= 10:
            download_score = self.BASE_SCORES['MASS_DOWNLOAD'] + (recent_downloads - 10) * 2
            score += download_score
            self.score_breakdown['mass_download'] = download_score
        
        # Cambio de permisos anómalo
        if event_data.get('action') == 'CHANGE_PERMISSION':
            score += self.BASE_SCORES['PERMISSION_CHANGE']
            self.score_breakdown['permission_change'] = self.BASE_SCORES['PERMISSION_CHANGE']
        
        # Acción incompatible con el rol
        if self._is_role_anomaly(event_data):
            score += self.BASE_SCORES['ROLE_ANOMALY']
            self.score_breakdown['role_anomaly'] = self.BASE_SCORES['ROLE_ANOMALY']
        
        # Intento de exportación masiva
        if event_data.get('action') == 'EXPORT_DATA':
            score += self.BASE_SCORES['EXPORT_ATTEMPT']
            self.score_breakdown['export_attempt'] = self.BASE_SCORES['EXPORT_ATTEMPT']
        
        return score
    
    def _calculate_history_modifiers(self, event_data: dict) -> int:
        """Calcula modificadores basados en historial del usuario"""
        score = 0
        
        # Usuario nuevo (menos de 1 semana)
        if self._is_new_user():
            score += self.MODIFIERS['new_user']
            self.score_breakdown['new_user'] = self.MODIFIERS['new_user']
        
        # Alertas previas en últimos 30 días
        recent_alerts = self._count_recent_alerts(days=30)
        if recent_alerts > 0:
            alert_modifier = min(recent_alerts * 5, 30)
            score += alert_modifier
            self.score_breakdown['history_alerts'] = alert_modifier
        
        # Buen comportamiento (sin alertas en 90 días)
        if self._has_clean_history(days=90):
            score += self.MODIFIERS['good_behavior']
            self.score_breakdown['good_behavior'] = self.MODIFIERS['good_behavior']
        
        return score
    
    def _get_risk_level(self, score: int) -> str:
        """Determina el nivel de riesgo basado en el puntaje"""
        if score < self.MEDIUM_THRESHOLD:
            return 'LOW'
        elif score < self.HIGH_THRESHOLD:
            return 'MEDIUM'
        elif score < self.CRITICAL_THRESHOLD:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    # ============= Métodos auxiliares =============
    
    def _is_outside_business_hours(self, timestamp=None) -> bool:
        """Verifica si el acceso es fuera de horario laboral"""
        if not timestamp:
            timestamp = datetime.now()
        
        hour = timestamp.hour
        # Horario laboral: 9:00 - 18:00
        return hour < 9 or hour > 18
    
    def _is_known_ip(self, ip_address: str) -> bool:
        """Verifica si la IP es conocida del usuario"""
        return KnownIP.objects.filter(
            user=self.user,
            ip_address=ip_address
        ).exists()
    
    def _is_known_device(self, device_id: str) -> bool:
        """Verifica si el dispositivo es conocido del usuario"""
        if not device_id:
            return False
        return KnownDevice.objects.filter(
            user=self.user,
            device_id=device_id
        ).exists()
    
    def _is_corporate_ip(self, ip_address: str) -> bool:
        """Verifica si es una IP corporativa"""
        return KnownIP.objects.filter(
            user=self.user,
            ip_address=ip_address,
            is_corporate=True
        ).exists()
    
    def _is_vpn(self, ip_address: str) -> bool:
        """Verifica si es una VPN corporativa"""
        return KnownIP.objects.filter(
            user=self.user,
            ip_address=ip_address,
            is_vpn=True
        ).exists()
    
    def _count_failed_attempts(self, hours=24) -> int:
        """Cuenta intentos fallidos de login"""
        since = datetime.now() - timedelta(hours=hours)
        return AuditLog.objects.filter(
            user=self.user,
            action='FAILED_LOGIN',
            created_at__gte=since
        ).count()
    
    def _count_recent_downloads(self, minutes=5) -> int:
        """Cuenta descargas recientes"""
        since = datetime.now() - timedelta(minutes=minutes)
        return AuditLog.objects.filter(
            user=self.user,
            action='DOWNLOAD_DOC',
            created_at__gte=since
        ).count()
    
    def _is_role_anomaly(self, event_data: dict) -> bool:
        """Detecta si la acción es anómala para el rol del usuario"""
        action = event_data.get('action')
        
        # Ejemplo: Usuario no-admin intentando cambiar permisos
        user_role = self.user.groups.first()
        if action == 'CHANGE_PERMISSION' and not self._is_admin():
            return True
        
        return False
    
    def _is_new_user(self) -> bool:
        """Verifica si el usuario es nuevo (< 1 semana)"""
        one_week_ago = datetime.now() - timedelta(days=7)
        return self.user.date_joined > one_week_ago
    
    def _count_recent_alerts(self, days=30) -> int:
        """Cuenta alertas activas recientes"""
        since = datetime.now() - timedelta(days=days)
        return SIGRAAlert.objects.filter(
            user=self.user,
            created_at__gte=since
        ).count()
    
    def _has_clean_history(self, days=90) -> bool:
        """Verifica si el usuario tiene buen historial"""
        since = datetime.now() - timedelta(days=days)
        return not SIGRAAlert.objects.filter(
            user=self.user,
            created_at__gte=since
        ).exists()
    
    def _is_admin(self) -> bool:
        """Verifica si el usuario es admin"""
        return self.user.is_staff or self.user.is_superuser
