from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from safecloud_api.apps.auth.views import (
    CustomTokenObtainPairView, LoginView, RegisterView, current_user,
    setup_two_factor, verify_two_factor_setup, verify_two_factor_login,
    get_two_factor_status, disable_two_factor, regenerate_backup_codes
)

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', current_user, name='current_user'),
    # 2FA Endpoints
    path('2fa/setup/', setup_two_factor, name='setup_2fa'),
    path('2fa/verify-setup/', verify_two_factor_setup, name='verify_2fa_setup'),
    path('2fa/verify-login/', verify_two_factor_login, name='verify_2fa_login'),
    path('2fa/status/', get_two_factor_status, name='2fa_status'),
    path('2fa/disable/', disable_two_factor, name='disable_2fa'),
    path('2fa/regenerate-codes/', regenerate_backup_codes, name='regenerate_backup_codes'),
]
