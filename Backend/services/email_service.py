import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp_email(email, otp):
        """
        Sends a registration OTP verification code.
        """
        subject = "Campus Vision AI - Verify Your Email"
        message = (
            f"Welcome to Campus Vision AI!\n\n"
            f"Your OTP verification code is: {otp}\n\n"
            f"This code will expire in 10 minutes. Please do not share this code with anyone.\n\n"
            f"Best regards,\nCampus Admin Team"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            print(f"\n[SMTP Confirmation] OTP email successfully dispatched to {email}.\n")
            return True
        except Exception as e:
            print(f"\n[SMTP Confirmation] ERROR: Failed to send OTP email to {email} - {str(e)}\n")
            logger.error(f"Failed to send OTP email to {email}: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(email, reset_url):
        """
        Sends a password reset link.
        """
        subject = "Campus Vision AI - Reset Your Password"
        message = (
            f"Hello,\n\n"
            f"We received a request to reset your password. You can do so by clicking the link below:\n\n"
            f"{reset_url}\n\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"Best regards,\nCampus Admin Team"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            print(f"\n[SMTP Confirmation] Password reset email successfully dispatched to {email}.\n")
            return True
        except Exception as e:
            print(f"\n[SMTP Confirmation] ERROR: Failed to send password reset email to {email} - {str(e)}\n")
            logger.error(f"Failed to send password reset email to {email}: {str(e)}")
            return False

    @staticmethod
    def send_late_alert(email, student_name, late_count):
        """
        Sends an alert based on the number of late gate entries.
        - 3rd late: Warning alert.
        - 4th late: Strong alert.
        - 5th late: Automatic block notification.
        """
        subject = "Campus Vision AI - Gate Entry Late Alert"
        if late_count == 3:
            message = (
                f"Dear {student_name},\n\n"
                f"This is a warning that you have recorded 3 late gate entries.\n"
                f"Please ensure you enter the campus within the permitted hours to avoid access restrictions.\n\n"
                f"Best regards,\nCampus Gate Security"
            )
        elif late_count == 4:
            message = (
                f"Dear {student_name},\n\n"
                f"CRITICAL WARNING: You have recorded 4 late gate entries.\n"
                f"Please note that a 5th late entry will result in your student campus access being BLOCKED automatically.\n"
                f"Contact the Administrator office immediately.\n\n"
                f"Best regards,\nCampus Gate Security Office"
            )
        elif late_count >= 5:
            subject = "Campus Vision AI - ACCESS BLOCKED - 5 Late Entries Recorded"
            message = (
                f"Dear {student_name},\n\n"
                f"Your access to the campus has been BLOCKED because you have recorded {late_count} late entries.\n"
                f"Your QR code and facial recognition verification are currently suspended.\n"
                f"Please report to the Administrator's office for reset and re-entry authorization.\n\n"
                f"Best regards,\nCampus Administration Department"
            )
        else:
            return True  # No alert needed for < 3 late entries

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            print(f"\n[SMTP Confirmation] Late alert email successfully dispatched to {email}.\n")
            return True
        except Exception as e:
            print(f"\n[SMTP Confirmation] ERROR: Failed to send late alert email to {email} (count={late_count}) - {str(e)}\n")
            logger.error(f"Failed to send late alert email to {email} (count={late_count}): {str(e)}")
            return False
