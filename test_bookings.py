import os
import sys
import django
from django.contrib.auth.models import User
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(__file__))  # Add current dir to path
django.setup()

from account.models import UserProfile, Connection, Booking

def create_test_bookings():
    # Get or create test users
    user1, created1 = User.objects.get_or_create(
        username='testuser1@example.com',
        defaults={'email': 'testuser1@example.com', 'first_name': 'Test', 'last_name': 'User1'}
    )
    user2, created2 = User.objects.get_or_create(
        username='testuser2@example.com',
        defaults={'email': 'testuser2@example.com', 'first_name': 'Test', 'last_name': 'User2'}
    )

    # Create profiles if needed
    profile1, _ = UserProfile.objects.get_or_create(user=user1, defaults={'bio': 'Test bio 1'})
    profile2, _ = UserProfile.objects.get_or_create(user=user2, defaults={'bio': 'Test bio 2'})

    # Create connection
    connection, _ = Connection.objects.get_or_create(
        requester=user1,
        receiver=user2,
        defaults={'status': 'accepted', 'accepted_at': timezone.now()}
    )

    # Create a booking
    booking, created = Booking.objects.get_or_create(
        connection=connection,
        skill='Python Programming',
        scheduled_at=timezone.now() + timezone.timedelta(days=1),
        defaults={
            'status': 'confirmed',
            'mentor_confirmed_done': True,
            'student_confirmed_done': True,
            'completed_at': timezone.now()
        }
    )

    if created:
        print(f"Created test booking with ID: {booking.id}")
    else:
        print(f"Booking already exists with ID: {booking.id}")

    # Update status to completed if both confirmed
    if booking.mentor_confirmed_done and booking.student_confirmed_done and booking.status != 'completed':
        booking.status = 'completed'
        booking.completed_at = timezone.now()
        booking.save()
        print(f"Updated booking {booking.id} to completed")

    print(f"Booking status: {booking.status}")
    print(f"Mentor done: {booking.mentor_confirmed_done}")
    print(f"Student done: {booking.student_confirmed_done}")

if __name__ == '__main__':
    create_test_bookings()