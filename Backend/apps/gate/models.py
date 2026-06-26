import datetime
from django.db import models
from django.conf import settings
from django.utils import timezone

class GateConfig(models.Model):
    CONFIG_TYPES = [
        ('DEFAULT', 'Default Fallback'),
        ('DAY_OF_WEEK', 'Day of Week Wise'),
        ('SPECIFIC_DATE', 'Specific Date Wise'),
    ]
    
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    config_type = models.CharField(max_length=20, choices=CONFIG_TYPES, default='DEFAULT')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, blank=True, null=True)
    specific_date = models.DateField(blank=True, null=True, unique=True)
    
    entry_start_time = models.TimeField(default=datetime.time(8, 0, 0))
    entry_end_time = models.TimeField(default=datetime.time(18, 0, 0))
    
    exit_start_time = models.TimeField(default=datetime.time(16, 0, 0))
    exit_end_time = models.TimeField(default=datetime.time(22, 0, 0))

    class Meta:
        ordering = ['-config_type', 'specific_date', 'day_of_week']

    def __str__(self):
        if self.config_type == 'DEFAULT':
            return "Default Gate Config"
        elif self.config_type == 'DAY_OF_WEEK':
            return f"Gate Config for {self.get_day_of_week_display()}"
        else:
            return f"Gate Config for Date {self.specific_date}"

    @classmethod
    def get_active_config(cls, target_date=None):
        """
        Retrieves the active configuration for a given date.
        Order of precedence:
        1. Specific Date Config
        2. Day of Week Config
        3. Default Fallback Config
        """
        if target_date is None:
            target_date = timezone.localdate()
        
        # 1. Check Specific Date
        specific_config = cls.objects.filter(config_type='SPECIFIC_DATE', specific_date=target_date).first()
        if specific_config:
            return specific_config

        # 2. Check Day of Week
        weekday = target_date.weekday()  # Monday is 0, Sunday is 6
        day_config = cls.objects.filter(config_type='DAY_OF_WEEK', day_of_week=weekday).first()
        if day_config:
            return day_config

        # 3. Fallback to Default (create one if not exists)
        default_config = cls.objects.filter(config_type='DEFAULT').first()
        if not default_config:
            default_config = cls.objects.create(config_type='DEFAULT')
        return default_config


class GateRecord(models.Model):
    DIRECTION_CHOICES = [
        ('ENTRY', 'Entry'),
        ('EXIT', 'Exit'),
    ]

    VERIFICATION_METHODS = [
        ('FACE', 'Face Recognition'),
        ('QR', 'QR Code Pass'),
        ('MANUAL', 'Manual ID Search'),
    ]

    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='gate_records'
    )
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='ENTRY')
    timestamp = models.DateTimeField(default=timezone.now)
    is_late = models.BooleanField(default=False)
    verified_by = models.CharField(max_length=15, choices=VERIFICATION_METHODS, default='FACE')
    
    # Track which gateman performed/supervised the verification
    gate_man = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_gate_records'
    )

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.roll_number} - {self.direction} - {self.timestamp}"
