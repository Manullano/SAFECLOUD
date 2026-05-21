#!/bin/bash
set -e

echo "===================== SAFECLOUD PRODUCTION ENTRYPOINT ====================="
echo "Environment: ${ENVIRONMENT:-development}"
echo "Starting at: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for database
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
max_retries=30
retry_count=0

while ! python -c "
import django
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT 1')
" 2>/dev/null; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        echo -e "${RED}Database did not become ready after ${max_retries} attempts${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Retry ${retry_count}/${max_retries}: Waiting for database...${NC}"
    sleep 2
done

echo -e "${GREEN}Database is ready!${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
python manage.py migrate --noinput || {
    echo -e "${RED}Migration failed!${NC}"
    exit 1
}
echo -e "${GREEN}Migrations completed successfully${NC}"
echo ""

# Collect static files
if [ "${ENVIRONMENT}" = "production" ]; then
    echo -e "${YELLOW}Collecting static files...${NC}"
    python manage.py collectstatic --noinput --clear || {
        echo -e "${RED}Collecting static files failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}Static files collected${NC}"
    echo ""
fi

# Create cache tables (if using database cache)
echo -e "${YELLOW}Creating cache tables...${NC}"
python manage.py createcachetable 2>/dev/null || true
echo ""

# System checks
echo -e "${YELLOW}Running Django system checks...${NC}"
python manage.py check || {
    echo -e "${RED}System check failed!${NC}"
    exit 1
}
echo -e "${GREEN}System checks passed${NC}"
echo ""

# Display startup info
echo -e "${GREEN}===================== STARTUP COMPLETE =====================${NC}"
echo "Starting gunicorn server..."
echo ""

# Start gunicorn
exec "$@"
