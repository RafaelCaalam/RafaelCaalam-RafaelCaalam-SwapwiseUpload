import os
import sys
import django
from django.test import Client
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_endpoints():
    client = Client(SERVER_NAME='127.0.0.1')
    
    # Login first
    login_payload = {
        "username": "test2@example.com",
        "password": "Password123!"
    }
    response = client.post('/api/accounts/login/', data=json.dumps(login_payload), content_type='application/json')
    print(f"Login Status: {response.status_code}")
    
    # Test Dashboard Data
    res = client.get('/api/accounts/dashboard-data/')
    print(f"Dashboard Data Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Dashboard Error: {res.content.decode()}")
        
    # Test Notifications
    res = client.get('/api/accounts/notifications/')
    print(f"Notifications Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Notifications Error: {res.content.decode()}")

    # Test Profile
    res = client.get('/api/accounts/profile/')
    print(f"Profile Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Profile Error: {res.content.decode()}")

if __name__ == '__main__':
    test_endpoints()
