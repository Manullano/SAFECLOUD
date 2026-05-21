# 🚀 SAFECLOUD Production Deployment Guide

> **Status**: Ready for production deployment
> **Last Updated**: May 10, 2026
> **Environment**: Production-grade configuration

## 📋 Pre-Deployment Checklist

### Infrastructure Prerequisites
- [ ] Linux server (Ubuntu 20.04+ or equivalent)
- [ ] Docker & Docker Compose installed
- [ ] SSL certificates (self-signed or from Let's Encrypt)
- [ ] PostgreSQL 14+ (optional, if not using Docker)
- [ ] Redis 7+ (optional, if not using Docker)
- [ ] Nginx (optional, if using standalone)
- [ ] Domain name configured with DNS
- [ ] SSH access to server
- [ ] Git installed for deployments

### Application Requirements
- [ ] All environment variables configured
- [ ] Database migration plan
- [ ] Backup strategy in place
- [ ] Monitoring/logging setup
- [ ] Email credentials configured
- [ ] SSL certificates ready
- [ ] Secrets management plan

---

## 🔐 Security Hardening

### 1. **Generate Secret Keys**
```bash
# Django SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# JWT Token (same as Django SECRET_KEY)
```

### 2. **SSL/TLS Certificates**
```bash
# Option A: Let's Encrypt (Recommended)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Option B: Self-signed (Development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

Place certificates in `/app/ssl/`:
```
ssl/
├── cert.pem
└── key.pem
```

### 3. **Environment Variables**
Create `.env` file in project root:
```bash
cp backend/.env.example backend/.env
```

Edit critical values:
```bash
ENVIRONMENT=production
DEBUG=False
DJANGO_SECRET_KEY=your-generated-secret-key
DB_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
SENTRY_DSN=your-sentry-dsn-if-using
```

### 4. **Create Non-Root User**
```bash
sudo useradd -m -s /bin/bash safecloud
sudo usermod -aG docker safecloud
sudo chown -R safecloud:safecloud /app
```

---

## 📦 Deployment Steps

### Step 1: Prepare Server
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone and Setup Project
```bash
# Clone repository
cd /home/safecloud
git clone https://github.com/yourusername/safecloud.git
cd safecloud

# Create SSL directory
mkdir -p ssl
# Place your certificates here
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

# Create .env file
cp backend/.env.example backend/.env
nano backend/.env  # Edit with your values
```

### Step 3: Initialize Database
```bash
# Start services (database will initialize)
docker-compose -f docker-compose.prod.yml up -d

# Wait for PostgreSQL to be ready (check logs)
docker-compose -f docker-compose.prod.yml logs db

# Verify database is up
docker-compose -f docker-compose.prod.yml exec db pg_isready
```

### Step 4: Create Admin User
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Step 5: Verify Deployment
```bash
# Check health
curl -I http://localhost/health
curl -I https://yourdomain.com/health

# Check database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d safecloud_db -c "SELECT 1"

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔧 Post-Deployment Configuration

### 1. **Setup Backup Strategy**
```bash
#!/bin/bash
# /home/safecloud/backup.sh
BACKUP_DIR="/home/safecloud/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres safecloud_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/safecloud/backup.sh
```

### 2. **Setup Monitoring & Alerts**
```bash
# Sentry (error tracking)
# 1. Create account at sentry.io
# 2. Create project for SAFECLOUD
# 3. Add SENTRY_DSN to .env
# 4. Errors will be tracked automatically

# Monitor disk space
sudo apt-get install -y df-check
df -h /

# Monitor container health
docker ps
docker stats
```

### 3. **Setup Log Rotation**
```bash
# Logs are already configured with rotation in docker-compose.prod.yml
# max-size: 10m (max 10MB per log file)
# max-file: 5 (keep 5 files, total 50MB)

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 4. **Enable Automatic Updates**
```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🔄 Deployment Updates

### Deploying New Versions
```bash
cd /home/safecloud/safecloud

# Pull latest code
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.prod.yml build

# Apply migrations (if any)
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Verify
curl https://yourdomain.com/health
```

### Rollback Procedure
```bash
# If deployment fails, revert to previous image
git revert HEAD
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

---

## 📊 Monitoring & Maintenance

### Performance Monitoring
```bash
# CPU & Memory usage
docker stats

# Network usage
docker network ls
docker network inspect safecloud

# Disk usage
docker system df

# Container logs
docker logs -f container_name
docker logs --tail 100 container_name
```

### Health Checks
```bash
# API Health
curl https://yourdomain.com/api/health/
# Output: {"status":"healthy","service":"safecloud-api"}

# Database Health
curl https://yourdomain.com/api/ready/
# Output includes database and cache status

# Liveness Check
curl https://yourdomain.com/api/alive/
# Output: {"status":"alive"}
```

### Common Issues & Solutions

#### 1. **High Memory Usage**
```bash
# Increase resource limits in docker-compose.prod.yml
# Or restart services
docker-compose -f docker-compose.prod.yml restart
```

#### 2. **Slow Queries**
```bash
# Check slow query log
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d safecloud_db -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### 3. **Redis Connection Issues**
```bash
# Restart Redis
docker-compose -f docker-compose.prod.yml restart redis

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

#### 4. **SSL Certificate Expired**
```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 🔒 Security Maintenance

### Regular Security Checks
```bash
# Update all packages
sudo apt-get update && sudo apt-get upgrade -y

# Rebuild images with latest base layers
docker-compose -f docker-compose.prod.yml build --no-cache

# Check for vulnerabilities
docker scan image_name
```

### Access Control
```bash
# Restrict access to admin panel
# Configure in your firewall/load balancer
# Only allow from trusted IPs

# Example (UFW):
sudo ufw allow from 10.0.0.0/8 to any port 443
sudo ufw enable
```

### Database Security
```bash
# Change default passwords
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new_password';"

# Enable SSL in PostgreSQL
# Edit postgresql.conf inside container
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Run multiple backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Configure Nginx load balancing
# Edit nginx.conf upstream section
```

### Vertical Scaling
```bash
# Increase resources in docker-compose.prod.yml
# Increase worker count in gunicorn command
# Increase Celery concurrency
```

---

## 🆘 Troubleshooting

### View detailed logs
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 db

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 nginx
```

### Access container shell
```bash
docker-compose -f docker-compose.prod.yml exec backend bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres
```

### Force restart all services
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Support & Contacts

- **Documentation**: See FINAL_STATUS_REPORT.md
- **API Documentation**: https://yourdomain.com/api/docs/
- **Admin Panel**: https://yourdomain.com/admin/
- **Error Tracking**: Check Sentry.io dashboard
- **Status Page**: https://yourdomain.com/health/

---

## ✅ Final Checklist

- [ ] SSL certificates installed
- [ ] All environment variables set
- [ ] Database backups configured
- [ ] Monitoring/logging setup
- [ ] Health checks passing
- [ ] Admin user created
- [ ] DNS pointing to server
- [ ] CORS properly configured
- [ ] Email service working
- [ ] Rate limiting tested
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

**Congratulations! SAFECLOUD is now running in production.** 🎉
