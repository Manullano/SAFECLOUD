# 🚀 Quick Start Guide - SAFECLOUD

## 📋 Prerequisites

- Python 3.8+ (with venv)
- Node.js 16+ (with npm)
- Git

## 🔧 Installation

### 1. Clone Repository
```bash
cd c:\Users\mllan\Desktop
git clone https://github.com/yourusername/SAFECLOUD.git
cd SAFECLOUD
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations (if not done)
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build frontend (optional, for production)
npm run build
```

---

## ▶️ Running the Application

### Development Mode (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

### Production Mode (Docker)

```bash
docker-compose up

# Or build + run
docker-compose up --build
```

---

## 🧪 Running Tests

### Backend Tests (All 51 Tests)

```bash
cd backend

# Run all tests (recommended)
python test_comprehensive.py      # 10 tests - CRUD
python test_2fa.py               # 20 tests - 2FA
python test_notification_api.py   # 21 tests - Notifications

# Or use Django test runner
python manage.py test

# Or with pytest
pytest
```

### Frontend Build Test

```bash
cd frontend
npm run build    # Should complete with 0 errors
```

### Integration Test (Requires both servers running)

```bash
cd backend
python test_integration.py    # Tests frontend↔backend connectivity
```

---

## 🎯 Key Features Demo

### 1. Login & 2FA Setup

1. Go to http://localhost:3000/login
2. Register a new account or use test account
3. Navigate to Settings → Security → 2FA Setup
4. Enable 2FA (scan QR code with authenticator app)
5. Verify with 6-digit code
6. Save backup codes in secure location

### 2. Test 2FA Login

1. Logout
2. Login again
3. After password, you'll see 2FA verification screen
4. Enter 6-digit code from authenticator app
5. Or use backup code (8 characters)

### 3. Notification Center

1. Go to http://localhost:3000/notifications/center
2. View all notifications
3. Mark as read/unread
4. Set preferences (email toggles, digest frequency)
5. Export notifications (CSV/JSON)

### 4. Audit Log

1. Go to Settings → Security → Audit Log
2. View all security events
3. Filter by action type
4. Search by user/entity
5. Export events (CSV/JSON)

---

## 📁 Project Structure

```
SAFECLOUD/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   ├── safecloud_api/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── apps/
│   │   │   ├── auth/           # 2FA system
│   │   │   ├── notifications/  # Notification system
│   │   │   ├── audit/          # Audit logging
│   │   │   ├── users/          # User management
│   │   │   └── ...
│   │   └── core/               # Shared utilities
│   ├── test_2fa.py
│   ├── test_notification_api.py
│   ├── test_comprehensive.py
│   └── test_integration.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── dashboard.tsx
│   │   ├── notifications/
│   │   │   └── center.tsx      # Notification center
│   │   └── settings/
│   │       └── security/
│   │           ├── index.tsx   # Security hub
│   │           ├── 2fa-setup.tsx
│   │           └── audit-log.tsx
│   ├── components/
│   │   ├── TwoFactorStatus.tsx
│   │   ├── NotificationList.tsx
│   │   ├── NotificationPreferences.tsx
│   │   ├── NotificationWidget.tsx
│   │   ├── AuditLogList.tsx
│   │   └── ...
│   └── lib/
│       └── api.ts             # Axios client
│
├── docker-compose.yml
├── INTEGRATION_GUIDE.md         # Full integration docs
├── FINAL_STATUS_REPORT.md       # Complete status report
└── README.md
```

---

## 🔑 Environment Variables

### Backend (.env)

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/safecloud

# JWT
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=3600  # 1 hour

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# Redis (optional, for Celery)
REDIS_URL=redis://localhost:6379/0

# 2FA
TWO_FACTOR_PATCH_ADMIN=True
OTP_TOTP_ISSUER=SAFECLOUD
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=SAFECLOUD
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check Python version
python --version  # Should be 3.8+

# Check Django setup
python manage.py check

# Migrate database
python manage.py migrate

# Clear cache
python manage.py clear_cache
```

### Frontend Won't Build

```bash
# Clear cache
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Port Already in Use

```bash
# Backend (change port)
python manage.py runserver 0.0.0.0:8001

# Frontend (change port)
next dev -p 3001
```

### Database Issues

```bash
# Reset database
python manage.py migrate zero

# Re-migrate
python manage.py migrate

# Create new superuser
python manage.py createsuperuser
```

---

## 📊 Verify Installation

Run verification script:

```bash
cd backend
python verify_integration.py
```

Expected output: All checks pass (✅)

---

## 📞 Support

### Documentation
- [FINAL_STATUS_REPORT.md](FINAL_STATUS_REPORT.md) - Complete status
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - API documentation

### Tests
- Backend: `python test_comprehensive.py` (10 tests)
- 2FA: `python test_2fa.py` (20 tests)
- Notifications: `python test_notification_api.py` (21 tests)

### Logs
- Backend: `python manage.py runserver` (console output)
- Frontend: `npm run dev` (console output)

---

## ✅ Deployment Checklist

- [ ] All tests passing (51/51)
- [ ] Build successful (`npm run build`)
- [ ] Security settings configured
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Static files collected
- [ ] Logs configured
- [ ] Monitoring enabled
- [ ] Backup plan prepared

---

## 🎉 You're Ready!

SAFECLOUD is fully functional and ready to use. Enjoy!
