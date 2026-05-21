import os
from datetime import timedelta
from decouple import config
import logging.handlers

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENVIRONMENT = config('ENVIRONMENT', default='development')  # development, staging, production

# ===================== SECURITY & ENVIRONMENT =====================
SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=ENVIRONMENT != 'production', cast=bool)

# CRITICAL: Ensure DEBUG is False in production
if ENVIRONMENT == 'production' and DEBUG:
    raise ValueError("DEBUG must be False in production!")

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
TRUSTED_ORIGINS = config('TRUSTED_ORIGINS', default='http://localhost:3000').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'django_filters',
    'django_celery_beat',
    'django_celery_results',
    
    # Local apps
    'safecloud_api.apps.auth',
    'safecloud_api.apps.users',
    'safecloud_api.apps.companies',
    'safecloud_api.apps.projects',
    'safecloud_api.apps.documents',
    'safecloud_api.apps.tickets',
    'safecloud_api.apps.audit',
    'safecloud_api.apps.notifications',
    'safecloud_api.apps.sigra',  # 🔒 SIGRA - Security Intelligence Engine
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files with compression
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'safecloud_api.middleware.CustomSecurityMiddleware',  # Custom security headers
    'safecloud_api.middleware.AuditMiddleware',  # Capture device_id for SIGRA
]

ROOT_URLCONF = 'safecloud_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'safecloud_api.wsgi.application'

# ===================== DATABASE CONFIGURATION =====================
if ENVIRONMENT == 'production':
    # PostgreSQL for production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='safecloud_db'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='db'),
            'PORT': config('DB_PORT', default='5432', cast=int),
            'CONN_MAX_AGE': 600,  # Connection pooling
            'OPTIONS': {
                'connect_timeout': 10,
                'sslmode': 'require' if config('DB_SSL', default=False, cast=bool) else 'prefer',
            }
        }
    }
else:
    # SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework / JWT Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']

# ===================== SECURITY HEADERS & PROTECTIONS =====================
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'"),
    'style-src': ("'self'", "'unsafe-inline'"),
    'img-src': ("'self'", "data:", "https:"),
    'font-src': ("'self'", "data:"),
}

# Session & Cookie Security
SESSION_COOKIE_SECURE = ENVIRONMENT == 'production'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 86400  # 24 hours
CSRF_COOKIE_SECURE = ENVIRONMENT == 'production'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = TRUSTED_ORIGINS

# HTTPS/SSL Settings
if ENVIRONMENT == 'production':
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
USE_S3 = config('USE_S3', default=False, cast=bool)

# Auth User Model
AUTH_USER_MODEL = 'companies.User'

# ===================== ADVANCED LOGGING =====================
LOG_LEVEL = config('LOG_LEVEL', default='INFO' if ENVIRONMENT == 'production' else 'DEBUG')
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'safecloud.log'),
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json' if ENVIRONMENT == 'production' else 'verbose',
        },
        'security_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'security.log'),
            'maxBytes': 10485760,
            'backupCount': 20,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'security_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'safecloud_api': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
        },
        'sigra': {
            'handlers': ['console', 'security_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'audit': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': LOG_LEVEL,
    },
}

# ===================== REDIS CONFIGURATION =====================
REDIS_HOST = config('REDIS_HOST', default='redis')
REDIS_PORT = config('REDIS_PORT', default='6379')
REDIS_DB = config('REDIS_DB', default='0')
REDIS_PASSWORD = config('REDIS_PASSWORD', default='')
REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}" if REDIS_PASSWORD else f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        }
    }
}

# ===================== CELERY CONFIGURATION =====================
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIME_ZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_RESULT_EXPIRES = 3600  # 1 hour
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Celery Beat Schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
    'cleanup-old-sigra-events': {
        'task': 'safecloud_api.apps.sigra.tasks.cleanup_old_events',
        'schedule': 86400.0,  # Run every 24 hours
        'args': (90,),  # Keep events for 90 days
    },
}

# ===================== EMAIL CONFIGURATION =====================
if ENVIRONMENT == 'production':
    EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = config('EMAIL_PORT', default='587', cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
        raise ValueError("Email credentials must be set in production!")
else:
    # Development: use console backend
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@safecloud.com')

# Notification settings
NOTIFICATION_EMAIL_TIMEOUT = 60  # seconds
NOTIFICATION_RETENTION_DAYS = 30  # Keep notifications for 30 days
NOTIFICATION_BATCH_SIZE = 100  # Process notifications in batches

# ===================== RATE LIMITING & THROTTLING =====================
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = (
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle'
)
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/hour',
    'user': '1000/hour',
    'login': '5/minute',  # Strict limit for login attempts
}

# ===================== SECURITY & MONITORING =====================
# Allowed file types for uploads
ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'jpg', 'png', 'gif']
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

# Health check endpoint
HEALTH_CHECK_URL = '/api/health/'

# Session timeout
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 86400  # 24 hours

# Password reset token timeout
PASSWORD_RESET_TIMEOUT = 3600  # 1 hour

# 2FA token timeout
TWO_FACTOR_TOKEN_TIMEOUT = 300  # 5 minutes

# Enable/Disable features
FEATURES = {
    'ENABLE_2FA': config('ENABLE_2FA', default=True, cast=bool),
    'ENABLE_NOTIFICATIONS': config('ENABLE_NOTIFICATIONS', default=True, cast=bool),
    'ENABLE_AUDIT_LOGGING': config('ENABLE_AUDIT_LOGGING', default=True, cast=bool),
    'ENABLE_EMAIL_NOTIFICATIONS': config('ENABLE_EMAIL_NOTIFICATIONS', default=ENVIRONMENT == 'production', cast=bool),
    'ENABLE_SIGRA': config('ENABLE_SIGRA', default=True, cast=bool),
}

# ===================== SIGRA CONFIGURATION =====================
SIGRA_CONFIG = {
    # Global enable/disable
    'ENABLED': FEATURES['ENABLE_SIGRA'],
    
    # Risk scoring thresholds
    'RISK_THRESHOLD_ALERT': 50,        # Create alert if score >= 50
    'RISK_THRESHOLD_ESCALATE': 81,     # Escalate if score >= 81 (CRITICAL)
    'CLEANUP_DAYS': 90,                # Clean events older than 90 days
    
    # Processing
    'ASYNC_PROCESSING': True,           # Use Celery for async processing
    'PROCESSING_TIMEOUT': 30,           # Max seconds per event processing
    
    # Scoring tweaks (optional overrides)
    'BASE_SCORES': {
        'ANOMALOUS_TIME': 15,
        'UNKNOWN_IP': 20,
        'UNKNOWN_DEVICE': 20,
        'FAILED_LOGIN': 15,
        'MASS_DOWNLOAD': 25,
        'CRITICAL_DOC': 30,
        'PERMISSION_CHANGE': 25,
        'ROLE_ANOMALY': 25,
        'EXPORT_ATTEMPT': 35,
    },
    
    # Notification channels
    'NOTIFICATION_CHANNELS': ['in_app', 'email', 'sms'],
    'NOTIFY_ON_MEDIUM': True,      # Send notifications for MEDIUM+ alerts
    'NOTIFY_ON_HIGH': True,        # Send notifications for HIGH+ alerts
    'NOTIFY_ON_CRITICAL': True,    # Send notifications for CRITICAL alerts
}

# Sentry Integration (Optional)
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1 if ENVIRONMENT == 'production' else 1.0,
        send_default_pii=False,
        environment=ENVIRONMENT,
    )
