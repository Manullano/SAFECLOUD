from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from safecloud_api.apps.core.health import health_check, readiness_check, liveness_check

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ===================== HEALTH CHECKS =====================
    path('api/health/', health_check, name='health-check'),
    path('api/ready/', readiness_check, name='readiness-check'),
    path('api/alive/', liveness_check, name='liveness-check'),
    
    # API Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API Endpoints
    path('api/auth/', include('safecloud_api.apps.auth.urls')),
    path('api/users/', include('safecloud_api.apps.users.urls')),
    path('api/companies/', include('safecloud_api.apps.companies.urls')),
    path('api/projects/', include('safecloud_api.apps.projects.urls')),
    path('api/documents/', include('safecloud_api.apps.documents.urls')),
    path('api/tickets/', include('safecloud_api.apps.tickets.urls')),
    path('api/audit/', include('safecloud_api.apps.audit.urls')),
    path('api/notifications/', include('safecloud_api.apps.notifications.urls')),
    path('api/sigra/', include('safecloud_api.apps.sigra.urls')),  # SIGRA security monitoring
]
