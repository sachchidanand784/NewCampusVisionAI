from rest_framework import serializers
from .models import GateConfig, GateRecord
from apps.students.serializers import StudentProfileSerializer

class GateConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GateConfig
        fields = (
            'id', 'config_type', 'day_of_week', 'specific_date',
            'entry_start_time', 'entry_end_time', 'exit_start_time', 'exit_end_time'
        )


class GateRecordSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    gate_man_name = serializers.CharField(source='gate_man.get_full_name', read_only=True)

    class Meta:
        model = GateRecord
        fields = ('id', 'student', 'direction', 'timestamp', 'is_late', 'verified_by', 'gate_man_name')
