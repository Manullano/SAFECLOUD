#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from safecloud_api.apps.companies.models import User, Company

# Ver todos los usuarios con su rol y empresa
staff_users = User.objects.filter(role__in=['STAFF_PM', 'STAFF_SUPPORT'])
print(f"Total STAFF users: {staff_users.count()}")
for u in staff_users:
    print(f"  {u.full_name} - {u.role} - Empresa: {u.company}")

print("\n--- Todos los usuarios ---")
for u in User.objects.all()[:25]:
    print(f"  {u.full_name} - {u.role} - Empresa: {u.company}")

print("\n--- Empresas ---")
for c in Company.objects.all():
    print(f"  {c.name} - {c.id}")
