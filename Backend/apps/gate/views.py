from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import GateConfig, GateRecord
from .serializers import GateConfigSerializer, GateRecordSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrGateMan
from apps.students.models import StudentProfile
from apps.attendance.models import AttendanceConfig, AttendanceRecord
from services.email_service import EmailService

class GateConfigListCreateView(generics.ListCreateAPIView):
    """
    List and create gate entry/exit timings configuration.
    Allowed only for Admins.
    """
    serializer_class = GateConfigSerializer
    permission_classes = [IsAdmin]
    queryset = GateConfig.objects.all()


class GateConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete specific gate timing configuration.
    Allowed only for Admins.
    """
    serializer_class = GateConfigSerializer
    permission_classes = [IsAdmin]
    queryset = GateConfig.objects.all()


class GateRecordListView(generics.ListAPIView):
    """
    List gate entry/exit logs.
    - Admins/Gatemen can view all logs.
    - Students are restricted to their own logs.
    """
    serializer_class = GateRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            profile = get_object_or_404(StudentProfile, user=user)
            queryset = GateRecord.objects.filter(student=profile)
        else:
            queryset = GateRecord.objects.all().select_related('student__user', 'gate_man')

        # Filters
        direction = self.request.query_params.get('direction')
        if direction:
            queryset = queryset.filter(direction=direction)

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(timestamp__date=date_param)

        roll = self.request.query_params.get('roll_number')
        if roll and user.role != 'STUDENT':
            queryset = queryset.filter(student__roll_number=roll)

        return queryset


class ProcessGateEntryView(APIView):
    """
    Main endpoint for gatemen or automated scanners to process a student gate entry or exit.
    Verifies state, late counts, sends emails, blocks if needed, and logs attendance.
    """
    permission_classes = [IsAdminOrGateMan]

    def post(self, request):
        roll_number = request.data.get('roll_number')
        direction = request.data.get('direction', 'ENTRY').upper()  # ENTRY or EXIT
        method = request.data.get('method', 'FACE').upper()  # FACE, QR, MANUAL
        
        if not roll_number:
            return Response({"error": "Student roll number is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        student = get_object_or_404(StudentProfile, roll_number=roll_number)
        
        # 1. Access validation
        if student.blocked:
            return Response(
                {
                    "error": "ACCESS BLOCKED. This student is blocked due to excessive late entries. Admin reset required."
                }, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        current_datetime = timezone.now()
        current_time = current_datetime.time()
        current_date = current_datetime.date()
        
        # Get active gate configurations
        gate_config = GateConfig.get_active_config(current_date)
        attendance_config = AttendanceConfig.get_config()

        # 2. Check if gate entry is closed by Admin
        if direction == 'ENTRY' and attendance_config.is_gate_closed:
            return Response(
                {"error": "Gate entry is closed by Administration."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        is_late_log = False

        if direction == 'ENTRY':
            # Detect late entry
            if current_time < gate_config.entry_start_time or current_time > gate_config.entry_end_time:
                is_late_log = True
                student.late_count += 1
                student.save()
                
                # Late alert emails triggered
                EmailService.send_late_alert(
                    email=student.user.email,
                    student_name=student.user.get_full_name() or student.user.username,
                    late_count=student.late_count
                )
                
                # Block student if late count reaches 5
                if student.late_count >= 5:
                    student.blocked = True
                    student.save()
        
        # 3. Create Gate Record
        gate_record = GateRecord.objects.create(
            student=student,
            direction=direction,
            timestamp=current_datetime,
            is_late=is_late_log,
            verified_by=method,
            gate_man=request.user
        )

        # 4. Automatically Mark Attendance (ENTRY or EXIT)
        attendance_info = None
        if direction == 'ENTRY' and not student.blocked:
            # Check if attendance is within the allowed range
            start_range = attendance_config.attendance_range_start
            end_range = attendance_config.attendance_range_end
            
            from django.utils.dateparse import parse_time
            if isinstance(start_range, str):
                start_range = parse_time(start_range)
            if isinstance(end_range, str):
                end_range = parse_time(end_range)
            
            attendance_status = 'PRESENT'
            if current_time > end_range:
                attendance_status = 'LATE'
            elif current_time < start_range:
                attendance_status = 'PRESENT'  # Early entry counts as present

            attendance_record, created = AttendanceRecord.objects.get_or_create(
                student=student,
                date=current_date,
                defaults={
                    'status': attendance_status,
                    'marked_by': 'AUTO' if method == 'FACE' else 'MANUAL',
                    'gate_man': request.user,
                    'timestamp': current_datetime
                }
            )
            
            if not created and attendance_record.status != 'PRESENT':
                # If already marked absent or late, upgrade to present/late if they physically entered now
                attendance_record.status = attendance_status
                attendance_record.marked_by = 'AUTO' if method == 'FACE' else 'MANUAL'
                attendance_record.gate_man = request.user
                attendance_record.save()
                
            attendance_info = {
                "date": attendance_record.date,
                "status": attendance_record.status,
                "marked_by": attendance_record.marked_by
            }
        elif direction == 'EXIT' and not student.blocked:
            existing_record = AttendanceRecord.objects.filter(student=student, date=current_date).first()
            if existing_record and not existing_record.checkout_time:
                existing_record.checkout_time = current_time
                existing_record.save()
                attendance_info = {
                    "date": existing_record.date,
                    "status": "CHECKED_OUT",
                    "marked_by": existing_record.marked_by,
                    "checkout_time": current_time.strftime("%H:%M:%S")
                }

        return Response(
            {
                "message": f"Gate {direction} logged successfully.",
                "student_name": student.user.get_full_name() or student.user.username,
                "roll_number": student.roll_number,
                "is_late_entry": is_late_log,
                "late_count": student.late_count,
                "blocked": student.blocked,
                "attendance_marked": attendance_info,
                "record": GateRecordSerializer(gate_record).data
            },
            status=status.HTTP_200_OK
        )
