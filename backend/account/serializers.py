from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Skill, UserProfile, Message, Booking, Report


def get_user_avatar(user):
    """Get user avatar URL from profile or generate default"""
    try:
        if hasattr(user, 'profile') and user.profile.profile_pic:
            return user.profile.profile_pic.url
    except Exception:
        pass
    return f"https://ui-avatars.com/api/?name={user.username}"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[choice[0] for choice in UserProfile.ROLE_CHOICES],
        write_only=True,
        required=False,
        default="learner",
    )
    teach_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )
    learn_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'role', 'teach_skills', 'learn_skills']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '').strip()
        role = validated_data.pop('role', 'learner')
        teach_skills = validated_data.pop('teach_skills', [])
        learn_skills = validated_data.pop('learn_skills', [])

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        if full_name:
            user.first_name = full_name[:150]
            user.save(update_fields=['first_name'])

        UserProfile.objects.create(
            user=user,
            role=role,
            teach_skills=teach_skills,
            learn_skills=learn_skills,
        )
        return user


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [
            "id",
            "title",
            "type",
            "level",
            "category",
            "description",
            "sessions_completed",
            "icon",
            "color",
            "bg",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_username", "sender_name", "receiver", "content", "timestamp", "is_read", "message_type", "booking"]
        read_only_fields = ["id", "timestamp"]

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username


class BookingSerializer(serializers.ModelSerializer):
    mentor_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    skill_name = serializers.CharField(source="skill_topic", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "mentor", "mentor_name", "student", "student_name", 
            "skill_topic", "skill_name", "scheduled_at", "duration_minutes", 
            "status", "notes", "created_at", "updated_at",
            "mentor_confirmed_done", "student_confirmed_done",
            "cancellation_requested_by", "cancellation_confirmed_by"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "cancellation_requested_by", "cancellation_confirmed_by"]

    def get_mentor_name(self, obj):
        return f"{obj.mentor.first_name} {obj.mentor.last_name}".strip() or obj.mentor.username

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username


class AdminStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_users_change = serializers.FloatField()
    active_swaps = serializers.IntegerField()
    active_swaps_change = serializers.FloatField()
    pending_reports = serializers.IntegerField()
    pending_reports_change = serializers.FloatField()
    skill_listings = serializers.IntegerField()
    skill_listings_change = serializers.FloatField()


class AdminActivitySerializer(serializers.Serializer):
    type = serializers.CharField()
    message = serializers.CharField()
    color = serializers.CharField()
    time = serializers.CharField()


class AdminTopUserSerializer(serializers.Serializer):
    name = serializers.CharField()
    sub = serializers.CharField()
    rank = serializers.CharField()
    img = serializers.CharField()


class AdminUserGrowthSerializer(serializers.Serializer):
    bars = serializers.ListField(child=serializers.IntegerField())
    labels = serializers.ListField(child=serializers.CharField())
    raw_data = serializers.ListField(child=serializers.IntegerField())


class AdminRecentTransactionSerializer(serializers.Serializer):
    id = serializers.CharField()
    from_user = serializers.CharField()
    to_user = serializers.CharField()
    skill1 = serializers.CharField()
    skill2 = serializers.CharField()
    status = serializers.CharField()
    date = serializers.CharField()


class AdminReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    reporter_avatar = serializers.SerializerMethodField()
    reported_user_name = serializers.SerializerMethodField()
    reported_user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'reporter_name', 'reporter_avatar', 'reported_user_name', 'reported_user_avatar', 'reason', 'category', 'status', 'created_at', 'severity']

    def get_reporter_avatar(self, obj):
        return get_user_avatar(obj.reporter)

    def get_reported_user_name(self, obj):
        if obj.reported_user:
            return obj.reported_user.username
        return 'Platform'

    def get_reported_user_avatar(self, obj):
        if obj.reported_user:
            return get_user_avatar(obj.reported_user)
        return f"https://ui-avatars.com/api/?name=Platform"


class SupportConversationSerializer(serializers.Serializer):
    """Serializer for support conversations - displays unique users who have messaged admin"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    name = serializers.CharField()
    avatar = serializers.CharField()
    last_message = serializers.CharField()
    last_message_time = serializers.DateTimeField()
    unread_count = serializers.IntegerField()


class AdminSupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_avatar', 'receiver', 'content', 'timestamp', 'is_read']
        read_only_fields = ['id', 'timestamp', 'is_read']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name}".strip() or obj.sender.username

    def get_sender_avatar(self, obj):
        return get_user_avatar(obj.sender)
