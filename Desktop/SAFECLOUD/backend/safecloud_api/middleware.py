"""
Middleware for multi-tenant data isolation and permission enforcement
"""
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from rest_framework.response import Response
from rest_framework import status


class MultiTenantMiddleware(MiddlewareMixin):
    """
    Middleware to enforce multi-tenant data isolation
    Adds tenant context to requests and filters querysets
    """
    
    def process_request(self, request):
        # Skip for anonymous users
        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser):
            return None
        
        user = request.user
        
        # Add user's company to request context
        if hasattr(user, 'company') and user.company:
            request.tenant_company = user.company
        
        # Add role to request
        if hasattr(user, 'role'):
            request.user_role = user.role
        
        return None


class PermissionCheckMiddleware(MiddlewareMixin):
    """
    Middleware to check permissions on protected endpoints
    """
    
    # Protected endpoints that require permission checks
    PROTECTED_ENDPOINTS = {
        # Projects
        '/api/projects/': 'PROJECTS',
        '/api/tasks/': 'TASKS',
        
        # Tickets
        '/api/tickets/': 'TICKETS',
        
        # Documents
        '/api/documents/': 'DOCUMENTS',
        
        # Users
        '/api/users/': 'USERS',
        
        # Companies
        '/api/companies/': 'COMPANIES',
        
        # Audit
        '/api/audit/': 'AUDIT',
    }
    
    def process_request(self, request):
        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser):
            return None
        
        user = request.user
        
        # Check if this is a protected endpoint
        path = request.path
        module = None
        
        for endpoint, module_name in self.PROTECTED_ENDPOINTS.items():
            if endpoint in path:
                module = module_name
                break
        
        if not module:
            return None  # Not a protected endpoint
        
        # Determine the action based on HTTP method
        action_map = {
            'GET': 'VIEW',
            'POST': 'CREATE',
            'PUT': 'EDIT',
            'PATCH': 'EDIT',
            'DELETE': 'DELETE',
        }
        
        action = action_map.get(request.method, 'VIEW')
        
        # Check permission
        from safecloud_api.decorators import has_permission
        
        if not has_permission(user, module, action):
            # Return 403 Forbidden for API endpoints
            if request.path.startswith('/api/'):
                return Response(
                    {
                        'detail': f'Permiso denegado para {module}.{action}',
                        'code': 'PERMISSION_DENIED'
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return None


class CustomSecurityMiddleware(MiddlewareMixin):
    """
    Custom middleware to add security headers and handle security concerns
    """
    import logging
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('django.security')
    
    def process_response(self, request, response):
        """Add security headers to response"""
        
        # Prevent Content-Type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS filter
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Prevent Clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:;"
        )
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Feature Policy
        response['Permissions-Policy'] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=()"
        )
        
        # Prevent browsers from MIME-sniffing
        response['X-Permitted-Cross-Domain-Policies'] = 'none'
        
        return response
    
    def process_request(self, request):
        """Log suspicious requests"""
        
        # Log requests from non-standard ports or suspicious patterns
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        referer = request.META.get('HTTP_REFERER', '')
        
        # Log potential security issues
        suspicious_patterns = ['<script', '../', '..\\', 'union select', 'drop table']
        request_data = str(request.POST) + str(request.GET)
        
        for pattern in suspicious_patterns:
            if pattern.lower() in request_data.lower():
                self.logger.warning(
                    f"Suspicious request pattern detected: {pattern}",
                    extra={
                        'path': request.path,
                        'method': request.method,
                        'user_agent': user_agent,
                        'referer': referer,
                    }
                )
        
        return None


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to capture device_id from request headers
    Used by SIGRA for tracking known devices across sessions
    """
    
    def process_request(self, request):
        """Capture device_id from X-Device-ID header"""
        device_id = request.META.get('HTTP_X_DEVICE_ID', None)
        
        if device_id:
            request.device_id = device_id
        else:
            request.device_id = None
        
        return None

