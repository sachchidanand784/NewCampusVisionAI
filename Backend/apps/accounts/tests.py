from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import OTPVerification, User
from apps.students.models import StudentProfile

class OTPVerificationModelTest(TestCase):
    def test_otp_expiry(self):
        now = timezone.now()
        otp_active = OTPVerification.objects.create(
            email="test@example.com",
            otp="123456",
            expires_at=now + timezone.timedelta(minutes=10)
        )
        otp_expired = OTPVerification.objects.create(
            email="test2@example.com",
            otp="654321",
            expires_at=now - timezone.timedelta(minutes=10)
        )
        self.assertFalse(otp_active.is_expired())
        self.assertTrue(otp_expired.is_expired())


class UserRegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.request_otp_url = reverse('request_otp')
        self.verify_otp_url = reverse('verify_otp')
        self.email = "student@example.com"
        
        # Create an Admin user for testing bypass
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword123",
            role="ADMIN"
        )

    def test_student_register_without_otp_fails(self):
        data = {
            "username": "student_test",
            "email": self.email,
            "password": "studentpassword123",
            "first_name": "Test",
            "last_name": "Student",
            "roll_number": "CS-123",
            "department": "CSE",
            "session": "2022-2026",
            "otp": "111111",
            "role": "STUDENT"
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("otp", response.data)

    def test_student_register_with_valid_otp_succeeds(self):
        # 1. Create verification record
        OTPVerification.objects.create(
            email=self.email,
            otp="123456",
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )
        
        data = {
            "username": "student_test",
            "email": self.email,
            "password": "studentpassword123",
            "first_name": "Test",
            "last_name": "Student",
            "roll_number": "CS-123",
            "department": "CSE",
            "session": "2022-2026",
            "otp": "123456",
            "role": "STUDENT"
        }
        
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user is created and student profile exists
        user = User.objects.get(username="student_test")
        self.assertEqual(user.role, "STUDENT")
        profile = StudentProfile.objects.get(user=user)
        self.assertEqual(profile.roll_number, "CS-123")

    def test_admin_registers_student_bypasses_otp(self):
        # Authenticate client as Admin
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            "username": "admin_created_student",
            "email": "admin_student@example.com",
            "password": "studentpassword123",
            "first_name": "Admin",
            "last_name": "Student",
            "roll_number": "CS-999",
            "department": "CSE",
            "session": "2022-2026",
            "otp": "111111", # dummy OTP
            "role": "STUDENT"
        }
        
        # Request should succeed bypassing database OTP verification
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(username="admin_created_student")
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    def test_duplicate_roll_number_fails_early_and_avoids_orphans(self):
        # 1. Create existing student
        existing_user = User.objects.create_user(
            username="existing_student",
            email="existing@example.com",
            password="password123",
            role="STUDENT"
        )
        StudentProfile.objects.create(
            user=existing_user,
            roll_number="CS-DUP",
            department="CSE",
            session="2022-2026"
        )
        
        # 2. Try to register new student with same roll number
        OTPVerification.objects.create(
            email="newstudent@example.com",
            otp="123456",
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )
        
        data = {
            "username": "new_student",
            "email": "newstudent@example.com",
            "password": "newpassword123",
            "first_name": "New",
            "last_name": "Student",
            "roll_number": "CS-DUP", # duplicate
            "department": "ECE",
            "session": "2022-2026",
            "otp": "123456",
            "role": "STUDENT"
        }
        
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Make sure no orphaned user "new_student" was created in database
        self.assertFalse(User.objects.filter(username="new_student").exists())
