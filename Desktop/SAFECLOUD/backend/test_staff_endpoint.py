#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

from safecloud_api.apps.companies.models import User, Company
from rest_framework_simplejwt.tokens import RefreshToken

# Obtener el usuario testuser999
user = User.objects.get(email='testuser999@test.com')
print(f"Usuario: {user.full_name}")
print(f"Empresa: {user.company}")

# Generar token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"\nToken generado: {access_token[:50]}...")

# Hacer una petición al endpoint
import requests
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

url = 'http://localhost:8000/api/companies/users/staff/'
print(f"\nHaciendo petición GET a: {url}")

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        print(f"\nStaff usuarios encontrados: {len(results)}")
        for staff in results:
            print(f"  - {staff.get('full_name', 'N/A')} ({staff.get('role', 'N/A')})")
except Exception as e:
    print(f"Error: {e}")

