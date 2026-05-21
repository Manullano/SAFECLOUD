import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from safecloud_api.apps.companies.models import User

# Contraseñas simples para testing
credenciales = {
    'admin@safecloud.com': 'Admin123!',
    'superadmin@test.com': 'SuperAdmin123!',
    'staff_pm@test.com': 'StaffPM123!',
    'staff_support@test.com': 'StaffSupport123!',
    'client_admin_a@test.com': 'ClientA123!',
    'client_user_a@test.com': 'UserA123!',
    'client_viewer_a@test.com': 'ViewerA123!',
    'client_admin_b@test.com': 'ClientB123!',
    'newuser@example.com': 'NewUser123!',
    'user-42dc785a@example.com': 'User42123!',
    'mllanobocaz@gmail.com': 'MyPassword123!',
    'testuser999@test.com': 'TestUser123!',
    'newemail123@test.com': 'NewEmail123!',
    'danae.bocaz@gmail.com': 'Danae123!',
    '2fauser@test.com': '2FA123!',
    'notifyuser@test.com': 'Notify123!',
    'notificationuser@test.com': 'NotificationUser123!',
    'integrationuser@test.com': 'Integration123!',
}

print("🔐 Reestableciendo contraseñas para usuarios...\n")
print("=" * 80)

for email, password in credenciales.items():
    try:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
        print(f"✅ {email:45} → {password}")
    except User.DoesNotExist:
        print(f"❌ {email:45} → NO ENCONTRADO")

print("=" * 80)
print("\n✅ ¡Contraseñas actualizadas exitosamente!")
