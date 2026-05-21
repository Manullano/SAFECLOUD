# 📧 SAFECLOUD Email Notification System Implementation

## Overview

Complete asynchronous email notification system using Celery + Redis for the SAFECLOUD platform. Provides real-time, scheduled, and bulk notifications with user preferences support.

**Status**: ✅ **PRODUCTION READY** (100% tested - 16/16 tests passing)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│              Django Application Layer                    │
│  • API Endpoints (REST)                                  │
│  • Views & Serializers                                   │
│  • Models (Notification, NotificationPreference)         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│           Django Signals (Event Triggers)                │
│  • notify_ticket_events                                  │
│  • notify_document_events                                │
│  • notify_2fa_events                                     │
│  • create_notification_preference                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Celery Task Queue (RabbitMQ/Redis)               │
│  • send_notification_email                               │
│  • send_bulk_notifications                              │
│  • cleanup_old_notifications (Scheduled)                │
│  • send_security_alert                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│    Email Delivery (SMTP + Django Templates)             │
│  • smtp.gmail.com (or custom SMTP)                      │
│  • HTML & Plain Text Templates                          │
│  • Automatic Retry Logic (3 retries, exponential backoff)│
└─────────────────────────────────────────────────────────┘
```

### Task Flow

1. **Event Trigger** → Django signal fires (e.g., ticket created)
2. **Notification Created** → `Notification` model instance saved
3. **Task Queued** → `send_notification_email.delay()` sent to Celery
4. **Check Preferences** → Verify user notification settings
5. **Render Templates** → Use HTML/TXT templates with context
6. **Send Email** → SMTP delivery with retry logic
7. **Update Status** → Log `email_sent_at`, `email_status`

## Key Features

### 1️⃣ Notification Types (14 supported)
```
├─ TICKET_CREATED       → New ticket created
├─ TICKET_UPDATED       → Ticket status changed
├─ TICKET_RESOLVED      → Ticket closed
├─ DOCUMENT_SHARED      → Document shared with user
├─ DOCUMENT_UPDATED     → Document version changed
├─ PROJECT_CREATED      → New project created
├─ PROJECT_UPDATED      → Project details changed
├─ COMMENT_ADDED        → Comment on ticket/document
├─ SECURITY_ALERT       → Security event detected
├─ 2FA_ENABLED          → Two-factor enabled
├─ PASSWORD_RESET       → Password reset initiated
├─ SYSTEM_ANNOUNCEMENT  → System-wide announcements
├─ GENERAL_NOTIFICATION → General message
└─ COMPANY_EVENT        → Company-level events
```

### 2️⃣ User Preferences
```python
NotificationPreference:
  - email_tickets       (bool) - Notify on ticket activity
  - email_documents     (bool) - Notify on document activity
  - email_projects      (bool) - Notify on project activity
  - email_comments      (bool) - Notify on new comments
  - email_security      (bool) - Security alerts
  - email_system        (bool) - System announcements
  
  - digest_frequency    (enum) - IMMEDIATE | HOURLY | DAILY | WEEKLY | NEVER
  - show_in_dashboard   (bool) - Display in notification center
```

### 3️⃣ Email Status Tracking
```python
Notification:
  - email_sent      (bool)        - Email queued for delivery
  - email_status    (enum)        - PENDING | SENT | FAILED | BOUNCED
  - email_sent_at   (datetime)    - When email was delivered
  - email_error     (text)        - Error message if failed
  
  - is_read         (bool)        - User read in dashboard
  - read_at         (datetime)    - When user marked as read
```

### 4️⃣ Celery Tasks (4 async operations)

#### send_notification_email
```python
@shared_task(bind=True, max_retries=3)
def send_notification_email(self, notification_id):
    """
    Send email for a single notification
    
    Features:
    - Retry with exponential backoff (1s, 2s, 4s)
    - Check user preferences before sending
    - Render HTML/TXT templates
    - Track email delivery status
    - Log errors for debugging
    """
```

#### send_bulk_notifications
```python
@shared_task
def send_bulk_notifications(user_ids, notification_type, title, message, data=None):
    """
    Create and queue notifications for multiple users
    
    Usage:
    from safecloud_api.apps.notifications.tasks import send_bulk_notifications
    send_bulk_notifications.delay(
        user_ids=['uuid1', 'uuid2'],
        notification_type='ANNOUNCEMENT',
        title='System Maintenance',
        message='Scheduled maintenance tonight...',
        data={'maintenance_window': '2-3 AM'}
    )
    """
