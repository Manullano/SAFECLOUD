"""
Health check views for production monitoring
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import json
import logging

logger = logging.getLogger('django')


def health_check(request):
    """
    Simple health check endpoint
    Returns 200 if application is ready
    """
    return JsonResponse(
        {
            'status': 'healthy',
            'service': 'safecloud-api',
        },
        status=200
    )


def readiness_check(request):
    """
    Detailed readiness check
    Verifies database and cache connectivity
    """
    checks = {
        'status': 'ready',
        'database': False,
        'cache': False,
        'service': 'safecloud-api',
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks['database'] = False
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            checks['cache'] = True
    except Exception as e:
        logger.warning(f"Cache health check failed: {e}")
        checks['cache'] = False
    
    # Return 503 if critical service is down
    status_code = 200 if all([checks['database'], checks['cache']]) else 503
    
    return JsonResponse(checks, status=status_code)


def liveness_check(request):
    """
    Liveness check - just verify the process is running
    """
    return JsonResponse({'status': 'alive'}, status=200)
