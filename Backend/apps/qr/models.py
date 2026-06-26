import uuid
from django.db import models
from django.conf import settings

class DailyQR(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    token = models.TextField()  # Encrypted JWT token containing session details
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generated_qrs'
    )
    QR_TYPES = [
        ('ENTRY', 'Entry'),
        ('EXIT', 'Exit')
    ]
    qr_type = models.CharField(max_length=10, choices=QR_TYPES, default='ENTRY')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status_str = "Active" if self.is_active else "Expired"
        return f"DailyQR {self.session_id} - {self.date} ({status_str})"
