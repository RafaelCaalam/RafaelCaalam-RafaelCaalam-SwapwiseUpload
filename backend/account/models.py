from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("learner", "Learner"),
        ("teacher", "Teacher"),
        ("both", "Both"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="learner")
    teach_skills = models.JSONField(default=list, blank=True)
    learn_skills = models.JSONField(default=list, blank=True)
    last_seen = models.DateTimeField(default=timezone.now)
    bio = models.TextField(blank=True, default="")
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} profile"


class Skill(models.Model):
    SKILL_TYPE_CHOICES = [
        ("teach", "Teaching"),
        ("learn", "Learning"),
    ]

    LEVEL_CHOICES = [
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
        ("Expert", "Expert"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="skills")
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=10, choices=SKILL_TYPE_CHOICES, default="teach")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="Beginner")
    category = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    sessions_completed = models.PositiveIntegerField(default=0)
    icon = models.CharField(max_length=50, default="Code2", blank=True)
    color = models.CharField(max_length=20, default="#3b82f6", blank=True)
    bg = models.CharField(max_length=40, default="rgba(59,130,246,0.15)", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.type})"


class Connection(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    sender = models.ForeignKey(User, related_name="sent_connections", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_connections", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Notification(models.Model):
    user = models.ForeignKey(User, related_name="notifications", on_delete=models.CASCADE)
    content = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"To {self.user.username}: {self.content}"


class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    message_type = models.CharField(max_length=20, default="text")  # text, booking_request
    booking = models.ForeignKey('Booking', null=True, blank=True, on_delete=models.SET_NULL, related_name="messages")

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    mentor = models.ForeignKey(User, related_name="mentor_bookings", on_delete=models.CASCADE)
    student = models.ForeignKey(User, related_name="student_bookings", on_delete=models.CASCADE)
    skill_topic = models.CharField(max_length=200)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Mutual completion confirmation fields
    mentor_confirmed_done = models.BooleanField(default=False)
    student_confirmed_done = models.BooleanField(default=False)
    
    # Mutual cancellation confirmation fields
    cancellation_requested_by = models.ForeignKey(User, null=True, blank=True, related_name="cancellation_requests", on_delete=models.SET_NULL)
    cancellation_confirmed_by = models.ForeignKey(User, null=True, blank=True, related_name="cancellation_confirmations", on_delete=models.SET_NULL)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.skill_topic} - {self.mentor.username} → {self.student.username}"

class Swap(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    requester = models.ForeignKey(User, related_name="requested_swaps", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_swaps", on_delete=models.CASCADE)
    requester_skill = models.ForeignKey('Skill', related_name="swaps_as_requester", on_delete=models.CASCADE)
    receiver_skill = models.ForeignKey('Skill', related_name="swaps_as_receiver", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Swap: {self.requester.username} & {self.receiver.username}"

class Report(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]

    CATEGORY_CHOICES = [
        ("UI/UX Bug", "UI/UX Bug"),
        ("Functional Issue", "Functional Issue"),
        ("Harassment/Safety", "Harassment/Safety"),
        ("Billing Question", "Billing Question"),
        ("Other", "Other"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    reporter = models.ForeignKey(User, related_name="reports_filed", on_delete=models.CASCADE)
    reported_user = models.ForeignKey(User, related_name="reports_received", on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="Other")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="low")
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        reported = self.reported_user.username if self.reported_user else "Platform"
        return f"Report by {self.reporter.username} against {reported}"

