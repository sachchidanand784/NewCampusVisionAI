from rest_framework import serializers
from .models import AttendanceConfig, AttendanceRecord
from apps.students.models import StudentProfile
from apps.students.serializers import StudentProfileSerializer

class AttendanceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceConfig
        fields = ('attendance_range_start', 'attendance_range_end', 'is_gate_closed')


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    gate_man_name = serializers.CharField(source='gate_man.get_full_name', read_only=True)

    total_time = serializers.SerializerMethodField()
    campus_status = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = (
            'id', 'student', 'timestamp', 'date', 'time', 'checkout_time', 'roll_number',
            'status', 'marked_by', 'confidence_score', 'face_match_score',
            'qr_session_id', 'gate_man_name', 'total_time', 'campus_status'
        )

    def get_total_time(self, obj):
        if obj.time and obj.checkout_time:
            from datetime import datetime
            t1 = datetime.combine(obj.date, obj.time)
            t2 = datetime.combine(obj.date, obj.checkout_time)
            delta = t2 - t1
            seconds = delta.total_seconds()
            if seconds < 0:
                return "Invalid"
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            return f"{hours}h {minutes}m"
        return "N/A"

    def get_campus_status(self, obj):
        if obj.time and not obj.checkout_time:
            return "Inside Campus"
        elif obj.time and obj.checkout_time:
            return "Exited"
        return "Not Entered"


class ManualMarkAttendanceSerializer(serializers.Serializer):
    roll_number = serializers.CharField(required=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES, default='PRESENT')

    def validate(self, attrs):
        roll_number = attrs.get('roll_number')
        try:
            student = StudentProfile.objects.get(roll_number=roll_number)
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError({"roll_number": f"Student with roll number '{roll_number}' not found."})

        if student.blocked:
            raise serializers.ValidationError({"roll_number": "Student is blocked due to excessive late entries. Cannot mark attendance."})

        attrs['student'] = student
        return attrs
