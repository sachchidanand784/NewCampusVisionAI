from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import AttendanceConfig, AttendanceRecord
from .serializers import (
    AttendanceConfigSerializer,
    AttendanceRecordSerializer,
    ManualMarkAttendanceSerializer
)
from apps.accounts.permissions import IsAdmin, IsAdminOrGateMan
from apps.students.models import StudentProfile
from services.qr_service import QrService
from services.face_service import FaceService
from apps.qr.models import DailyQR

class MarkQrAttendanceView(APIView):
    """
    Endpoint for students to scan the daily QR code and mark their attendance.
    Performs JWT validation, roll number checks, and live face verification.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Enforce student role
        if request.user.role != 'STUDENT':
            return Response(
                {"error": "Only students are allowed to mark attendance via QR code."},
                status=status.HTTP_403_FORBIDDEN
            )

        token = request.data.get('token')
        roll_number = request.data.get('roll_number')
        image_file = request.FILES.get('image')

        if not token or not roll_number or not image_file:
            return Response(
                {"error": "Scanned token, Roll number, and Live face image are all required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Get the student profile and verify against logged-in user
        try:
            student = StudentProfile.objects.get(roll_number=roll_number)
        except StudentProfile.DoesNotExist:
            return Response(
                {"error": "Invalid Roll Number. Student does not exist in the database."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if student.user != request.user:
            return Response(
                {"error": "You can only mark attendance for your own roll number."},
                status=status.HTTP_403_FORBIDDEN
            )

        if student.blocked:
            return Response(
                {"error": "Access Blocked. Please contact the administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Check if temporarily blocked due to 3 face failures
        if student.attendance_blocked_until and student.attendance_blocked_until > timezone.now():
            time_left = int((student.attendance_blocked_until - timezone.now()).total_seconds() / 60)
            return Response(
                {"error": f"Attendance is temporarily blocked due to multiple face verification failures. Try again in {time_left} minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # 4. Verify Daily QR Code Token
        payload = QrService.verify_daily_qr_token(token)
        if not payload:
            return Response(
                {"error": "QR code token is invalid, tampered with, or expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_id = payload.get('session_id')
        qr_type = payload.get('qr_type', 'ENTRY')
        daily_qr = DailyQR.objects.filter(session_id=session_id, is_active=True).first()
        if not daily_qr or daily_qr.date != timezone.localdate():
            return Response(
                {"error": "The scanned QR code is inactive, expired, or invalid for today's session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Flow Validation
        today = timezone.localdate()
        existing_record = AttendanceRecord.objects.filter(student=student, date=today).first()
        
        if qr_type == 'ENTRY':
            if existing_record:
                return Response(
                    {"error": "Attendance check-in already recorded for today."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif qr_type == 'EXIT':
            if not existing_record:
                return Response(
                    {"error": "You must check in first before checking out."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if existing_record.checkout_time:
                return Response(
                    {"error": "Attendance check-out already completed for today."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 6. Face Verification
        if not student.face_registered or not student.face_encoding:
            return Response(
                {"error": "No face template registered for this account. Register your face under profile settings first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        live_encoding = FaceService.get_face_encoding(image_file)
        if not live_encoding:
            return Response(
                {"error": "No face detected in live captured image. Make sure your face is clearly visible with good lighting."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1-to-1 match using FaceService
        _, confidence = FaceService.verify_face(live_encoding, [student.face_encoding], tolerance=0.5)

        # Configurable similarity threshold: 85% (0.85)
        if confidence < 0.85:
            # Increment failed attempts
            student.attendance_failed_attempts += 1
            if student.attendance_failed_attempts >= 3:
                student.attendance_blocked_until = timezone.now() + timezone.timedelta(minutes=15)
                student.attendance_failed_attempts = 0
                student.save()
                return Response(
                    {"error": "Face Verification Failed. 3 failed attempts recorded. Access blocked for 15 minutes."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student.save()
            attempts_left = 3 - student.attendance_failed_attempts
            return Response(
                {
                    "error": "Face Verification Failed. Face Match Score is below the 85% threshold.",
                    "score": round(confidence, 4),
                    "attempts_left": attempts_left
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset failed attempts on success
        student.attendance_failed_attempts = 0
        student.save()

        # Determine attendance status (PRESENT or LATE) based on configurations
        attendance_config = AttendanceConfig.get_config()
        current_time = timezone.localtime().time()
        
        qr_type = payload.get('qr_type', 'ENTRY')
        if qr_type == 'EXIT':
            # We are checking out!
            existing_record.checkout_time = current_time
            existing_record.save()
            return Response(
                {
                    "message": "Check-out Marked Successfully",
                    "student_name": student.user.get_full_name() or student.user.username,
                    "roll_number": student.roll_number,
                    "date": today,
                    "checkout_time": current_time,
                    "status": existing_record.status,
                    "score": round(confidence, 4),
                    "marked_by": 'AUTO',
                },
                status=status.HTTP_200_OK
            )
            
        # Check if late check-in
        if current_time > attendance_config.attendance_range_end:
            attendance_status = 'LATE'
            # Trigger warning/late increase logic as in gate logs if required
            student.late_count += 1
            if student.late_count >= 5:
                student.blocked = True
            student.save()
            
            # Send late warning email if late count reaches triggers
            from services.email_service import EmailService
            EmailService.send_late_alert(
                student.user.email,
                student.user.get_full_name() or student.user.username,
                student.late_count
            )
        else:
            attendance_status = 'PRESENT'

        # 7. Record Attendance
        record = AttendanceRecord.objects.create(
            student=student,
            roll_number=roll_number,
            date=today,
            time=current_time,
            status=attendance_status,
            marked_by='AUTO',  # Automatic (Face Recognition)
            confidence_score=confidence,
            face_match_score=confidence,
            qr=daily_qr,
            qr_session_id=daily_qr.session_id
        )

        return Response(
            {
                "message": "Check-in Marked Successfully",
                "date": str(today),
                "time": record.time.strftime("%I:%M %p") if record.time else "",
                "status": record.status,
                "face_match_score": round(confidence, 4)
            },
            status=status.HTTP_201_CREATED
        )

class AttendanceConfigDetailView(APIView):
    """
    Endpoint to get or update the attendance system settings (e.g. range times, gate status).
    Get is allowed for authenticated users. Put is allowed only for Admin.
    """
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        config = AttendanceConfig.get_config()
        serializer = AttendanceConfigSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config = AttendanceConfig.get_config()
        serializer = AttendanceConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AttendanceRecordListView(generics.ListAPIView):
    """
    Retrieve list of attendance records.
    - Admins and Gatemen can list all records and filter by date, status, or roll number.
    - Students are locked to viewing ONLY their own attendance history records.
    """
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Filter by role
        if user.role == 'STUDENT':
            student_profile = get_object_or_404(StudentProfile, user=user)
            queryset = AttendanceRecord.objects.filter(student=student_profile)
        else:
            queryset = AttendanceRecord.objects.all().select_related('student__user', 'gate_man')

        # 2. Filter by date/query parameters
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        roll_param = self.request.query_params.get('roll_number')
        if roll_param and user.role != 'STUDENT':
            queryset = queryset.filter(student__roll_number=roll_param)
            
        month_param = self.request.query_params.get('month')
        if month_param:
            # month parameter in format YYYY-MM
            try:
                year, month = map(int, month_param.split('-'))
                queryset = queryset.filter(date__year=year, date__month=month)
            except ValueError:
                pass

        return queryset


class ManualMarkAttendanceView(APIView):
    """
    Endpoint for admins or gatemen to manually mark attendance for a student.
    """
    permission_classes = [IsAdminOrGateMan]

    def post(self, request):
        serializer = ManualMarkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        student = serializer.validated_data['student']
        status_to_mark = serializer.validated_data['status']
        current_date = timezone.localdate()
        
        # Check if record already exists for today
        attendance_record, created = AttendanceRecord.objects.get_or_create(
            student=student,
            date=current_date,
            defaults={
                'status': status_to_mark,
                'marked_by': 'MANUAL',
                'gate_man': request.user,
                'timestamp': timezone.now()
            }
        )
        
        if not created:
            # Update existing record
            attendance_record.status = status_to_mark
            attendance_record.marked_by = 'MANUAL'
            attendance_record.gate_man = request.user
            attendance_record.timestamp = timezone.now()
            attendance_record.save()
            
        return Response(
            {
                "message": f"Attendance marked as {status_to_mark} for student {student.user.get_full_name() or student.user.username}.",
                "record": AttendanceRecordSerializer(attendance_record).data
            },
            status=status.HTTP_200_OK
        )
