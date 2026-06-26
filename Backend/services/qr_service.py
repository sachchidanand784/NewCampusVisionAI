import logging
import io
import base64
import jwt
from datetime import datetime, timedelta
import qrcode
from django.conf import settings

logger = logging.getLogger(__name__)

class QrService:
    @staticmethod
    def generate_student_qr_token(student_id, roll_number, expiration_days=30):
        """
        Generates a secure cryptographically signed JWT token for the student's QR code.
        """
        payload = {
            "student_id": student_id,
            "roll_number": roll_number,
            "exp": datetime.utcnow() + timedelta(days=expiration_days),
            "iat": datetime.utcnow()
        }
        # Sign with JWT_SECRET / SECRET_KEY
        token = jwt.encode(payload, settings.SIMPLE_JWT.get('SIGNING_KEY'), algorithm='HS256')
        return token

    @classmethod
    def generate_qr_image_base64(cls, data_string):
        """
        Generates a QR code image as a base64 data URI string.
        """
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data_string)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            
            # Encode image to base64
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            return f"data:image/png;base64,{img_base64}"
        except Exception as e:
            logger.error(f"Error generating QR image: {str(e)}")
            raise e

    @staticmethod
    def verify_qr_token(token):
        """
        Decodes and verifies a student's QR token.
        Returns the payload dict if valid, or None if expired/invalid.
        """
        try:
            payload = jwt.decode(
                token, 
                settings.SIMPLE_JWT.get('SIGNING_KEY'), 
                algorithms=['HS256']
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("QR Code token has expired.")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid QR Code token: {str(e)}")
            return None

    @staticmethod
    def generate_daily_qr_token(session_id, date_str, timestamp_str, qr_type="ENTRY"):
        """
        Generates a signed JWT token containing daily attendance details.
        """
        payload = {
            "session_id": str(session_id),
            "date": date_str,
            "timestamp": timestamp_str,
            "qr_type": qr_type,
            "type": "daily_attendance"
        }
        token = jwt.encode(payload, settings.SIMPLE_JWT.get('SIGNING_KEY'), algorithm='HS256')
        return token

    @staticmethod
    def verify_daily_qr_token(token):
        """
        Verifies a daily QR token and checks if the type is correct.
        """
        try:
            payload = jwt.decode(
                token, 
                settings.SIMPLE_JWT.get('SIGNING_KEY'), 
                algorithms=['HS256']
            )
            if payload.get("type") != "daily_attendance":
                logger.warning("Token type is not daily_attendance.")
                return None
            return payload
        except Exception as e:
            logger.error(f"Daily QR verification failed: {str(e)}")
            return None
