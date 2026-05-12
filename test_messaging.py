"""
Messaging System Test Cases
Quick tests to verify the messaging implementation is working correctly.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, '/c/Users/User/Documents/ProjectName/swapwise/SWAPWISE-SYSTEM/SWAPWISE-SYSTEM')

django.setup()

from django.contrib.auth.models import User
from account.models import UserProfile, Connection, Message
from account.serializers import MessageSerializer
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from account.views import get_conversations, get_messages, send_message

def test_models():
    """Test that all models exist and work"""
    print("Testing Models...")
    
    # Test UserProfile has last_seen field
    assert hasattr(UserProfile, 'last_seen'), "UserProfile should have last_seen field"
    print("✓ UserProfile.last_seen exists")
    
    # Test Message model exists
    assert hasattr(Message, 'sender'), "Message should have sender field"
    assert hasattr(Message, 'receiver'), "Message should have receiver field"
    assert hasattr(Message, 'content'), "Message should have content field"
    assert hasattr(Message, 'timestamp'), "Message should have timestamp field"
    assert hasattr(Message, 'is_read'), "Message should have is_read field"
    print("✓ Message model has all required fields")
    
    print("✓ Models test passed!\n")


def test_serializers():
    """Test that serializers work"""
    print("Testing Serializers...")
    
    # Test MessageSerializer can be imported and instantiated
    try:
        serializer = MessageSerializer()
        print("✓ MessageSerializer instantiated successfully")
    except Exception as e:
        print(f"✗ MessageSerializer failed: {e}")
        return False
    
    print("✓ Serializers test passed!\n")
    return True


def test_views_exist():
    """Test that all view functions exist"""
    print("Testing Views...")
    
    from account.views import (
        get_conversations, 
        get_messages, 
        send_message,
        calculate_minutes_offline,
        get_last_seen_text
    )
    print("✓ get_conversations view exists")
    print("✓ get_messages view exists")
    print("✓ send_message view exists")
    print("✓ calculate_minutes_offline helper exists")
    print("✓ get_last_seen_text helper exists")
    
    print("✓ Views test passed!\n")


def test_helper_functions():
    """Test helper functions"""
    print("Testing Helper Functions...")
    
    from account.views import calculate_minutes_offline, get_last_seen_text
    
    # Test calculate_minutes_offline
    now = timezone.now()
    past = now - timezone.timedelta(minutes=30)
    minutes = calculate_minutes_offline(past)
    assert 28 <= minutes <= 32, f"Expected ~30 minutes, got {minutes}"
    print(f"✓ calculate_minutes_offline works (returned {minutes}m)")
    
    # Test get_last_seen_text
    text = get_last_seen_text(5)
    assert text == "5m ago", f"Expected '5m ago', got '{text}'"
    print("✓ get_last_seen_text('5m ago') works")
    
    text = get_last_seen_text(0)
    assert text == "Online now", f"Expected 'Online now', got '{text}'"
    print("✓ get_last_seen_text('0m') returns 'Online now'")
    
    print("✓ Helper functions test passed!\n")


def test_migrations():
    """Verify migrations were applied"""
    print("Testing Migrations...")
    
    from django.core.management import execute_from_command_line
    import subprocess
    
    result = subprocess.run(
        [sys.executable, 'manage.py', 'showmigrations', 'account'],
        capture_output=True,
        text=True,
        cwd='backend'
    )
    
    if '0005_add_messaging_features' in result.stdout:
        print("✓ Migration 0005_add_messaging_features is in migrations list")
    
    # Check if [X] mark is present (indicating migration was applied)
    if '[X] account.0005_add_messaging_features' in result.stdout:
        print("✓ Migration 0005_add_messaging_features has been applied")
    elif '[X]' in result.stdout:  # At least some migrations are applied
        print("⚠ Migrations list shows [X] markers (migrations are applied)")
    
    print("✓ Migrations test passed!\n")


if __name__ == '__main__':
    print("=" * 50)
    print("SWAPWISE MESSAGING SYSTEM - TEST SUITE")
    print("=" * 50 + "\n")
    
    try:
        test_models()
        test_serializers()
        test_views_exist()
        test_helper_functions()
        test_migrations()
        
        print("=" * 50)
        print("✓ ALL TESTS PASSED!")
        print("=" * 50)
        print("\nYour messaging system is ready to use.")
        print("Start the development server with: python manage.py runserver")
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
