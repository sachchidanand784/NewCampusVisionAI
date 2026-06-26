import random
from django.utils import timezone
from django.db import transaction
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import OTPVerification, User
from apps.students.models import StudentProfile
from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    RequestOtpSerializer,
    VerifyOtpSerializer,
    ResetPasswordSerializer
)
from services.email_service import EmailService

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Subclass JWT TokenObtainPairSerializer to inject role and profile status in response.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        # Inject additional user context into response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
        }
        
        # Check if student and if face is registered or blocked
        if self.user.role == User.STUDENT:
            profile = getattr(self.user, 'student_profile', None)
            if profile:
                data['user']['student_profile'] = {
                    'roll_number': profile.roll_number,
                    'face_registered': profile.face_registered,
                    'blocked': profile.blocked,
                    'late_count': profile.late_count,
                }
            else:
                data['user']['student_profile'] = None
                
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RequestOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        # Generate 6 digit code
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        # Save OTP record
        OTPVerification.objects.create(
            email=email,
            otp=otp_code,
            expires_at=expires_at
        )
        
        # Send Email
        email_sent = EmailService.send_otp_email(email, otp_code)
        
        if email_sent:
            return Response(
                {"message": "OTP verification code sent to your email."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Failed to send verification email. Please check SMTP settings."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        otp_record = OTPVerification.objects.filter(email=email, is_verified=False).first()
        if not otp_record:
            return Response({"error": "No OTP found for this email."}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.is_expired():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.otp != otp:
            return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)


class UserRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 1. Early check for STUDENT roll number uniqueness
        role = request.data.get('role', 'STUDENT')
        if role == 'STUDENT':
            roll_number = request.data.get('roll_number')
            if not roll_number:
                return Response(
                    {"error": "Students must provide roll_number, department, and session."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if StudentProfile.objects.filter(roll_number=roll_number).exists():
                return Response(
                    {"error": "A student profile with this roll number already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = UserRegisterSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # If the user is registered as STUDENT, check for academic info to create profile
                if user.role == User.STUDENT:
                    roll_number = request.data.get('roll_number')
                    department = request.data.get('department')
                    session = request.data.get('session')
                    phone_number = request.data.get('phone_number', '')
                    
                    if not roll_number or not department or not session:
                        raise ValueError("Students must provide roll_number, department, and session.")
                    
                    # Create student profile
                    StudentProfile.objects.create(
                        user=user,
                        roll_number=roll_number,
                        department=department,
                        session=session,
                        phone_number=phone_number
                    )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(
            {"message": "Registration successful. Please login."},
            status=status.HTTP_201_CREATED
        )


class ResetPasswordRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        user_exists = User.objects.filter(email=email).exists()
        if not user_exists:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
            
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        OTPVerification.objects.create(
            email=email,
            otp=otp_code,
            expires_at=expires_at
        )
        
        # Send Email
        email_sent = EmailService.send_otp_email(email, otp_code)
        
        if email_sent:
            return Response(
                {"message": "Password reset verification code sent to your email."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Failed to send email. Check backend configurations."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']
        
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        
        # Mark OTP as verified
        OTPVerification.objects.filter(email=email).update(is_verified=True)
        
        return Response(
            {"message": "Password reset successful. You can now login with your new password."},
            status=status.HTTP_200_OK
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        user_data = self.get_serializer(user).data
        
        # Return student profile if user is a student
        if user.role == User.STUDENT:
            profile = getattr(user, 'student_profile', None)
            if profile:
                user_data['student_profile'] = {
                    'roll_number': profile.roll_number,
                    'department': profile.department,
                    'session': profile.session,
                    'phone_number': profile.phone_number,
                    'face_image_url': profile.face_image_url,
                    'face_registered': profile.face_registered,
                    'blocked': profile.blocked,
                    'late_count': profile.late_count,
                }
                
        return Response(user_data)
