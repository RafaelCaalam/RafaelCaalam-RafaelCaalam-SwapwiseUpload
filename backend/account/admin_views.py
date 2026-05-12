from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User
from .models import Skill, Swap, Report, Message, Booking
from .authentication import BearerTokenAuthentication
from .serializers import (
    AdminStatsSerializer,
    AdminActivitySerializer,
    AdminTopUserSerializer,
    AdminUserGrowthSerializer,
    AdminRecentTransactionSerializer,
    AdminReportSerializer,
)
from django.utils import timezone
from django.utils.timesince import timesince
from datetime import timedelta
from django.db.models import Count, Q


def get_user_avatar(user):
    try:
        if hasattr(user, 'profile') and user.profile.profile_pic:
            return user.profile.profile_pic.url
    except Exception:
        pass
    return f"https://ui-avatars.com/api/?name={user.username}"


class AdminStatsView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month_end = current_month_start
        prev_month_start = (current_month_start - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_users = User.objects.count()
        active_swaps = Swap.objects.filter(status='active').count()
        pending_reports = Report.objects.filter(status='pending').count()
        skill_listings = Skill.objects.count()

        current_users = User.objects.filter(date_joined__gte=current_month_start).count()
        previous_users = User.objects.filter(date_joined__gte=prev_month_start, date_joined__lt=prev_month_end).count()

        current_active_swaps = Swap.objects.filter(status='active', created_at__gte=current_month_start).count()
        previous_active_swaps = Swap.objects.filter(status='active', created_at__gte=prev_month_start, created_at__lt=prev_month_end).count()

        current_pending_reports = Report.objects.filter(created_at__gte=current_month_start, status='pending').count()
        previous_pending_reports = Report.objects.filter(created_at__gte=prev_month_start, created_at__lt=prev_month_end, status='pending').count()

        current_skill_listings = Skill.objects.filter(created_at__gte=current_month_start).count()
        previous_skill_listings = Skill.objects.filter(created_at__gte=prev_month_start, created_at__lt=prev_month_end).count()

        def calc_percent(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)

        payload = {
            "total_users": total_users,
            "total_users_change": calc_percent(current_users, previous_users),
            "active_swaps": active_swaps,
            "active_swaps_change": calc_percent(current_active_swaps, previous_active_swaps),
            "pending_reports": pending_reports,
            "pending_reports_change": calc_percent(current_pending_reports, previous_pending_reports),
            "skill_listings": skill_listings,
            "skill_listings_change": calc_percent(current_skill_listings, previous_skill_listings),
        }

        serializer = AdminStatsSerializer(payload)
        return Response(serializer.data)


class AdminLiveActivityView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        activities = []

        recent_users = User.objects.order_by('-date_joined')[:5]
        for u in recent_users:
            activities.append({
                "type": "user_joined",
                "message": f"{u.first_name or u.username} joined and verified their account",
                "color": "var(--sw-purple)",
                "time": u.date_joined,
            })

        recent_skills = Skill.objects.order_by('-created_at')[:5]
        for s in recent_skills:
            activities.append({
                "type": "new_skill",
                "message": f"{s.user.first_name or s.user.username} listed a new skill: {s.title}",
                "color": "var(--sw-blue)",
                "time": s.created_at,
            })

        recent_swaps = Swap.objects.exclude(status='pending').order_by('-updated_at')[:5]
        for s in recent_swaps:
            status_text = "completed" if s.status == "completed" else "accepted"
            requester_name = s.requester.first_name or s.requester.username
            receiver_name = s.receiver.first_name or s.receiver.username
            activities.append({
                "type": "swap_update",
                "message": f"Swap {status_text} between {requester_name} and {receiver_name}",
                "color": "var(--sw-green)",
                "time": s.updated_at,
            })

        recent_reports = Report.objects.order_by('-created_at')[:5]
        for r in recent_reports:
            activities.append({
                "type": "new_report",
                "message": f"New report filed against {r.reported_user.username if r.reported_user else 'Platform'} — awaiting review",
                "color": "var(--sw-yellow)" if r.status == "pending" else "var(--sw-red)",
                "time": r.created_at,
            })

        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:10]

        from django.utils.timesince import timesince
        for a in activities:
            a['time'] = f"{timesince(a['time']).split(',')[0]} ago"

        serializer = AdminActivitySerializer(activities, many=True)
        return Response(serializer.data)


