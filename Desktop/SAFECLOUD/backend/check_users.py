#!/usr/bin/env python
"""
Script para listar todos los usuarios en la base de datos
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from safecloud_api.apps.users.models import User

print('\n' + '='*100)
print('USUARIOS EN LA BASE DE DATOS SAFECLOUD')
print('='*100 + '\n')

users = User.objects.all()

if users.exists():
    print(f"Total de usuarios: {users.count()}\n")
    for user in users:
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Username: {user.username}")
        print(f"  Activo: {'✅ Sí' if user.is_active else '❌ No'}")
        print(f"  Admin/Staff: {'✅ Sí' if user.is_staff else '❌ No'}")
        print(f"  Creado: {user.created_at if hasattr(user, 'created_at') else 'N/A'}")
        print()
else:
    print("⚠️  No hay usuarios en la base de datos\n")

print('='*100)
print('NOTA: Las contraseñas no se pueden recuperar (están hashadas en Django)')
print('      Se crearán usuarios de prueba con contraseñas conocidas a continuación')
print('='*100 + '\n')