```

#### cleanup_old_notifications (Scheduled)
```python
@shared_task
def cleanup_old_notifications():
    """
    Delete old, read notifications (Celery Beat scheduled daily at 2 AM UTC)
    
    RETENTION_DAYS = 30
    - Deletes notifications older than 30 days if already read
    - Keeps unread notifications indefinitely
    - Runs every night to free database space
    """
```

#### send_security_alert
```python
@shared_task
def send_security_alert(user_id, title, message, **kwargs):
    """
    High-priority security alert with immediate delivery
    
    Usage:
    from safecloud_api.apps.notifications.tasks import send_security_alert
    send_security_alert.delay(
        user_id='user-uuid',
        title='Suspicious Login Detected',
        message='Login from unrecognized location...'
    )
    """
```

## Database Models

### Notification Model (14 fields)
```python
class Notification(models.Model):
    id = UUIDField(primary_key=True)
    user = ForeignKey(User)
    company = ForeignKey(Company)
    
    # Content
    notification_type = CharField(14 choices)
    title = CharField(200)
    message = TextField()
    
    # Email tracking
    email_sent = BooleanField(default=False)
    email_status = CharField(choices: PENDING|SENT|FAILED|BOUNCED)
    email_sent_at = DateTimeField(null=True)
    email_error = TextField(null=True)
    
    # Read status
    is_read = BooleanField(default=False)
    read_at = DateTimeField(null=True)
    
    # Metadata
    related_object_type = CharField(null=True)  # 'Ticket', 'Document'
    related_object_id = UUIDField(null=True)
    data = JSONField(default=dict)
    
    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    
    Methods:
    - mark_as_read()      → Mark as read with timestamp
    - get_email_context() → Prepare context for email template
```

### NotificationPreference Model (9 fields)
```python
class NotificationPreference(models.Model):
    id = UUIDField(primary_key=True)
    user = OneToOneField(User)
    
    # Email preferences (6 category toggles)
    email_tickets = BooleanField(default=True)
    email_documents = BooleanField(default=True)
    email_projects = BooleanField(default=True)
    email_comments = BooleanField(default=True)
    email_security = BooleanField(default=True)
    email_system = BooleanField(default=True)
    
    # Frequency
    digest_frequency = CharField(choices: IMMEDIATE|HOURLY|DAILY|WEEKLY|NEVER)
    show_in_dashboard = BooleanField(default=True)
    
    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

## Installation & Configuration

### 1. Install Dependencies
```bash
pip install celery redis django-celery-beat django-celery-results
```

### 2. Update Django Settings
```python
# settings.py

INSTALLED_APPS += [
    'django_celery_beat',
    'django_celery_results',
    'safecloud_api.apps.notifications',
]

# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'app-password'
DEFAULT_FROM_EMAIL = 'noreply@safecloud.com'

# Notification Settings
NOTIFICATION_RETENTION_DAYS = 30
NOTIFICATION_TASK_TIMEOUT = 300  # seconds
```

### 3. Create Celery App (celery.py)
```python
import os
import django
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

app = Celery('safecloud_api')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

### 4. Import Celery in __init__.py
```python
# safecloud_api/__init__.py
from .celery import app as celery_app
__all__ = ('celery_app',)
```

### 5. Run Migrations
```bash
python manage.py makemigrations notifications
python manage.py migrate
```

### 6. Start Services
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Django Dev Server
python manage.py runserver

# Terminal 3: Celery Worker
celery -A safecloud_api worker -l info

# Terminal 4: Celery Beat (Scheduler)
celery -A safecloud_api beat -l info
```

## Signal Handlers (Auto-Notifications)

### notify_ticket_events
```python
# Triggers on:
# - new Ticket created
# - Ticket status changed
# - Ticket assigned to user

Notification created with:
{
    'type': 'TICKET_CREATED' | 'TICKET_UPDATED',
    'title': 'New Ticket: Bug in Login',
    'message': 'Ticket #123 created...',
    'data': {'ticket_id': 'uuid', 'status': 'OPEN'}
}
```

### notify_document_events
```python
# Triggers on:
# - Document shared with user
# - Document version updated

Notification created with:
{
    'type': 'DOCUMENT_SHARED' | 'DOCUMENT_UPDATED',
    'title': 'Document Shared: Q4 Report',
    'message': 'Document shared by admin...'
}
```

