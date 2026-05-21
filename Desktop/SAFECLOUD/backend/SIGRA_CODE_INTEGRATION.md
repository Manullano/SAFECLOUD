# 🔗 Integrating SIGRA with Existing Code

This guide explains how to trigger SIGRA event processing throughout your SAFECLOUD application.

## 📌 Core Concept

When a significant action happens, create an `AuditLog`. SIGRA automatically processes it.

```python
from audit.models import AuditLog

AuditLog.objects.create(
    company=company,
    user=user,
    action='ACTION_TYPE',
    ip_address=get_client_ip(request),
    user_agent=request.META.get('HTTP_USER_AGENT'),
    device_id=device_id,  # from request headers or cookies
    status='SUCCESS',  # or 'FAILED', 'DENIED', 'BLOCKED'
)
# → SIGRA automatically processes this
```

## 🔄 Where to Add Logging

### 1. Authentication Views

**File**: `backend/safecloud_api/apps/auth/views.py`

```python
from rest_framework import status
from rest_framework.response import Response
from audit.models import AuditLog
from safecloud_api.middleware import get_client_ip

class LoginView(APIView):
    def post(self, request):
        # ... login logic ...
        
        user = authenticate(username=email, password=password)
        
        if user:
            # Log successful login
            AuditLog.objects.create(
                company=user.companies_set.first(),
                user=user,
                action='LOGIN',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                device_id=request.META.get('HTTP_X_DEVICE_ID'),
                status='SUCCESS',
                metadata={'login_method': 'email_password'}
            )
            return Response({'token': user.auth_token.key})
        else:
            # Log failed login
            AuditLog.objects.create(
                company=None,
                user=None,
                action='FAILED_LOGIN',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                status='FAILED',
                metadata={'username': email}
            )
            return Response({'error': 'Invalid credentials'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
```

### 2. Document Views

**File**: `backend/safecloud_api/apps/documents/views.py`

```python
from rest_framework.viewsets import ModelViewSet
from audit.models import AuditLog
from safecloud_api.middleware import get_client_ip

class DocumentViewSet(ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    def retrieve(self, request, pk=None):
        """View document"""
        document = self.get_object()
        
        # Log document view
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,
            action='VIEW_DOC',
            document=document,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
        )
        
        return super().retrieve(request, pk=pk)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Download document"""
        document = self.get_object()
        
        # Check permissions
        if not request.user.has_perm('view_document', document):
            # Log denied access
            AuditLog.objects.create(
                company=request.user.companies_set.first(),
                user=request.user,
                action='DOWNLOAD_DOC',
                document=document,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                device_id=request.META.get('HTTP_X_DEVICE_ID'),
                status='DENIED',
            )
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Log successful download
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,
            action='DOWNLOAD_DOC',
            document=document,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
            metadata={
                'file_size': document.file.size,
                'file_name': document.file.name,
            }
        )
        
        # Return file...
        return FileResponse(document.file)
    
    def create(self, request):
        """Upload document"""
        # ... create document ...
        
        # Log upload
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,
            action='UPLOAD_DOC',
            document=new_document,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, pk=None):
        """Update document"""
        document = self.get_object()
        
        # ... update logic ...
        
        # Log edit
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,
            action='EDIT_DOC',
            document=document,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
            metadata={'fields_changed': list(request.data.keys())}
        )
        
        return super().update(request, pk=pk)
    
    def destroy(self, request, pk=None):
        """Delete document"""
        document = self.get_object()
        
        # Log delete
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,
            action='DELETE_DOC',
            document=document,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
        )
        
        return super().destroy(request, pk=pk)
```

### 3. Permission Changes

**File**: `backend/safecloud_api/apps/documents/views.py`

```python
@action(detail=True, methods=['post'])
def share(self, request, pk=None):
    """Share document with other users"""
    document = self.get_object()
    
    # ... sharing logic ...
    
    # Log permission change
    AuditLog.objects.create(
        company=request.user.companies_set.first(),
        user=request.user,
        action='CHANGE_PERMISSION',
        document=document,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT'),
        device_id=request.META.get('HTTP_X_DEVICE_ID'),
        status='SUCCESS',
        metadata={
            'shared_with': request.data.get('user_ids'),
            'permission_level': request.data.get('permission'),
        }
    )
    
    return Response({'success': True})
```