class AdminNotificationsView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        notifications = []

        recent_users = User.objects.order_by('-date_joined')[:3]
        for u in recent_users:
            notifications.append({
                'id': f'user-{u.id}',
                'type': 'user_joined',
                'message': f"{u.first_name or u.username} joined the platform",
                'color': 'var(--sw-purple)',
                'time': f"{timesince(u.date_joined).split(',')[0]} ago",
                'unread': True,
                '_sort': u.date_joined,
            })

        recent_swaps = Swap.objects.exclude(status='pending').order_by('-updated_at')[:3]
        for s in recent_swaps:
            requester_name = s.requester.first_name or s.requester.username
            receiver_name = s.receiver.first_name or s.receiver.username
            status_text = 'completed' if s.status == 'completed' else 'accepted'
            notifications.append({
                'id': f'swap-{s.id}',
                'type': 'swap_update',
                'message': f"Swap {status_text} between {requester_name} and {receiver_name}",
                'color': 'var(--sw-green)',
                'time': f"{timesince(s.updated_at).split(',')[0]} ago",
                'unread': True,
                '_sort': s.updated_at,
            })

        recent_reports = Report.objects.order_by('-created_at')[:3]
        for r in recent_reports:
            reported_name = r.reported_user.username if r.reported_user else 'Platform'
            notifications.append({
                'id': f'report-{r.id}',
                'type': 'new_report',
                'message': f"New report filed against {reported_name}",
                'color': 'var(--sw-yellow)' if r.status == 'pending' else 'var(--sw-red)',
                'time': f"{timesince(r.created_at).split(',')[0]} ago",
                'unread': True,
                '_sort': r.created_at,
            })

        recent_messages = Message.objects.filter(receiver=request.user).order_by('-timestamp')[:4]
        for m in recent_messages:
            sender_name = m.sender.first_name or m.sender.username
            preview = m.content if len(m.content) <= 70 else f"{m.content[:67]}..."
            notifications.append({
                'id': f'message-{m.id}',
                'type': 'support_message',
                'message': f"{sender_name} sent a message: {preview}",
                'color': 'var(--sw-blue)',
                'time': f"{timesince(m.timestamp).split(',')[0]} ago",
                'unread': not m.is_read,
                'target_user_id': m.sender.id,
                '_sort': m.timestamp,
            })

        notifications.sort(key=lambda x: x['_sort'], reverse=True)
        notifications = notifications[:10]
        for notification in notifications:
            notification.pop('_sort', None)

        return Response(notifications)

    def post(self, request):
        Message.objects.filter(receiver=request.user, is_read=False).update(is_read=True)
        return Response({'marked_as_read': True})


class AdminTopUsersView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        top_users = User.objects.annotate(
            completed_swaps=Count('requested_swaps', filter=Q(requested_swaps__status='completed')) +
                            Count('received_swaps', filter=Q(received_swaps__status='completed'))
        ).order_by('-completed_swaps', '-date_joined')[:5]

        data = []
        for i, u in enumerate(top_users):
            skills_count = u.skills.count()
            try:
                img_url = u.profile.profile_pic.url if u.profile.profile_pic else f"https://ui-avatars.com/api/?name={u.username}"
            except Exception:
                img_url = f"https://ui-avatars.com/api/?name={u.username}"

            data.append({
                "name": u.first_name or u.username,
                "sub": f"{u.completed_swaps} swaps · {skills_count} skills",
                "rank": f"#{i + 1}",
                "img": img_url,
            })

        serializer = AdminTopUserSerializer(data, many=True)
        return Response(serializer.data)


class AdminUserGrowthView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        def shift_month(date, offset):
            year = date.year + (date.month - 1 + offset) // 12
            month = (date.month - 1 + offset) % 12 + 1
            return date.replace(year=year, month=month)

        labels = []
        raw_data = []

        for offset in range(-11, 1):
            month_start = shift_month(current_month_start, offset)
            next_month_start = shift_month(month_start, 1)
            count = User.objects.filter(date_joined__gte=month_start, date_joined__lt=next_month_start).count()
            labels.append(month_start.strftime("%b"))
            raw_data.append(count)

        max_value = max(raw_data) if raw_data else 0
        bars = [int((val / max_value) * 100) if max_value > 0 else 0 for val in raw_data]

        serializer = AdminUserGrowthSerializer({
            "bars": bars,
            "labels": labels,
            "raw_data": raw_data,
        })
        return Response(serializer.data)


class AdminRecentTransactionsView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        swaps = Swap.objects.all().order_by('-created_at')[:5]
        data = []

        for s in swaps:
            data.append({
                "id": f"#SW-{s.id:04d}",
                "from_user": s.requester.first_name or s.requester.username,
                "to_user": s.receiver.first_name or s.receiver.username,
                "skill1": s.requester_skill.title,
                "skill2": s.receiver_skill.title,
                "status": s.status,
                "date": s.created_at.strftime("%b %d, %Y"),
            })

        serializer = AdminRecentTransactionSerializer(data, many=True)
        return Response(serializer.data)