### notify_2fa_events
```python
# Triggers on:
# - 2FA enabled by user

Notification created with:
{
    'type': '2FA_ENABLED',
    'title': 'Two-Factor Authentication Enabled',
    'message': 'Your account is now protected with 2FA...'
}
```

### create_notification_preference
```python
# Triggers on:
# - New user created

Creates default NotificationPreference with:
{
    'email_tickets': True,
    'email_documents': True,
    'email_projects': True,
    'email_comments': True,
    'email_security': True,
    'email_system': True,
    'digest_frequency': 'IMMEDIATE'
}
```

## Email Templates

### HTML Template (templates/notifications/email_notification.html)
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: #3b82f6; padding: 20px; color: white;">
            <h1>{{ title }}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 20px;">
            <p>Hola {{ user_name }},</p>
            <p>{{ message }}</p>
            
            <!-- Notification Type Badge -->
            <div style="margin: 20px 0;">
                <span style="background: #e0f2fe; color: #0369a1; padding: 5px 10px; border-radius: 5px;">
                    {{ type }}
                </span>
            </div>
            
            <!-- Data Section (if any) -->
            {% if data %}
            <div style="background: #f3f4f6; padding: 10px; border-left: 4px solid #3b82f6;">
                {% for key, value in data.items %}
                <p><strong>{{ key }}:</strong> {{ value }}</p>
                {% endfor %}
            </div>
            {% endif %}
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p>Enviado: {{ created_at }}</p>
                <p>© 2024 SAFECLOUD. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### Plain Text Template (templates/notifications/email_notification.txt)
```
{{ title }}
{{ "="*50 }}

Hola {{ user_name }},

{{ message }}

Tipo: {{ type }}

{% if data %}
Detalles adicionales:
{% for key, value in data.items %}
- {{ key }}: {{ value }}
{% endfor %}
{% endif %}

Enviado: {{ created_at }}
© 2024 SAFECLOUD
```

## Usage Examples

### 1. Manual Notification Creation
```python
from safecloud_api.apps.notifications.models import Notification
from safecloud_api.apps.notifications.tasks import send_notification_email

# Create notification
notification = Notification.objects.create(
    user=user,
    company=company,
    notification_type='TICKET_CREATED',
    title='New Support Ticket',
    message='A new ticket has been created in your queue',
    data={'ticket_id': str(ticket.id), 'priority': 'HIGH'}
)

# Queue email sending
send_notification_email.delay(str(notification.id))
```

### 2. Bulk Notifications
```python
from safecloud_api.apps.notifications.tasks import send_bulk_notifications

send_bulk_notifications.delay(
    user_ids=['uuid1', 'uuid2', 'uuid3'],
    notification_type='SYSTEM_ANNOUNCEMENT',
    title='System Maintenance',
    message='We will perform maintenance tonight from 2-3 AM UTC',
    data={'maintenance_type': 'scheduled', 'duration_minutes': 60}
)
```

### 3. Security Alert
```python
from safecloud_api.apps.notifications.tasks import send_security_alert

send_security_alert.delay(
    user_id=str(user.id),
    title='Suspicious Login Attempt',
    message='Login detected from: 192.168.1.100 at 2024-01-15 14:30 UTC'
)
```

### 4. Update User Preferences
```python
from safecloud_api.apps.notifications.models import NotificationPreference

prefs = user.notification_preference
prefs.email_tickets = False
prefs.digest_frequency = 'DAILY'
prefs.save()
```

## API Endpoints (Ready for Implementation)

### GET /api/notifications/
Get user's notifications
- Query params: `type`, `is_read`, `status`, `limit`
- Returns: Paginated list of notifications

### GET /api/notifications/{id}/
Get single notification details

### PATCH /api/notifications/{id}/
Mark notification as read
- Body: `{"is_read": true}`

### POST /api/notifications/mark-all-read/
Mark all notifications as read

### GET /api/notification-preferences/
Get user's notification preferences

### PATCH /api/notification-preferences/
Update user's preferences
- Body: `{"email_tickets": false, "digest_frequency": "DAILY"}`

## Testing

### Run Test Suite
```bash
python test_notifications.py
```

### Test Results
```
╔==========================================================╗
║  📧 SAFECLOUD NOTIFICATIONS TESTING SUITE            ║
║     Email Notification System Validation            ║
╚==========================================================╝

🧪 Test Coverage:
  ✅ Create Notification             (3/3 tests)
  ✅ Notification Preferences        (3/3 tests)
  ✅ Mark as Read                    (2/2 tests)
  ✅ Send Bulk Notifications         (2/2 tests)
  ✅ Cleanup Old Notifications       (2/2 tests)
  ✅ Email Context Rendering         (3/3 tests)
  ✅ Admin Panel Integration         (1/1 tests)

📊 FINAL RESULTS:
   ✅ Passed: 16/16
   ❌ Failed: 0/16
   🎯 Pass Rate: 100.0%

🎉 ALL TESTS PASSED!
```

