from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.students.models import StudentProfile
from apps.gate.models import GateConfig, GateRecord
from apps.attendance.models import AttendanceConfig
from services.qr_service import QrService

class GateProcessingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.process_url = reverse('process_gate_entry')
        self.verify_qr_url = reverse('verify_qr')
        
        # Create gateman user
        self.gateman = User.objects.create_user(
            username="gateman_test",
            email="gateman@example.com",
            password="password123",
            role="GATE_MAN"
        )
        self.client.force_authenticate(user=self.gateman)
        
        # Create student user and profile
        self.student_user = User.objects.create_user(
            username="student_john",
            email="john@example.com",
            password="password123",
            role="STUDENT"
        )
        self.student = StudentProfile.objects.create(
            user=self.student_user,
            roll_number="CS-101",
            department="CSE",
            session="2022-2026"
        )

        # Set up a default fallback gate config
        self.gate_config = GateConfig.objects.create(
            config_type='DEFAULT',
            entry_start_time="08:00:00",
            entry_end_time="10:00:00",
            exit_start_time="16:00:00",
            exit_end_time="18:00:00"
        )

    def test_log_entry_success(self):
        # Force current time to be within entry range (09:00:00)
        # Note: timezone.now() / timezone.localdate() / time mock can be simple
        # Since we cannot easily patch datetime.time in python natively without unittest.mock,
        # we can temporarily adjust the gate config to cover the current time to test "on time".
        current_time = timezone.now().time()
        # Adjust gate config so current time is well within entry times
        start_hour = (current_time.hour - 1) % 24
        end_hour = (current_time.hour + 1) % 24
        self.gate_config.entry_start_time = f"{start_hour:02d}:{current_time.minute:02d}:00"
        self.gate_config.entry_end_time = f"{end_hour:02d}:{current_time.minute:02d}:00"
        self.gate_config.save()
        
        data = {
            "roll_number": "CS-101",
            "direction": "ENTRY",
            "method": "FACE"
        }
        
        response = self.client.post(self.process_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_late_entry"])
        self.assertEqual(response.data["late_count"], 0)
        self.assertEqual(response.data["blocked"], False)
        
        # Verify GateRecord created
        self.assertTrue(GateRecord.objects.filter(student=self.student, direction="ENTRY").exists())

    def test_log_entry_late_count_enforced(self):
        # Adjust gate config so current time is outside entry times (e.g. entry ends 1 hour ago)
        current_time = timezone.now().time()
        end_hour = (current_time.hour - 1) % 24
        start_hour = (current_time.hour - 2) % 24
        self.gate_config.entry_start_time = f"{start_hour:02d}:00:00"
        self.gate_config.entry_end_time = f"{end_hour:02d}:00:00"
        self.gate_config.save()
        
        data = {
            "roll_number": "CS-101",
            "direction": "ENTRY",
            "method": "QR"
        }
        
        # Let's hit it 5 times to trigger lock
        for i in range(1, 6):
            response = self.client.post(self.process_url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.student.refresh_from_db()
            if i < 5:
                self.assertEqual(self.student.late_count, i)
                self.assertFalse(self.student.blocked)
            else:
                # On 5th late entry, we check if access validation block was triggered in process_url
                # Wait, on the 5th attempt:
                # At the beginning of the 5th call: student.late_count is 4, student.blocked is False.
                # In the view:
                # 1. Access validation passes (not blocked).
                # 2. Lateness detected, late_count is incremented to 5, saved.
                # 3. Block student triggered because late_count reaches 5, saved.
                # 4. View returns success (blocked=True).
                # Subsequent 6th call would return 403 Forbidden.
                # Let's assert:
                self.assertEqual(self.student.late_count, 5)
                self.assertTrue(self.student.blocked)
                self.assertTrue(response.data["blocked"])

        # 6th attempt should fail with 403 Forbidden access blocked
        response = self.client.post(self.process_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_closed_gate_policy_blocks_entry(self):
        # Configure gate to be closed
        attendance_config = AttendanceConfig.get_config()
        attendance_config.is_gate_closed = True
        attendance_config.save()
        
        data = {
            "roll_number": "CS-101",
            "direction": "ENTRY",
            "method": "MANUAL"
        }
        
        response = self.client.post(self.process_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Gate entry is closed by Administration.")

    def test_verify_qr_endpoints(self):
        # 1. Generate valid token
        token = QrService.generate_student_qr_token(self.student.id, self.student.roll_number)
        
        # Verify valid token
        response = self.client.post(self.verify_qr_url, {"token": token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["student"]["roll_number"], "CS-101")
        
        # Verify invalid token
        response = self.client.post(self.verify_qr_url, {"token": "invalid-token"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify blocked student QR
        self.student.blocked = True
        self.student.save()
        response = self.client.post(self.verify_qr_url, {"token": token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
