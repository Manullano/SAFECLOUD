# Ejemplo de configuración SIGRA para settings.py
# Agregay estos valores a tu archivo settings.py

# ============================================
# SIGRA Configuration
# ============================================

SIGRA_CONFIG = {
    # Habilitar/deshabilitar SIGRA
    'ENABLED': True,
    
    # Threshold para crear alerta (0-100)
    'RISK_THRESHOLD_ALERT': 50,
    
    # Threshold para escalar a crítico (0-100)
    'RISK_THRESHOLD_ESCALATE': 81,
    
    # Días para limpiar eventos antiguos
    'CLEANUP_DAYS': 90,
    
    # Usar procesamiento asincrónico con Celery
    'ASYNC_PROCESSING': True,
    
    # Timeout para procesamiento de eventos (segundos)
    'PROCESSING_TIMEOUT': 30,
}

# ============================================
# Celery Configuration
# ============================================

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Configuración de tasks
CELERY_TASK_DEFAULT_RETRY_DELAY = 60  # segundos
CELERY_TASK_MAX_RETRIES = 3
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutos

# Beat schedule para tareas periódicas
CELERY_BEAT_SCHEDULE = {
    'cleanup-old-events': {
        'task': 'safecloud_api.apps.sigra.tasks.cleanup_old_events',
        'schedule': 86400.0,  # Cada 24 horas
        'args': (90,)  # Limpiar eventos > 90 días
    },
}

# ============================================
# Logging Configuration para SIGRA
# ============================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'sigra_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/sigra.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/audit.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
        'sigra': {
            'handlers': ['console', 'sigra_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'audit': {
            'handlers': ['console', 'audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ============================================
# Apps Instaladas
# ============================================

INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Terceros
    'rest_framework',
    'corsheaders',
    'django_celery_beat',
    
    # SAFECLOUD Apps
    'safecloud_api.apps.audit',  # Auditoría de eventos
    'safecloud_api.apps.auth',
    'safecloud_api.apps.users',
    'safecloud_api.apps.companies',
    'safecloud_api.apps.documents',
    'safecloud_api.apps.projects',
    'safecloud_api.apps.tickets',
    'safecloud_api.apps.notifications',
    'safecloud_api.apps.sigra',  # 🔒 SIGRA - Security Intelligence Engine
]

# ============================================
# REST Framework Configuration
# ============================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
}

# ============================================
# CORS Configuration para desarrollo
# ============================================

if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
    ]

# ============================================
# Base de datos - PostgreSQL
# ============================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'safecloud'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# ============================================
# Caché - Redis
# ============================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# ============================================
# Seguridad
# ============================================

# En producción, establecer a True
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Permitir acceso desde frontend
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# ============================================
# Tamaño máximo de carga de archivos
# ============================================

DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