class AdminAllSwapsView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status')
        bookings = Booking.objects.all().order_by('-created_at')
        if status_filter in dict(Booking.STATUS_CHOICES):
            bookings = bookings.filter(status=status_filter)

        # Calculate counts for all statuses
        counts = {
            'total': Booking.objects.count(),
            'active': Booking.objects.filter(status='confirmed').count(),  # Active means confirmed
            'pending': Booking.objects.filter(status='pending').count(),
            'completed': Booking.objects.filter(status='completed').count(),
            'cancelled': Booking.objects.filter(status='cancelled').count(),
        }

        data = []
        now = timezone.now()
        for booking in bookings:
            student_name = booking.student.first_name or booking.student.username
            mentor_name = booking.mentor.first_name or booking.mentor.username
            progress = 0
            duration = '—'

            if booking.status == 'completed':
                progress = 100
                duration_days = max(1, (booking.updated_at - booking.created_at).days)
                duration = f"{duration_days} day{'s' if duration_days != 1 else ''}"
            elif booking.status == 'confirmed':  # Active
                elapsed_days = max(1, (now - booking.created_at).days)
                progress = min(90, 35 + elapsed_days * 10)
                duration = f"{elapsed_days} day{'s' if elapsed_days != 1 else ''}"
            elif booking.status == 'pending':
                progress = 0
                duration = 'Pending'
            elif booking.status == 'cancelled':
                progress = 0
                duration = '—'

            data.append({
                'swap_id': f"#BK-{booking.id:04d}",
                'requester_name': student_name,  # Student requests the booking
                'requester_profile_pic': get_user_avatar(booking.student),
                'receiver_name': mentor_name,  # Mentor receives the request
                'receiver_profile_pic': get_user_avatar(booking.mentor),
                'skills_exchanged': [
                    {'user': student_name, 'skill': booking.skill_topic},
                    {'user': mentor_name, 'skill': booking.skill_topic},
                ],
                'status': booking.status,
                'progress_percentage': progress,
                'start_date': booking.created_at.strftime('%b %d, %Y'),
                'duration': duration,
                'created_at': booking.created_at,
            })

        return Response({
            'swaps': data,
            'counts': counts
        })


class AdminReportListView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = Report.objects.all().order_by('-created_at')
        serializer = AdminReportSerializer(reports, many=True)
        return Response(serializer.data)


class AdminReportActionView(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found'}, status=404)

        action = request.data.get('action')
        if action == 'resolve':
            report.status = 'resolved'
        elif action == 'dismiss':
            report.status = 'dismissed'
        else:
            return Response({'error': 'Invalid action'}, status=400)

        report.save()
        serializer = AdminReportSerializer(report)
        return Response(serializer.data)


class AdminSupportConversationsView(APIView):
    """Fetch all unique users who have sent messages to admin (support conversations)"""
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .serializers import SupportConversationSerializer
        from django.db.models import Max, Q
        
        # Get the admin user
        admin = request.user
        
        # Find all unique users who have messaged the admin
        # Messages sent TO admin by other users
        user_ids = Message.objects.filter(
            receiver=admin
        ).values_list('sender_id', flat=True).distinct()
        
        conversations = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                # Get the last message in the conversation
                last_message = Message.objects.filter(
                    (Q(sender=user) & Q(receiver=admin)) |
                    (Q(sender=admin) & Q(receiver=user))
                ).order_by('-timestamp').first()
                
                if last_message:
                    # Count unread messages from this user
                    unread_count = Message.objects.filter(
                        sender=user,
                        receiver=admin,
                        is_read=False
                    ).count()
                    
                    conversations.append({
                        'user_id': user.id,
                        'username': user.username,
                        'name': f"{user.first_name}" if user.first_name else user.username,
                        'avatar': get_user_avatar(user),
                        'last_message': last_message.content[:50],
                        'last_message_time': last_message.timestamp,
                        'unread_count': unread_count,
                    })
            except User.DoesNotExist:
                continue
        
        # Sort by last message time, most recent first
        conversations.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        serializer = SupportConversationSerializer(conversations, many=True)
        return Response(serializer.data)


class AdminSupportMessagesView(APIView):
    """Fetch all messages in a conversation with a specific user"""
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        from .serializers import AdminSupportMessageSerializer
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        admin = request.user
        
        # Get all messages between admin and this user, ordered by timestamp
        messages = Message.objects.filter(
            (Q(sender=user) & Q(receiver=admin)) |
            (Q(sender=admin) & Q(receiver=user))
        ).order_by('timestamp')
        
        # Mark messages from the user as read
        Message.objects.filter(
            sender=user,
            receiver=admin,
            is_read=False
        ).update(is_read=True)
        
        serializer = AdminSupportMessageSerializer(messages, many=True)
        return Response(serializer.data)


class AdminSendSupportMessageView(APIView):
    """Send a support message reply to a user"""
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        from .serializers import AdminSupportMessageSerializer
        
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content', '').strip()
        
        if not receiver_id or not content:
            return Response(
                {'error': 'receiver_id and content are required'},
                status=400
            )
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({'error': 'Receiver not found'}, status=404)
        
        # Create the message
        message = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            content=content,
            message_type='text'
        )
        
        serializer = AdminSupportMessageSerializer(message)
        return Response(serializer.data, status=201)
