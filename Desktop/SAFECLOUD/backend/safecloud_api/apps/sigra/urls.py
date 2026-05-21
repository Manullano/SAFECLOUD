from django.urls import path, include
from rest_framework.routers import DefaultRouter
from safecloud_api.apps.sigra.views import (
    SIGRAEventViewSet,
    SIGRAAlertViewSet,
    UserRiskViewSet,
    AnomalyDetectionViewSet,
)

router = DefaultRouter()
router.register(r'events', SIGRAEventViewSet, basename='sigra-events')
router.register(r'alerts', SIGRAAlertViewSet, basename='sigra-alerts')
router.register(r'risk-score', UserRiskViewSet, basename='risk-score')
router.register(r'anomalies', AnomalyDetectionViewSet, basename='anomalies')

urlpatterns = [
    path('', include(router.urls)),
]
