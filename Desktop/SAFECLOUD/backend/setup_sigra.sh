#!/bin/bash

# Script de setup para integración de SIGRA en SAFECLOUD
# Este script configura automáticamente todo lo necesario para SIGRA

set -e

echo "🔒 SIGRA Integration Setup para SAFECLOUD"
echo "==========================================="
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py no encontrado. Ejecuta este script desde backend/"
    exit 1
fi

echo "✅ Directorio correcto: $(pwd)"
echo ""

# 2. Verificar que Python y pip están instalados
if ! command -v python &> /dev/null; then
    echo "❌ Python no está instalado"
    exit 1
fi

echo "✅ Python disponible: $(python --version)"
echo ""

# 3. Instalar dependencias de SIGRA si es necesario
echo "📦 Instalando dependencias..."
pip install -q celery redis django-celery-beat

# 4. Crear migraciones
echo "🔄 Creando migraciones de SIGRA..."
python manage.py makemigrations audit sigra

# 5. Aplicar migraciones
echo "🔄 Aplicando migraciones..."
python manage.py migrate

# 6. Crear superusuario si no existe
echo ""
echo "👤 Configuración de usuario admin (si no existe)..."
python manage.py shell << END
from django.contrib.auth.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@safecloud.local', 'admin123')
    print("✅ Superusuario 'admin' creado")
else:
    print("ℹ️  Superusuario 'admin' ya existe")
END

# 7. Crear carpeta de logs
echo ""
echo "📁 Creando directorio de logs..."
mkdir -p logs
touch logs/sigra.log

echo ""
echo "✅ Setup completado exitosamente!"
echo ""
echo "📚 Próximos pasos:"
echo "1. Iniciar Redis:          redis-server"
echo "2. Iniciar Celery worker:  celery -A safecloud_api worker -l info"
echo "3. Iniciar servidor Django: python manage.py runserver"
echo "4. Acceder a Django admin:  http://localhost:8000/admin"
echo ""
echo "📖 Para más información, ver: SIGRA_INTEGRATION_GUIDE.md"
