from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import uuid
import random
from django.utils import timezone

from apps.students.models import StudentProfile
from services.qr_service import QrService
from apps.accounts.permissions import IsAdminOrGateMan, IsAdmin
from apps.students.serializers import StudentProfileSerializer
from .models import DailyQR

class GenerateQrView(APIView):
    """
    Endpoint for a logged-in student to fetch their personal gate pass QR code.
    Generates a secure JWT token and returns a base64-encoded QR image.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_object_or_404(StudentProfile, user=request.user)
        
        # 1. Generate a unique 6-digit random code
        while True:
            pass_code = str(random.randint(100000, 999999))
            if not StudentProfile.objects.filter(gate_pass_code=pass_code).exists():
                break
                
        # 2. Assign and save the code
        student.gate_pass_code = pass_code
        student.save()
        
        # 3. Generate QR Image using the 6-digit code
        qr_image_base64 = QrService.generate_qr_image_base64(pass_code)
        
        return Response(
            {
                "pass_code": pass_code,
                "qr_image": qr_image_base64,
                "roll_number": student.roll_number
            },
            status=status.HTTP_200_OK
        )


class VerifyQrView(APIView):
    """
    Endpoint for Gatemen or Admins to verify a student's Gate Pass OTP.
    Checks if the 6-digit code is valid and single-use.
    """
    permission_classes = [IsAdminOrGateMan]

    def post(self, request):
        pass_code = request.data.get('pass_code')
        if not pass_code:
            # Fallback for old clients if needed, or just require pass_code
            token = request.data.get('token')
            if token:
                pass_code = token
            else:
                return Response({"error": "Gate pass code is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. Find student by pass_code
        student = StudentProfile.objects.filter(gate_pass_code=pass_code).first()
        if not student:
            return Response(
                {"error": "Gate pass code is invalid, expired, or has already been used."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 2. Consume the one-time pass code
        student.gate_pass_code = None
        student.save()
        
        # 3. Access checks
        if student.blocked:
            return Response(
                {
                    "error": "ACCESS BLOCKED. This student's campus access is suspended.",
                    "student": StudentProfileSerializer(student).data
                },
                status=status.HTTP_403_FORBIDDEN
            )
            
        return Response(
            {
                "message": "Gate pass verified successfully.",
                "student": StudentProfileSerializer(student).data
            },
            status=status.HTTP_200_OK
        )


class GenerateDailyQrView(APIView):
    """
    Endpoint for Admin to generate a new active daily attendance QR code.
    Invalidates all previous QR codes.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        qr_type = request.data.get('qr_type', 'ENTRY').upper()
        if qr_type not in ['ENTRY', 'EXIT']:
            return Response({"error": "Invalid qr_type"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Mark all previous QR codes of same type as inactive
        DailyQR.objects.filter(is_active=True, qr_type=qr_type).update(is_active=False)

        # 2. Generate details
        session_id = uuid.uuid4()
        local_date = timezone.localdate()
        date_str = str(local_date)
        timestamp_str = timezone.now().isoformat()

        # 3. Create cryptographically signed token
        token = QrService.generate_daily_qr_token(session_id, date_str, timestamp_str, qr_type=qr_type)

        # 4. Save DailyQR record
        daily_qr = DailyQR.objects.create(
            session_id=session_id,
            token=token,
            generated_by=request.user,
            qr_type=qr_type,
            is_active=True
        )

        # 5. Render base64 image
        qr_image = QrService.generate_qr_image_base64(token)

        return Response(
            {
                "session_id": str(session_id),
                "date": date_str,
                "timestamp": timestamp_str,
                "token": token,
                "qr_image": qr_image,
                "qr_type": qr_type,
                "is_active": True
            },
            status=status.HTTP_201_CREATED
        )


class ActiveDailyQrView(APIView):
    """
    Endpoint for authenticated users (gatemen, students) to retrieve the active daily QR code.
    If the active QR code is from a previous date, it is automatically marked inactive.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qr_type = request.query_params.get('qr_type', 'ENTRY').upper()
        today = timezone.localdate()
        active_qr = DailyQR.objects.filter(is_active=True, qr_type=qr_type).first()

        if not active_qr:
            return Response({"detail": f"No active {qr_type.lower()} QR code found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if expired (from a previous day)
        if active_qr.date != today:
            active_qr.is_active = False
            active_qr.save()
            return Response({"detail": "The active QR code has expired."}, status=status.HTTP_404_NOT_FOUND)

        # Generate base64 image representation of token
        qr_image = QrService.generate_qr_image_base64(active_qr.token)

        return Response(
            {
                "id": active_qr.id,
                "session_id": str(active_qr.session_id),
                "date": str(active_qr.date),
                "timestamp": active_qr.created_at.isoformat(),
                "qr_image": qr_image,
                "token": active_qr.token,
                "qr_type": active_qr.qr_type,
                "is_active": active_qr.is_active
            },
            status=status.HTTP_200_OK
        )

class ValidateDailyQrTokenView(APIView):
    """
    Endpoint for validating the Daily QR Token before starting attendance flow.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "QR token is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify crypto signature
        payload = QrService.verify_daily_qr_token(token)
        if not payload:
            return Response({"error": "Invalid or expired QR token signature."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check Database for Active DailyQR
        daily_qr = DailyQR.objects.filter(token=token, is_active=True).first()
        if not daily_qr:
            return Response({"error": "This QR token is inactive, expired, or invalid."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check Date
        today = timezone.localdate()
        if daily_qr.date != today:
            daily_qr.is_active = False
            daily_qr.save()
            return Response({"error": "This QR token is from a past date and has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Return Gate Info
        return Response(
            {
                "message": "QR Validated",
                "gate_id": daily_qr.generated_by.id,
                "gate_name": daily_qr.generated_by.get_full_name() or daily_qr.generated_by.username,
                "qr_type": daily_qr.qr_type,
                "timestamp": daily_qr.created_at.isoformat(),
            },
            status=status.HTTP_200_OK
        )
