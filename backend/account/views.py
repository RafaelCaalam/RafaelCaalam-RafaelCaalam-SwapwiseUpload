from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import models
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .authentication import BearerTokenAuthentication
from datetime import datetime, timedelta
from django.utils import timezone
from .serializers import RegisterSerializer, SkillSerializer, MessageSerializer, BookingSerializer
from .models import Skill, Connection, Notification, Message, UserProfile, Booking, Report


def sync_profile_skills(user):
    profile = getattr(user, "profile", None)
    if not profile:
        return

    for title in profile.teach_skills or []:
        title_text = str(title).strip()
        if title_text and not Skill.objects.filter(user=user, title__iexact=title_text, type="teach").exists():
            Skill.objects.create(user=user, title=title_text, type="teach")

    for title in profile.learn_skills or []:
        title_text = str(title).strip()
        if title_text and not Skill.objects.filter(user=user, title__iexact=title_text, type="learn").exists():
            Skill.objects.create(user=user, title=title_text, type="learn")


@csrf_exempt
@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        sync_profile_skills(user)
        profile = user.profile
        return Response({
            "message": "User registered successfully",
            "token": token.key,
            "username": user.username,
            "full_name": user.first_name,
            "role": profile.role,
            "teach_skills": profile.teach_skills,
            "learn_skills": profile.learn_skills,
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is None:
        email_user = User.objects.filter(email=username).first()
        if email_user is not None:
            user = authenticate(username=email_user.username, password=password)

    if user is not None:
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        sync_profile_skills(user)
        profile = getattr(user, "profile", None)
        return Response({
            "message": "Login successful",
            "token": token.key,
            "username": user.username,
            "full_name": user.first_name,
            "role": profile.role if profile else None,
            "is_staff": user.is_staff,
            "teach_skills": profile.teach_skills if profile else [],
            "learn_skills": profile.learn_skills if profile else [],
        }, status=status.HTTP_200_OK)

    return Response({
        "message": "Invalid username or password"
    }, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@api_view(['POST'])
def logout_user(request):
    logout(request)
    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def skill_list_create(request):
    if request.method == 'GET':
        sync_profile_skills(request.user)
        skills = Skill.objects.filter(user=request.user)
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

    serializer = SkillSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def skill_detail(request, pk):
    skill = get_object_or_404(Skill, pk=pk, user=request.user)

    if request.method == 'GET':
        serializer = SkillSerializer(skill)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = SkillSerializer(skill, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_report(request):
    report_category = request.data.get('report_category')
    description = request.data.get('description')

    if not report_category:
        return Response({"error": "Report category is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not description or not description.strip():
        return Response({"error": "Description is required."}, status=status.HTTP_400_BAD_REQUEST)

    severity_map = {
        "UI/UX Bug": "low",
        "Functional Issue": "high",
        "Harassment/Safety": "high",
        "Billing Question": "medium",
        "Other": "medium",
    }
    severity = severity_map.get(report_category, "medium")

    report = Report.objects.create(
        reporter=request.user,
        reported_user=None,
        category=report_category,
        severity=severity,
        reason=description.strip(),
        status="pending"
    )

    return Response({
        "id": report.id,
        "reporter": request.user.username,
        "category": report.category,
        "severity": report.severity,
        "status": report.status,
        "created_at": report.created_at,
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_list(request):
    current_user = request.user
    sync_profile_skills(current_user)
    
    current_learn_skills = set(skill.title.lower() for skill in Skill.objects.filter(user=current_user, type="learn"))
    current_teach_skills = set(skill.title.lower() for skill in Skill.objects.filter(user=current_user, type="teach"))

    matches = []
    
    # Exclude users already connected or pending
    connected_user_ids = set(Connection.objects.filter(sender=current_user).values_list('receiver_id', flat=True))
    connected_user_ids.update(Connection.objects.filter(receiver=current_user).values_list('sender_id', flat=True))
    
    other_users = User.objects.exclude(id=current_user.id).exclude(id__in=connected_user_ids).select_related('profile')

    for user in other_users:
        if not hasattr(user, 'profile'):
            continue
        
        sync_profile_skills(user)
        user_teach_skills = [skill.title for skill in Skill.objects.filter(user=user, type="teach")]
        user_learn_skills = [skill.title for skill in Skill.objects.filter(user=user, type="learn")]

        user_teach_skills_lower = set(s.lower() for s in user_teach_skills)
        user_learn_skills_lower = set(s.lower() for s in user_learn_skills)

        teach_overlap = current_learn_skills.intersection(user_teach_skills_lower)
        learn_overlap = current_teach_skills.intersection(user_learn_skills_lower)

        total_overlap = len(teach_overlap) + len(learn_overlap)
        
        if total_overlap >= 2:
            match_percentage = 90 + (total_overlap - 2) * 5
        elif total_overlap == 1:
            match_percentage = 70
        else:
            match_percentage = 30
        
        match_percentage = min(match_percentage, 100)

        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        matches.append({
            "id": user.id,
            "full_name": full_name,
            "bio": "",
            "location": "Remote",
            "teaching_skills": user_teach_skills,
            "learning_skills": user_learn_skills,
            "match_percentage": match_percentage,
            # Extra fields to satisfy frontend UI mapping smoothly
            "role": user.profile.role.title() if user.profile.role else "Learner",
            "rating": "5.0",
            "reviews": 0,
            "initials": full_name[:2].upper() if full_name else "U",
            "image": None,
            "color": "#3b82f6",
            "level": "Intermediate",
            "category": "Development",
            "availability": "Any Time"
        })
    
    matches.sort(key=lambda x: x["match_percentage"], reverse=True)

    return Response(matches, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_user(request):
    receiver_id = request.data.get('receiver_id')
    if not receiver_id:
        return Response({"error": "Receiver ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
    if receiver == request.user:
        return Response({"error": "Cannot connect to yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check if a connection already exists
    if Connection.objects.filter(sender=request.user, receiver=receiver).exists() or \
       Connection.objects.filter(sender=receiver, receiver=request.user).exists():
        return Response({"error": "Connection already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Create the connection
    Connection.objects.create(sender=request.user, receiver=receiver, status="pending")
    
    # Create notification for the receiver
    sender_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    Notification.objects.create(
        user=receiver,
        content=f"{sender_name} sent you a connection request."
    )
    
    return Response({"message": "Connection request sent"}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    notifications = Notification.objects.filter(user=request.user).order_params() if hasattr(Notification.objects.filter(user=request.user), 'order_params') else Notification.objects.filter(user=request.user).order_by('-created_at')
    
    pending_connections = Connection.objects.filter(receiver=request.user, status='pending')

    data = []
    for notif in notifications:
        notif_data = {
            "id": notif.id,
            "content": notif.content,
            "is_read": notif.is_read,
            "created_at": notif.created_at,
        }
        
        if "sent you a connection request" in notif.content:
            sender_name = notif.content.split(" sent you a connection request")[0].strip()
            for conn in pending_connections:
                conn_sender_name = f"{conn.sender.first_name} {conn.sender.last_name}".strip() or conn.sender.username
                if conn_sender_name == sender_name:
                    notif_data['connection_id'] = conn.id
                    break
        
        data.append(notif_data)
        
    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_connection(request):
    connection_id = request.data.get('connection_id')
    action = request.data.get('action')

    if not connection_id or not action:
        return Response({"error": "Missing connection_id or action"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        connection = Connection.objects.get(id=connection_id)
    except Connection.DoesNotExist:
        return Response({"error": "Connection not found"}, status=status.HTTP_404_NOT_FOUND)

    if connection.receiver != request.user:
        return Response({"error": "Unauthorized to respond to this connection"}, status=status.HTTP_403_FORBIDDEN)

    if action == 'accept':
        connection.status = 'accepted'
        connection.save()
        
        # Create a new Notification for the original sender
        receiver_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        Notification.objects.create(
            user=connection.sender,
            content=f"{receiver_name} accepted your connection request."
        )
        return Response({"message": "Connection accepted"}, status=status.HTTP_200_OK)
    
    elif action == 'decline':
        connection.status = 'rejected'
        connection.save()
        return Response({"message": "Connection declined"}, status=status.HTTP_200_OK)
    
    else:
        return Response({"error": "Invalid action. Use 'accept' or 'decline'"}, status=status.HTTP_400_BAD_REQUEST)


def calculate_minutes_offline(last_seen):
    """Calculate minutes since last_seen"""
    now = timezone.now()
    diff = now - last_seen
    minutes = diff.total_seconds() / 60
    return int(minutes)


def get_last_seen_text(minutes_offline):
    """Format last_seen time as human-readable text"""
    if minutes_offline < 1:
        return "Online now"
    elif minutes_offline < 60:
        return f"{minutes_offline}m ago"
    elif minutes_offline < 1440:
        hours = minutes_offline // 60
        return f"{hours}h ago"
    else:
        days = minutes_offline // 1440
        return f"{days}d ago"


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get list of users with accepted connections"""
    current_user = request.user
    
    # Update current user's last_seen
    profile = getattr(current_user, 'profile', None)
    if profile:
        profile.last_seen = timezone.now()
        profile.save(update_fields=['last_seen'])
    
    # Get accepted connections
    sent_connections = Connection.objects.filter(
        sender=current_user, 
        status='accepted'
    ).select_related('receiver', 'receiver__profile')
    
    received_connections = Connection.objects.filter(
        receiver=current_user, 
        status='accepted'
    ).select_related('sender', 'sender__profile')
    
    conversations = []
    
    for conn in sent_connections:
        user = conn.receiver
        profile = getattr(user, 'profile', None)
        last_seen = profile.last_seen if profile else timezone.now()
        minutes_offline = calculate_minutes_offline(last_seen)
        
        conversations.append({
            "id": user.id,
            "username": user.username,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "last_seen": last_seen.isoformat(),
            "last_seen_text": get_last_seen_text(minutes_offline),
            "minutes_offline": minutes_offline,
        })
    
    for conn in received_connections:
        user = conn.sender
        profile = getattr(user, 'profile', None)
        last_seen = profile.last_seen if profile else timezone.now()
        minutes_offline = calculate_minutes_offline(last_seen)
        
        conversations.append({
            "id": user.id,
            "username": user.username,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "last_seen": last_seen.isoformat(),
            "last_seen_text": get_last_seen_text(minutes_offline),
            "minutes_offline": minutes_offline,
        })
    
    # Remove duplicates and sort by name
    seen_ids = set()
    unique_conversations = []
    for conv in conversations:
        if conv["id"] not in seen_ids:
            seen_ids.add(conv["id"])
            unique_conversations.append(conv)
    
    # Include support admin if there is existing message history but no accepted connection
    admin_user = User.objects.filter(username='admin', is_staff=True).first()
    if admin_user and admin_user.id not in seen_ids:
        admin_messages_exist = Message.objects.filter(
            (models.Q(sender=current_user) & models.Q(receiver=admin_user)) |
            (models.Q(sender=admin_user) & models.Q(receiver=current_user))
        ).exists()
        if admin_messages_exist:
            profile = getattr(admin_user, 'profile', None)
            last_seen = profile.last_seen if profile else timezone.now()
            minutes_offline = calculate_minutes_offline(last_seen)
            unique_conversations.insert(0, {
                "id": admin_user.id,
                "username": admin_user.username,
                "name": f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username,
                "last_seen": last_seen.isoformat(),
                "last_seen_text": get_last_seen_text(minutes_offline),
                "minutes_offline": minutes_offline,
                "is_admin": True,
                "is_staff": True,
            })

    return Response(unique_conversations, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request):
    """Get chat history between current user and selected contact"""
    contact_id = request.query_params.get('contact_id')

    if not contact_id:
        return Response(
            {"error": "contact_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        contact = User.objects.get(id=contact_id)
    except User.DoesNotExist:
        return Response({"error": "Contact not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Get all messages between these two users
    messages = Message.objects.filter(
        (models.Q(sender=request.user) & models.Q(receiver=contact)) |
        (models.Q(sender=contact) & models.Q(receiver=request.user))
    ).order_by('timestamp')
    
    # Mark messages as read if they are for the current user
    Message.objects.filter(
        receiver=request.user,
        sender=contact,
        is_read=False
    ).update(is_read=True)
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a message to a contact"""
    receiver_id = request.data.get('receiver_id')
    content = request.data.get('content', '').strip()
    
    if not receiver_id or not content:
        return Response(
            {"error": "receiver_id and content are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if receiver == request.user:
        return Response(
            {"error": "Cannot send message to yourself"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if connection exists and is accepted
    connection_exists = Connection.objects.filter(
        (models.Q(sender=request.user) & models.Q(receiver=receiver)) |
        (models.Q(sender=receiver) & models.Q(receiver=request.user)),
        status='accepted'
    ).exists()
    
    if not connection_exists:
        return Response(
            {"error": "You must be connected with this user to send messages"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create message
    message = Message.objects.create(
        sender=request.user,
        receiver=receiver,
        content=content
    )
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_support_info(request):
    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': admin_user.id,
        'username': admin_user.username,
        'name': f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_support_message(request):
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    message = Message.objects.create(
        sender=request.user,
        receiver=admin_user,
        content=content,
        message_type='support'
    )

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    """Create a booking request and send a booking_request message"""
    receiver_id = request.data.get('receiver_id')
    skill_topic = request.data.get('skill_topic')
    scheduled_at = request.data.get('scheduled_at')
    duration_minutes = request.data.get('duration_minutes', 60)
    notes = request.data.get('notes', '')

    if not all([receiver_id, skill_topic, scheduled_at]):
        return Response(
            {"error": "receiver_id, skill_topic, and scheduled_at are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if connection exists and is accepted
    connection_exists = Connection.objects.filter(
        (models.Q(sender=request.user) & models.Q(receiver=receiver)) |
        (models.Q(sender=receiver) & models.Q(receiver=request.user)),
        status='accepted'
    ).exists()

    if not connection_exists:
        return Response(
            {"error": "You must be connected with this user to create bookings"}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        scheduled_datetime = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
        if scheduled_datetime <= timezone.now():
            return Response(
                {"error": "Booking time must be in the future"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except ValueError:
        return Response(
            {"error": "Invalid scheduled_at format. Use ISO format."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create booking
    booking = Booking.objects.create(
        mentor=receiver,  # The receiver becomes the mentor (teacher)
        student=request.user,  # The sender becomes the student (learner)
        skill_topic=skill_topic,
        scheduled_at=scheduled_datetime,
        duration_minutes=duration_minutes,
        status='pending',
        notes=notes
    )

    # Create booking request message
    message_content = f"Booking request: {skill_topic} at {scheduled_datetime.strftime('%Y-%m-%d %H:%M')}"
    message = Message.objects.create(
        sender=request.user,
        receiver=receiver,
        content=message_content,
        message_type='booking_request',
        booking=booking
    )

    # Create notification for the receiver
    sender_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    Notification.objects.create(
        user=receiver,
        content=f"{sender_name} sent you a booking request for {skill_topic}."
    )

    return Response({
        "message": "Booking request sent",
        "booking_id": booking.id,
        "message_id": message.id
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bookings(request):
    """Get user's bookings (both as mentor and student)"""
    user_bookings = Booking.objects.filter(
        models.Q(mentor=request.user) | models.Q(student=request.user)
    ).select_related('mentor', 'student')

    serializer = BookingSerializer(user_bookings, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """
    Get data for the user dashboard:
    - 3 most recent accepted connections (matches)
    - 3 upcoming confirmed bookings
    """
    current_user = request.user

    # 1. Get recent connections (matches)
    sent_connections = Connection.objects.filter(
        sender=current_user, 
        status='accepted'
    ).select_related('receiver', 'receiver__profile').order_by('-id')
    
    received_connections = Connection.objects.filter(
        receiver=current_user, 
        status='accepted'
    ).select_related('sender', 'sender__profile').order_by('-id')
    
    all_connections = sorted(
        list(sent_connections) + list(received_connections),
        key=lambda c: c.id,
        reverse=True
    )

    recent_matches = []
    seen_ids = set()

    for conn in all_connections:
        if len(recent_matches) >= 3:
            break

        user = conn.receiver if conn.sender == current_user else conn.sender
        if user.id in seen_ids:
            continue
        seen_ids.add(user.id)
        
        profile = getattr(user, 'profile', None)
        if not profile:
            continue

        sync_profile_skills(user)
        user_teach_skills = [skill.title for skill in Skill.objects.filter(user=user, type="teach")]
        user_learn_skills = [skill.title for skill in Skill.objects.filter(user=user, type="learn")]
        
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        role_text = profile.role.title() if getattr(profile, 'role', None) else "Learner"

        recent_matches.append({
            "id": user.id,
            "name": full_name,
            "role": role_text,
            "teaches": user_teach_skills,
            "learns": user_learn_skills,
            "rating": "4.8", # Placeholder
            "color": "#3b82f6", # Placeholder
            "initials": full_name[:2].upper() if full_name else "U",
            "image": f"https://ui-avatars.com/api/?name={full_name.replace(' ', '+')}&background=random"
        })

    # 2. Get upcoming bookings
    now = timezone.now()
    upcoming_bookings_query = Booking.objects.filter(
        (models.Q(mentor=current_user) | models.Q(student=current_user)),
        status='confirmed',
        scheduled_at__gt=now
    ).select_related('mentor', 'student').order_by('scheduled_at')[:3]

    serialized_bookings = []
    for booking in upcoming_bookings_query:
        partner_user = booking.student if booking.mentor == current_user else booking.mentor
        partner_name = f"{partner_user.first_name} {partner_user.last_name}".strip() or partner_user.username

        serialized_bookings.append({
            "id": booking.id,
            "skill_topic": booking.skill_topic,
            "scheduled_at": booking.scheduled_at,
            "duration_minutes": booking.duration_minutes,
            "status": booking.status,
            "partner": partner_name
        })

    return Response({
        "recent_matches": recent_matches,
        "upcoming_bookings": serialized_bookings
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_booking(request):
    """Accept or decline a booking request"""
    booking_id = request.data.get('booking_id')
    action = request.data.get('action')  # 'accept' or 'decline'

    if not booking_id or not action:
        return Response(
            {"error": "booking_id and action are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

    # Only the mentor can respond to booking requests
    if booking.mentor != request.user:
        return Response(
            {"error": "Only the mentor can respond to this booking"}, 
            status=status.HTTP_403_FORBIDDEN
        )

    if action == 'accept':
        booking.status = 'confirmed'
        booking.save()

        # Create notification for the student
        mentor_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        Notification.objects.create(
            user=booking.student,
            content=f"{mentor_name} accepted your booking request for {booking.skill_topic}."
        )
        return Response({
            "message": "Booking accepted",
            "booking": {
                "id": booking.id,
                "status": booking.status,
                "skill_topic": booking.skill_topic,
                "scheduled_at": booking.scheduled_at,
                "duration_minutes": booking.duration_minutes,
                "mentor": booking.mentor.username,
                "student": booking.student.username
            }
        }, status=status.HTTP_200_OK)

    elif action == 'decline':
        booking.status = 'cancelled'
        booking.save()
        return Response({
            "message": "Booking declined",
            "booking": {
                "id": booking.id,
                "status": booking.status,
                "skill_topic": booking.skill_topic,
                "scheduled_at": booking.scheduled_at,
                "duration_minutes": booking.duration_minutes,
                "mentor": booking.mentor.username,
                "student": booking.student.username
            }
        }, status=status.HTTP_200_OK)

    else:
        return Response(
            {"error": "Invalid action. Use 'accept' or 'decline'"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_booking_status(request):
    """Update booking status (for marking as completed, etc.)"""
    booking_id = request.data.get('booking_id')
    new_status = request.data.get('status')

    if not booking_id or not new_status:
        return Response(
            {"error": "booking_id and status are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

    # Only participants can update booking status
    if request.user not in [booking.mentor, booking.student]:
        return Response(
            {"error": "You are not authorized to update this booking"}, 
            status=status.HTTP_403_FORBIDDEN
        )

    old_status = booking.status
    booking.status = new_status
    booking.save()

    # Create notification for the other participant
    other_user = booking.student if request.user == booking.mentor else booking.mentor
    user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username

    if new_status == 'completed':
        Notification.objects.create(
            user=other_user,
            content=f"{user_name} marked the {booking.skill_topic} session as completed."
        )

    return Response({
        "message": f"Booking status updated to {new_status}",
        "booking_id": booking.id
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_booking_done(request):
    """Mark booking as done by current user. Auto-completes if both users mark done."""
    booking_id = request.data.get('booking_id')
    
    if not booking_id:
        return Response(
            {"error": "booking_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Only participants can mark as done
    if request.user not in [booking.mentor, booking.student]:
        return Response(
            {"error": "You are not authorized to update this booking"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Only confirmed bookings can be marked done
    if booking.status != 'confirmed':
        return Response(
            {"error": "Only confirmed bookings can be marked as done"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set the confirmation for current user
    if request.user == booking.mentor:
        booking.mentor_confirmed_done = True
    else:
        booking.student_confirmed_done = True
    
    # Check if both users have confirmed
    if booking.mentor_confirmed_done and booking.student_confirmed_done:
        booking.status = 'completed'
        other_user = booking.student if request.user == booking.mentor else booking.mentor
        user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        
        Notification.objects.create(
            user=other_user,
            content=f"{user_name} confirmed completion. The {booking.skill_topic} session is now marked as completed."
        )
    
    booking.save()
    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_booking_cancellation(request):
    """Cancel a booking immediately. Updates status to cancelled."""
    booking_id = request.data.get('booking_id')
    
    if not booking_id:
        return Response(
            {"error": "booking_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Only participants can cancel
    if request.user not in [booking.mentor, booking.student]:
        return Response(
            {"error": "You are not authorized to cancel this booking"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Can't cancel if already cancelled or completed
    if booking.status in ['completed', 'cancelled']:
        return Response(
            {"error": f"Cannot cancel a {booking.status} booking"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set status to cancelled immediately
    booking.status = 'cancelled'
    booking.save()
    
    # Notify the other user
    other_user = booking.student if request.user == booking.mentor else booking.mentor
    user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    
    Notification.objects.create(
        user=other_user,
        content=f"{user_name} cancelled the {booking.skill_topic} booking."
    )
    
    # Create a message about the cancellation
    Message.objects.create(
        sender=request.user,
        receiver=other_user,
        content=f"I have cancelled our {booking.skill_topic} session scheduled for {booking.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
        message_type='cancellation',
        booking=booking
    )
    
    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def respond_to_cancellation(request):
    """Respond to cancellation request. Accept or reject."""
    booking_id = request.data.get('booking_id')
    accept = request.data.get('accept', True)
    
    if not booking_id:
        return Response(
            {"error": "booking_id is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Only participants can respond
    if request.user not in [booking.mentor, booking.student]:
        return Response(
            {"error": "You are not authorized to respond to this request"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Only the user who didn't request can confirm
    if request.user == booking.cancellation_requested_by:
        return Response(
            {"error": "You cannot respond to your own cancellation request"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not booking.cancellation_requested_by:
        return Response(
            {"error": "No cancellation request pending"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if accept:
        booking.status = 'cancelled'
        booking.cancellation_confirmed_by = request.user
        
        # Notify the requester
        requester = booking.cancellation_requested_by
        user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        Notification.objects.create(
            user=requester,
            content=f"{user_name} agreed to cancel the {booking.skill_topic} booking."
        )
    else:
        # Reset the cancellation request
        booking.cancellation_requested_by = None
        booking.cancellation_confirmed_by = None
        
        # Notify the requester that it was rejected
        requester = booking.cancellation_requested_by if booking.cancellation_requested_by else request.user
        user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
        Notification.objects.create(
            user=requester,
            content=f"{user_name} declined to cancel the {booking.skill_topic} booking."
        )
    
    booking.save()
    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == 'GET':
        profile_pic_url = request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
        return Response({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "bio": profile.bio,
            "profile_pic": profile_pic_url,
        }, status=status.HTTP_200_OK)

    if request.method == 'PUT':
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()

        profile.bio = request.data.get('bio', profile.bio)
        
        if 'profile_pic' in request.FILES:
            profile.profile_pic = request.FILES['profile_pic']
            
        profile.save()

        profile_pic_url = request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
        return Response({
            "message": "Profile updated successfully",
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "bio": profile.bio,
            "profile_pic": profile_pic_url,
        }, status=status.HTTP_200_OK)

from rest_framework.permissions import IsAdminUser

@api_view(['GET'])
@authentication_classes([BearerTokenAuthentication])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_data(request):
    total_users = User.objects.count()
    active_swaps = Booking.objects.filter(status='confirmed').count()
    skill_listings = Skill.objects.count()
    
    return Response({
        "total_users": total_users,
        "active_swaps": active_swaps,
        "pending_reports": 0,
        "skill_listings": skill_listings,
        "recent_activities": [],
        "top_users": [],
        "recent_transactions": [],
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([BearerTokenAuthentication])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_users_list(request):
    users = User.objects.all().select_related('profile')
    
    user_data = []
    for u in users:
        profile = getattr(u, 'profile', None)
        user_data.append({
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}".strip() or u.username,
            "email": u.email,
            "joined": u.date_joined.strftime('%b %d, %Y') if u.date_joined else 'Unknown',
            "status": 'active' if u.is_active else 'banned',
            "skills": Skill.objects.filter(user=u).count(),
            "swaps": Booking.objects.filter(models.Q(mentor=u) | models.Q(student=u), status='completed').count(),
            "img": f"https://ui-avatars.com/api/?name={u.username.replace(' ', '+')}&background=random",
            "role": profile.role.title() if profile and profile.role else "User"
        })
        
    return Response(user_data, status=status.HTTP_200_OK)
