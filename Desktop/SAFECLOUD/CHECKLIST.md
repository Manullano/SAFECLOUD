# ✅ SAFECLOUD - Installation & Verification Checklist

Use this checklist to verify your SAFECLOUD installation is complete and working correctly.

## 📋 Pre-Installation Checklist

- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (if cloning repository)
- [ ] At least 5GB free disk space
- [ ] Ports 3000, 8000 available (or willing to change)
- [ ] PostgreSQL 12+ (optional, for production)

## 🔧 Backend Setup Checklist

### 1. Create Virtual Environment
- [ ] Navigate to backend folder: `cd backend`
- [ ] Create venv: `python -m venv venv`
- [ ] Activate venv: `venv\Scripts\activate` (Windows)
- [ ] Verify activation (prompt should show `(venv)`)

### 2. Install Dependencies
- [ ] Run: `pip install -r requirements.txt`
- [ ] Check for errors (should complete without errors)
- [ ] Verify key packages:
  - [ ] Django 4.2.7: `pip show django`
  - [ ] DRF 3.14: `pip show djangorestframework`
  - [ ] PyOTP: `pip show pyotp`

### 3. Database Setup
- [ ] Run migrations: `python manage.py migrate`
- [ ] Verify no errors
- [ ] Check db.sqlite3 created: `ls db.sqlite3`
- [ ] Create superuser (optional): `python manage.py createsuperuser`

### 4. Backend Verification
- [ ] Run: `python manage.py check`
- [ ] Expected output: `System check identified no issues (0 silenced)`
- [ ] All apps registered:
  - [ ] auth
  - [ ] notifications
  - [ ] audit
  - [ ] users
  - [ ] companies
  - [ ] projects
  - [ ] tickets
  - [ ] documents

## 🎨 Frontend Setup Checklist

### 1. Install Dependencies
- [ ] Navigate to frontend folder: `cd frontend`
- [ ] Run: `npm install`
- [ ] Check for errors (should complete without errors)
- [ ] Verify package.json dependencies:
  - [ ] next@14.2.35
  - [ ] react@18.3.1
  - [ ] typescript@5.x
  - [ ] tailwindcss@3.x

### 2. Environment Setup
- [ ] Check `.env.local` exists (optional)
- [ ] Verify `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- [ ] Or use default (localhost:8000)

### 3. TypeScript Verification
- [ ] Run: `npx tsc --noEmit`
- [ ] Expected output: No errors
- [ ] Check for warnings (should be minimal)

### 4. Frontend Build
- [ ] Run: `npm run build`
- [ ] Expected output: ✓ Compiled successfully
- [ ] Verify no TypeScript errors
- [ ] Check bundle size (~89.9 kB)

## 🧪 Backend Tests Checklist

### Prerequisites
- [ ] Backend running: `python manage.py runserver 0.0.0.0:8000`
- [ ] Server accessible: http://localhost:8000
- [ ] Database migrations complete

### Run Tests
- [ ] CRUD Tests: `python test_comprehensive.py`
  - [ ] Expected: 10/10 PASSED ✅
  - [ ] Time: ~15 seconds
  
- [ ] 2FA Tests: `python test_2fa.py`
  - [ ] Expected: 20/20 PASSED ✅
  - [ ] Time: ~25 seconds
  
- [ ] Notification Tests: `python test_notification_api.py`
  - [ ] Expected: 21/21 PASSED ✅
  - [ ] Time: ~20 seconds

### Integration Tests
- [ ] Both servers running (backend + frontend)
- [ ] Run: `python test_integration.py`
- [ ] Check connectivity tests pass

## 🚀 Running Development Servers

### Terminal 1 - Backend
- [ ] Navigate to `backend` folder
- [ ] Activate venv: `venv\Scripts\activate`
- [ ] Run: `python manage.py runserver 0.0.0.0:8000`
- [ ] Expected output: `Starting development server at http://0.0.0.0:8000`
- [ ] Server accessible: http://localhost:8000

### Terminal 2 - Frontend
- [ ] Navigate to `frontend` folder
- [ ] Run: `npm run dev`
- [ ] Expected output: `ready - started server on 0.0.0.0:3000`
- [ ] Server accessible: http://localhost:3000

## 🎯 Feature Testing Checklist

### Login & Registration
- [ ] Go to http://localhost:3000/login
- [ ] Create new account (email + password)
- [ ] Login with credentials
- [ ] Redirect to dashboard

### 2FA Setup
- [ ] Go to Settings → Security → 2FA Setup
- [ ] Click "Enable 2FA"
- [ ] See QR code displayed
- [ ] Scan with authenticator app (Google Authenticator, Authy, etc.)
- [ ] Enter 6-digit code
- [ ] See backup codes displayed
- [ ] Save backup codes
- [ ] Logout and login again
- [ ] Verify 2FA modal appears
- [ ] Enter 6-digit code
- [ ] Successfully logged in

### Notification Center
- [ ] Go to http://localhost:3000/notifications/center
- [ ] Toggle notification email preferences
- [ ] Change digest frequency
- [ ] Create a test notification (backend: `python manage.py shell`)
- [ ] View notification in center
- [ ] Mark as read/unread
- [ ] Delete notification

