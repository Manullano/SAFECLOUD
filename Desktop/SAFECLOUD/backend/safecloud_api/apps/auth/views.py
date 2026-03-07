from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
import pyotp
import qrcode
from io import BytesIO
import base64
from safecloud_api.apps.companies.models import User, TwoFactorAuth
from safecloud_api.core.serializers import UserSerializer, UserDetailSerializer
from safecloud_api.core.utils import log_audit_event, update_user_last_login


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        update_user_last_login(user)
        log_audit_event(
            actor_user=user,
            action='LOGIN',
            company=user.company,
            ip=self.context['request'].META.get('REMOTE_ADDR'),
            user_agent=self.context['request'].META.get('HTTP_USER_AGENT')
        )
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
            
            # ✅ CRÍTICO: Validar que el usuario está activo
            if not user.is_active:
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'User is inactive'}
                )
                return Response({'error': 'Usuario desactivado'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ CRÍTICO: Validar que la empresa está activa (si el usuario tiene empresa asignada)
            if user.company and user.company.status == 'INACTIVE':
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'Company is inactive'}
                )
                return Response({'error': 'Empresa inactiva. Contacta a soporte.'}, status=status.HTTP_403_FORBIDDEN)
            
            if user.check_password(password):
                # Check if 2FA is enabled
                if user.two_factor_enabled:
                    log_audit_event(
                        actor_user=user,
                        action='LOGIN_2FA_REQUIRED',
                        company=user.company,
                        ip=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT')
                    )
                    
                    return Response({
                        'requires_2fa': True,
                        'user_id': str(user.id),
                        'message': '2FA code required'
                    }, status=status.HTTP_202_ACCEPTED)
                
                update_user_last_login(user)
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_SUCCESS',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
                
                # Generar tokens JWT
                refresh = RefreshToken.for_user(user)
                
                serializer = UserDetailSerializer(user)
                return Response({
                    'user': serializer.data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'message': 'Login exitoso'
                }, status=status.HTTP_200_OK)
            else:
                log_audit_event(
                    actor_user=user,
                    action='LOGIN_FAILED',
                    company=user.company,
                    ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    data={'reason': 'Invalid password'}
                )
                return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = []
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_audit_event(
            actor_user=user,
            action='USER_CREATED',
            company=user.company,
            data={'user_id': str(user.id)}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user info"""
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)


# ===================== 2FA ENDPOINTS =====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_two_factor(request):
    """
    Initiate 2FA setup - Generate secret and QR code
    """
    user = request.user
    
    # Delete existing 2FA if any
    TwoFactorAuth.objects.filter(user=user).delete()
    
    # Create new 2FA record
    twofa = TwoFactorAuth(user=user)
    twofa.secret_key = twofa.generate_secret()
    twofa.save()
    
    # Generate QR code
    totp = twofa.get_totp()
    uri = totp.provisioning_uri(name=user.email, issuer_name='SAFECLOUD')
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    qr_code_data = base64.b64encode(buf.getvalue()).decode()
    
    # Generate backup codes
    backup_codes = twofa.generate_backup_codes()
    twofa.save()
    
    log_audit_event(
        actor_user=user,
        action='2FA_SETUP_INITIATED',
        company=user.company,
        data={'method': 'TOTP'}
    )
    
    return Response({
        'secret': twofa.secret_key,
        'qr_code': f"data:image/png;base64,{qr_code_data}",
        'backup_codes': backup_codes,
        'message': 'Escanea el código QR con tu aplicación authenticator'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_two_factor_setup(request):
    """
    Verify 2FA setup with a TOTP code
    """
    user = request.user
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        twofa = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({'error': '2FA not initialized'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token
    if not twofa.verify_token(token):
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark 2FA as verified
    twofa.is_verified = True
    twofa.save()
    
    # Enable 2FA on user
    user.two_factor_enabled = True
    user.save()
    
    log_audit_event(
        actor_user=user,
        action='2FA_SETUP_COMPLETED',
        company=user.company,
        data={'method': 'TOTP'}
    )
    
    return Response({
        'message': '2FA enabled successfully',
        'backup_codes': twofa.backup_codes
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([])
def verify_two_factor_login(request):
    """
    Verify 2FA code during login
    If 2FA passes, return JWT tokens
    """
    user_id = request.data.get('user_id')
    token = request.data.get('token')
    use_backup = request.data.get('use_backup', False)
    
    if not user_id or not token:
        return Response({
            'error': 'user_id and token are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        twofa = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({'error': '2FA not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token
    verified = False
    if use_backup:
        verified = twofa.verify_backup_code(token)
    else:
        verified = twofa.verify_token(token)
    
    if not verified:
        log_audit_event(
            actor_user=user,
            action='2FA_VERIFICATION_FAILED',
            company=user.company,
            data={'method': 'TOTP'}
        )
        return Response({'error': 'Invalid 2FA code'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # 2FA verified - generate tokens
    update_user_last_login(user)
    twofa.last_used_at = __import__('django.utils.timezone', fromlist=['now']).now()
    twofa.save()
    
    log_audit_event(
        actor_user=user,
        action='2FA_VERIFICATION_SUCCESS',
        company=user.company,
        data={'method': 'TOTP'}
    )
    
    refresh = RefreshToken.for_user(user)
    serializer = UserDetailSerializer(user)
    
    return Response({
        'user': serializer.data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'message': '2FA verification successful'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_two_factor_status(request):
    """
    Get current 2FA status for user
    """
    user = request.user
    
    try:
        twofa = TwoFactorAuth.objects.get(user=user)
        remaining_backup_codes = len(twofa.backup_codes)
    except TwoFactorAuth.DoesNotExist:
        return Response({
            'enabled': False,
            'verified': False,
            'remaining_backup_codes': 0,
            'last_used_at': None
        }, status=status.HTTP_200_OK)
    
    return Response({
        'enabled': user.two_factor_enabled,
        'verified': twofa.is_verified,
        'remaining_backup_codes': remaining_backup_codes,
        'last_used_at': twofa.last_used_at,
        'method': user.two_factor_method
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_two_factor(request):
    """
    Disable 2FA for user
    """
    user = request.user
    password = request.data.get('password')
    
    # Verify password
    if not user.check_password(password):
        log_audit_event(
            actor_user=user,
            action='2FA_DISABLE_FAILED',
            company=user.company,
            data={'reason': 'Invalid password'}
        )
        return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Disable 2FA
    user.two_factor_enabled = False
    user.save()
    
    TwoFactorAuth.objects.filter(user=user).delete()
    
    log_audit_event(
        actor_user=user,
        action='2FA_DISABLED',
        company=user.company
    )
    
    return Response({
        'message': '2FA disabled successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_backup_codes(request):
    """
    Generate new backup codes
    """
    user = request.user
    password = request.data.get('password')
    
    # Verify password
    if not user.check_password(password):
        return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        twofa = TwoFactorAuth.objects.get(user=user)
    except TwoFactorAuth.DoesNotExist:
        return Response({'error': '2FA not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new codes
    backup_codes = twofa.generate_backup_codes()
    twofa.save()
    
    log_audit_event(
        actor_user=user,
        action='BACKUP_CODES_REGENERATED',
        company=user.company
    )
    
    return Response({
        'backup_codes': backup_codes,
        'message': 'New backup codes generated'
    }, status=status.HTTP_200_OK)