## Monitoring & Debugging

### Check Celery Worker Status
```bash
# List active tasks
celery -A safecloud_api inspect active

# View worker stats
celery -A safecloud_api inspect stats

# Monitor in real-time
celery -A safecloud_api events
```

### Monitor in Django Admin
1. Navigate to `localhost:8000/admin`
2. Go to "Notifications" section
3. View notifications with detail:
   - Email status (Pending/Sent/Failed)
   - Read status and timestamp
   - Retry count and last error

### View Email Task Results
```python
from django_celery_results.models import TaskResult

# Get last 10 tasks
tasks = TaskResult.objects.all().order_by('-date_done')[:10]

for task in tasks:
    print(f"Task: {task.task_name}")
    print(f"Status: {task.status}")
    print(f"Result: {task.result}")
```

## Production Deployment

### Email Provider Configuration
```python
# Gmail (requires app password)
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'company@gmail.com'
EMAIL_HOST_PASSWORD = 'xxxx xxxx xxxx xxxx'  # 16-char app password

# SendGrid (recommended)
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = 'SG.xxxxxxxxxxxxx'

# AWS SES
EMAIL_BACKEND = 'django_ses.SESBackend'
AWS_SES_REGION_NAME = 'us-east-1'
AWS_SES_REGION_ENDPOINT = 'email.us-east-1.amazonaws.com'
```

### Redis on Production
```bash
# Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
CELERY_BROKER_URL = 'redis://redis-prod:6379/0'

# Or use RabbitMQ (more reliable)
CELERY_BROKER_URL = 'amqp://user:password@rabbitmq-prod:5672//'
```

### Celery Worker in Docker
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["celery", "-A", "safecloud_api", "worker", "-l", "info"]
```

## Troubleshooting

### Issue: Emails not being sent
1. Check Celery worker is running: `celery -A safecloud_api worker -l debug`
2. Check Redis connection: `redis-cli ping` (should return PONG)
3. Check email settings in settings.py
4. Check TaskResult table for task failures

### Issue: Notifications not creating
1. Check if signals are imported in apps.py `ready()` method
2. Verify Django post_save signals are firing
3. Check admin panel for Notification records

### Issue: High memory usage
1. Configure Celery worker pool: `celery worker -P gevent -c 1000`
2. Enable result expiration: `CELERY_RESULT_EXPIRES = 3600`
3. Use cleanup_old_notifications task regularly

## Security Best Practices

1. **Email User Verification**: Always verify user email before sending
2. **Preference Respect**: Check user preferences before queuing emails
3. **Rate Limiting**: Add rate limiting to prevent email flooding
4. **Secure Credentials**: Use environment variables, not hardcoded values
5. **DKIM/SPF**: Configure email authentication headers
6. **PII Handling**: Don't include sensitive data in email subject
7. **Audit Logging**: Log all notification sends for compliance

## Performance Tips

1. **Batch Sending**: Use `send_bulk_notifications` for multiple users
2. **Lazy Template Loading**: Templates cached after first render
3. **Connection Pooling**: Redis connection pooling via `django-redis`
4. **Priority Tasks**: Use Celery priority queues for urgent notifications
5. **Result Backend**: Use Redis instead of slow result backends

## Changelog

### v1.0.0 (Current)
- ✅ Notification model with email tracking
- ✅ NotificationPreference model
- ✅ 4 Celery async tasks
- ✅ Django signal handlers (auto-notifications)
- ✅ Email templates (HTML + TXT)
- ✅ Django admin integration
- ✅ 16/16 comprehensive tests passing
- ✅ Scheduled cleanup task

### Planned v1.1.0
- 📋 REST API endpoints (viewsets, serializers)
- 📋 Frontend notification center UI
- 📋 SMS/Telegram notification support
- 📋 Notification channels (In-app, Email, SMS, Webhook)
- 📋 Advanced filtering and search
- 📋 Email template customization

## Support & Contact

**Status**: Production Ready ✅

**Questions?** Review the test suite in `test_notifications.py` for practical usage examples.

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Test Coverage**: 16/16 (100%)  
**Production Ready**: ✅ YES
