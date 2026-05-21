#!/usr/bin/env python
"""
Script para crear usuarios de prueba en SAFECLOUD
Con contraseñas simples y conocidas para testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from safecloud_api.apps.companies.models import User

print('\n' + '='*100)
print('CREAR USUARIOS DE PRUEBA PARA SAFECLOUD')
print('='*100 + '\n')

# Usuarios de prueba con contraseñas simples
test_users = [
    {
        'email': 'admin@safecloud.local',
        'full_name': 'Administrador Sistema',
        'password': 'Admin12345!',
        'role': 'SUPERADMIN',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': 'manager@safecloud.local',
        'full_name': 'Gerente Proyecto',
        'password': 'Manager12345!',
        'role': 'STAFF_PM',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'email': 'user1@safecloud.local',
        'full_name': 'Usuario One',
        'password': 'User12345!',
        'role': 'CLIENT_USER',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'email': 'user2@safecloud.local',
        'full_name': 'Usuario Two',
        'password': 'User12345!',
        'role': 'CLIENT_USER',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'email': 'support@safecloud.local',
        'full_name': 'Equipo Soporte',
        'password': 'Support12345!',
        'role': 'STAFF_SUPPORT',
        'is_staff': True,
        'is_superuser': False,
    },
]

# Mostrar usuarios existentes
existing = User.objects.all()
if existing.exists():
    print(f"✅ {existing.count()} usuarios existentes encontrados:\n")
    for user in existing:
        role_display = dict(user.ROLE_CHOICES).get(user.role, user.role)
        print(f"  • {user.full_name} ({user.email}) - Rol: {role_display}")
    print()

# Crear nuevos usuarios
print("Creando usuarios de prueba...\n")
created_count = 0

for user_data in test_users:
    email = user_data['email']
    
    # Verificar si el usuario ya existe
    if User.objects.filter(email=email).exists():
        print(f"⏭️  {email}: YA EXISTE (saltado)")
    else:
        try:
            user = User.objects.create_user(
                email=user_data['email'],
                password=user_data['password'],
                full_name=user_data['full_name'],
                role=user_data['role'],
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser'],
            )
            print(f"✅ {user_data['full_name']} creado exitosamente")
            created_count += 1
        except Exception as e:
            print(f"❌ Error al crear {email}: {str(e)}")

print(f"\n{created_count} usuario(s) nuevo(s) creado(s)\n")

# Mostrar tabla de usuarios y contraseñas
print('='*100)
print('TABLA DE CREDENCIALES PARA TESTING')
print('='*100 + '\n')

print(f"{'#':<3} {'EMAIL':<30} {'PASSWORD':<20} {'NOMBRE':<25} {'ROL':<20}")
print('-'*100)

for idx, user_data in enumerate(test_users, 1):
    role_display = user_data['role']
    
    print(f"{idx:<3} {user_data['email']:<30} {user_data['password']:<20} {user_data['full_name']:<25} {role_display:<20}")

print('\n' + '='*100)
print('📝 INSTRUCCIONES PARA TESTING')
print('='*100 + '''
1. Ve a http://localhost:3000/login
2. Usa cualquiera de los usuarios de arriba para hacer login
3. Usa el USERNAME y PASSWORD de la tabla anterior
4. Después de login, prueba:
   - Ir a Settings > Security > 2FA Setup (habilitar 2FA)
   - Ir a Notifications (ver notificaciones)
   - Ir a Audit Log (ver logs de auditoría)

💡 NOTAS IMPORTANTES:
- Las contraseñas están hashadas en la base de datos (no se pueden recuperar)
- Si necesitas cambiar una contraseña, elimina el usuario y ejecuta este script nuevamente
- El usuario 'admin' tiene acceso total al sistema
- Los usuarios 'user1' y 'user2' son usuarios normales sin permisos especiales

🔐 SEGURIDAD (Solo para testing):
- Estas son contraseñas débiles solo para testing local
- NUNCA usar en producción
- CAMBIAR TODAS las contraseñas antes de deploying a producción
''')
print('='*100 + '\n')
