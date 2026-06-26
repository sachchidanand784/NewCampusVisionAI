import datetime
from django.db import models
from django.conf import settings
from django.utils import timezone

class AttendanceConfig(models.Model):
    # Only one record should exist (Singleton)
    attendance_range_start = models.TimeField(default=datetime.time(8, 0, 0))
    attendance_range_end = models.TimeField(default=datetime.time(10, 0, 0))
    is_gate_closed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Enforce singleton
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(pk=1)
        return config

    def __str__(self):
        return f"Attendance Config: {self.attendance_range_start} to {self.attendance_range_end} (Closed: {self.is_gate_closed})"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
    ]
    
    MARKED_CHOICES = [
        ('AUTO', 'Automatic (Face Recognition)'),
        ('MANUAL', 'Manual (Gateman)'),
    ]

    student = models.ForeignKey(
        'students.StudentProfile', 
        on_delete=models.CASCADE, 
        related_name='attendance_records'
    )
    timestamp = models.DateTimeField(default=timezone.now)
    date = models.DateField(default=timezone.localdate)
    time = models.TimeField(blank=True, null=True)
    checkout_time = models.TimeField(blank=True, null=True)
    roll_number = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PRESENT')
    marked_by = models.CharField(max_length=15, choices=MARKED_CHOICES, default='AUTO')
    confidence_score = models.FloatField(default=1.0)
    face_match_score = models.FloatField(default=0.0)
    
    # QR check-in relation
    qr = models.ForeignKey(
        'qr.DailyQR',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendances'
    )
    qr_session_id = models.UUIDField(blank=True, null=True)
    
    # If marked manually, track which Gateman marked it
    gate_man = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendances'
    )

    class Meta:
        unique_together = ('student', 'date')
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.roll_number} - {self.date} - {self.status}"