### Audit Log
- [ ] Go to Settings → Security → Audit Log
- [ ] View all audit events
- [ ] Filter by action type
- [ ] Search for events
- [ ] Click on event to see details
- [ ] Export to CSV
- [ ] Export to JSON

## 🐳 Docker Setup Checklist (Optional)

### Prerequisites
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Ports 3000, 8000, 80 available

### Build and Run
- [ ] Run: `docker-compose up --build`
- [ ] Wait for all services to start (~1 minute)
- [ ] Check all services running:
  - [ ] Backend: http://localhost:8000
  - [ ] Frontend: http://localhost:3000
  - [ ] Nginx: http://localhost

### Docker Verification
- [ ] View logs: `docker-compose logs -f backend`
- [ ] View logs: `docker-compose logs -f frontend`
- [ ] Healthcheck passes: `docker-compose ps`
- [ ] All services "Up" status

## 📚 Documentation Checklist

- [ ] Read README.md
- [ ] Read QUICKSTART.md
- [ ] Read INTEGRATION_GUIDE.md
- [ ] Read FINAL_STATUS_REPORT.md
- [ ] Review API endpoints in INTEGRATION_GUIDE.md
- [ ] Check test examples in backend/test_*.py files

## 🔐 Security Setup (Production)

- [ ] Change Django SECRET_KEY in settings.py
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Setup database backups
- [ ] Enable rate limiting
- [ ] Configure email backend
- [ ] Setup logging
- [ ] Enable monitoring

## 🆘 Troubleshooting Checklist

### Backend Won't Start
- [ ] Python version 3.8+: `python --version`
- [ ] Venv activated: `which python` (should show venv path)
- [ ] Dependencies installed: `pip list | grep django`
- [ ] Run: `python manage.py check`
- [ ] Check for port 8000 in use: `netstat -ano | findstr :8000`
- [ ] Try different port: `python manage.py runserver 8001`

### Frontend Won't Build
- [ ] Node 16+: `node --version`
- [ ] npm 8+: `npm --version`
- [ ] Clear cache: `rm -rf .next node_modules`
- [ ] Reinstall: `npm install`
- [ ] Clear npm cache: `npm cache clean --force`
- [ ] Try build again: `npm run build`

### Port Already in Use
- [ ] Windows: `netstat -ano | findstr :3000` (find PID)
- [ ] Windows: `taskkill /PID [PID] /F` (kill process)
- [ ] Or change port: `next dev -p 3001`

### Tests Failing
- [ ] Backend server running: `python manage.py runserver`
- [ ] Database migrations complete: `python manage.py migrate`
- [ ] Run: `python manage.py check`
- [ ] Run test individually: `python test_2fa.py`
- [ ] Check for errors in output

### TypeScript Errors
- [ ] Check Node version: `node --version` (16+)
- [ ] Clear cache: `npm cache clean --force`
- [ ] Reinstall dependencies: `npm install`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Review error messages

## 📊 Final Verification

### Backend Status
- [ ] All 51 tests passing (20 + 21 + 10)
- [ ] Django check passes
- [ ] Database connected
- [ ] Server running on 8000

### Frontend Status
- [ ] Build successful
- [ ] 0 TypeScript errors
- [ ] Server running on 3000
- [ ] All pages accessible

### Feature Status
- [ ] 2FA working
- [ ] Notifications working
- [ ] Audit log working
- [ ] Authentication working

### Documentation Status
- [ ] README.md ✅
- [ ] QUICKSTART.md ✅
- [ ] INTEGRATION_GUIDE.md ✅
- [ ] FINAL_STATUS_REPORT.md ✅
- [ ] SESSION_SUMMARY.md ✅
- [ ] FILES.md ✅

## ✅ Success Criteria

You're ready to deploy when:
- [ ] All 51 backend tests passing
- [ ] Frontend builds with 0 errors
- [ ] Both development servers running
- [ ] All 4 main features working (2FA, Notif, Audit, Auth)
- [ ] Documentation reviewed
- [ ] No breaking console errors
- [ ] Database setup complete
- [ ] Environment configured

## 🎉 Installation Complete!

When all items are checked, run:

```bash
# Terminal 1
cd backend && python manage.py runserver 0.0.0.0:8000

# Terminal 2
cd frontend && npm run dev
```

Then access http://localhost:3000 and enjoy SAFECLOUD!

---

## 📞 Quick Reference

| Issue | Solution |
|-------|----------|
| venv not activating | Use: `venv\Scripts\activate` (Windows) |
| Port 3000 in use | Kill: `taskkill /IM node.exe /F` or use port 3001 |
| Port 8000 in use | Run: `python manage.py runserver 8001` |
| TypeScript errors | Run: `npm install && npm run build` |
| Tests failing | Ensure backend running: `python manage.py runserver` |
| Build succeeds but no UI | Check NEXT_PUBLIC_API_URL in .env.local |
| API returns 401 | Login first via /login page |
| 2FA not working | Ensure pyotp installed: `pip show pyotp` |

---

**Status**: ✅ Checklist Created
**Last Updated**: Session 9 Completion
**Expected Time to Complete**: 30-45 minutes for full setup