### 4. User Management

**File**: `backend/safecloud_api/apps/users/views.py`

```python
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def create(self, request):
        """Create new user"""
        # ... user creation ...
        
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,  # Admin creating user
            action='CREATE_USER',
            resource_type='User',
            resource_id=new_user.id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
            metadata={'new_user_email': new_user.email}
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        old_role = user.groups.first()
        new_role = request.data.get('role')
        
        # ... role change logic ...
        
        AuditLog.objects.create(
            company=request.user.companies_set.first(),
            user=request.user,  # Admin changing role
            action='CHANGE_ROLE',
            resource_type='User',
            resource_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            device_id=request.META.get('HTTP_X_DEVICE_ID'),
            status='SUCCESS',
            metadata={
                'target_user': user.email,
                'old_role': str(old_role),
                'new_role': new_role,
            }
        )
        
        return Response({'success': True})
```

### 5. Middleware Integration

**File**: `backend/safecloud_api/middleware.py`

```python
from audit.models import AuditLog
import logging

logger = logging.getLogger('audit')

def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class AuditMiddleware:
    """Middleware to capture device_id from frontend"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Extract device_id from header
        request.device_id = request.META.get('HTTP_X_DEVICE_ID')
        
        response = self.get_response(request)
        return response
```

Add to `settings.py`:
```python
MIDDLEWARE = [
    ...
    'safecloud_api.middleware.AuditMiddleware',
]
```

### 6. Decorators for Easy Logging

Create **`backend/safecloud_api/decorators.py`**:

```python
from functools import wraps
from audit.models import AuditLog
from safecloud_api.middleware import get_client_ip

def log_action(action_type, get_resource=None):
    """
    Decorator to automatically log actions
    
    Usage:
        @log_action('DOWNLOAD_DOC', get_resource=lambda: document)
        def download_view(request, document):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                response = view_func(request, *args, **kwargs)
                status = 'SUCCESS'
            except PermissionDenied:
                status = 'DENIED'
                raise
            except Exception:
                status = 'FAILED'
                raise
            finally:
                # Get resource if function provided
                resource = get_resource(*args, **kwargs) if get_resource else None
                
                # Create audit log
                AuditLog.objects.create(
                    company=request.user.companies_set.first(),
                    user=request.user,
                    action=action_type,
                    document=resource if hasattr(resource, 'id') else None,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT'),
                    device_id=request.META.get('HTTP_X_DEVICE_ID'),
                    status=status,
                )
            
            return response
        return wrapper
    return decorator
```

Usage:
```python
from safecloud_api.decorators import log_action

@log_action('DOWNLOAD_DOC', get_resource=lambda doc_id: Document.objects.get(id=doc_id))
def download_document(request, doc_id):
    document = Document.objects.get(id=doc_id)
    return FileResponse(document.file)
```

## 📱 Frontend Integration

### Sending Device ID

Device ID should be sent in every request header:

```javascript
// frontend/lib/api.ts
const deviceId = getOrCreateDeviceId();

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`,
    'X-Device-ID': deviceId,
};
```

Generate unique device ID:
```typescript
function getOrCreateDeviceId(): string {
    const stored = localStorage.getItem('deviceId');
    if (stored) return stored;
    
    const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', newId);
    return newId;
}
```

## ✅ Checklist

- [ ] Add `AuditLog` creation in all auth views
- [ ] Add `AuditLog` creation in all document views
- [ ] Add `AuditLog` creation in user management
- [ ] Add `AuditLog` creation in permission changes
- [ ] Update middleware to capture device_id
- [ ] Frontend sends X-Device-ID header
- [ ] Test with `python manage.py shell < test_sigra.py`
- [ ] View alerts in `/admin/sigra/sigra-alert/`

## 🧪 Testing

After adding logging:

```bash
# Create test user and trigger events
python manage.py shell < test_sigra.py

# View logs in Django admin
# http://localhost:8000/admin/sigra/sigra-event/
# http://localhost:8000/admin/sigra/sigra-alert/
```

---

**Once integrated**, SIGRA automatically:
1. ✅ Processes every AuditLog
2. ✅ Calculates risk scores
3. ✅ Generates alerts
4. ✅ Sends notifications
5. ✅ Escalates critical events
