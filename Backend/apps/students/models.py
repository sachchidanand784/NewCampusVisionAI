from django.db import models
from django.conf import settings

class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='student_profile'
    )
    roll_number = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    session = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    
    # Cloudinary image details
    face_image_url = models.URLField(max_length=500, blank=True, null=True)
    face_image_public_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Store the 128-dimensional list of floats in a standard JSONField
    face_encoding = models.JSONField(blank=True, null=True)
    face_registered = models.BooleanField(default=False)
    
    # Blocked state (e.g. after 5 late entries)
    blocked = models.BooleanField(default=False)
    late_count = models.IntegerField(default=0)
    
    # 6-Digit Gate Pass OTP Code
    gate_pass_code = models.CharField(max_length=6, blank=True, null=True, unique=True)
    
    # Rate limit and failure log fields for daily QR check-in
    attendance_failed_attempts = models.IntegerField(default=0)
    attendance_blocked_until = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.roll_number})"
