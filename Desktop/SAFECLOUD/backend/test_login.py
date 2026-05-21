#!/usr/bin/env python
import os
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safecloud_api.settings')
django.setup()

# Test login endpoint
url = 'http://localhost:8000/api/auth/login/'
data = {
    'email': 'testuser999@test.com',
    'password': 'Test1234!'
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
result = response.json()

print("\n=== LOGIN RESPONSE ===")
print(json.dumps(result, indent=2, default=str))

print("\n=== USER OBJECT ===")
user = result.get('user', {})
print(f"company: {user.get('company')}")
print(f"company type: {type(user.get('company'))}")
print(f"company_name: {user.get('company_name')}")
