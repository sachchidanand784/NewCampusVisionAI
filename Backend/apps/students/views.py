from rest_framework import status, permissions, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import StudentProfile
from .serializers import StudentProfileSerializer, RegisterFaceSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrGateMan

class StudentProfileMeView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the student profile for the currently logged-in student.
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Return the StudentProfile associated with the requesting user
        return get_object_or_404(StudentProfile, user=self.request.user)


class RegisterFaceView(APIView):
    """
    Endpoint for students to upload their face photo to register/update their face model.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        student_profile = get_object_or_404(StudentProfile, user=request.user)
        
        serializer = RegisterFaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        image_file = serializer.validated_data['image']
        encoding = serializer.validated_data['face_encoding']
        
        # Save face image and update database profile
        serializer.update_profile_face(student_profile, image_file, encoding)
        
        return Response(
            {
                "message": "Face registration completed successfully.",
                "face_image_url": student_profile.face_image_url
            },
            status=status.HTTP_200_OK
        )


class StudentListView(generics.ListCreateAPIView):
    """
    Allows Admins and Gate Mans to list all students, with search filters for roll number and department.
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdminOrGateMan]
    queryset = StudentProfile.objects.all().select_related('user')
    filter_backends = [filters.SearchFilter]
    search_fields = ['roll_number', 'user__username', 'user__first_name', 'user__last_name', 'department']


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Allows Admin users to view, update, or delete any student profile.
    """
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdmin]
    queryset = StudentProfile.objects.all()

    def perform_destroy(self, instance):
        # When deleting the profile, delete the underlying user account as well
        user = instance.user
        instance.delete()
        user.delete()


class StudentResetView(APIView):
    """
    Allows Admins to reset/unblock a blocked student (e.g. after 5 late entries).
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        profile = get_object_or_404(StudentProfile, pk=pk)
        
        profile.blocked = False
        profile.late_count = 0
        profile.save()
        
        return Response(
            {"message": f"Student access has been reset and unblocked successfully."},
            status=status.HTTP_200_OK
        )


class VerifyRollNumberView(APIView):
    """
    Endpoint for verifying if a student exists by their roll number.
    Returns basic profile info required for attendance verification.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        roll_number = request.data.get('roll_number')
        if not roll_number:
            return Response({"error": "Roll number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Search for student (case insensitive match on roll number)
        student = StudentProfile.objects.filter(roll_number__iexact=roll_number.strip()).first()
        if not student:
            return Response({"error": "Student record not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "message": "Student found.",
                "student_id": student.id,
                "roll_number": student.roll_number,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "department": student.department,
                "session": student.session,
                "face_image_url": student.face_image_url,
                "face_registered": student.face_registered,
                "blocked": student.blocked
            },
            status=status.HTTP_200_OK
        )

from django.utils import timezone
from services.face_service import FaceService

class VerifyLiveFaceView(APIView):
    """
    Endpoint for verifying a live captured face against the student's registered face.
    Does not mark attendance, only verifies identity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        roll_number = request.data.get('roll_number')
        image_file = request.FILES.get('image')

        if not roll_number or not image_file:
            return Response(
                {"error": "Roll number and Live face image are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = StudentProfile.objects.filter(roll_number__iexact=roll_number.strip()).first()
        if not student:
            return Response({"error": "Student record not found."}, status=status.HTTP_404_NOT_FOUND)

        if student.blocked:
            return Response({"error": "Access Blocked. Please contact the administrator."}, status=status.HTTP_403_FORBIDDEN)

        # Check if temporarily blocked
        if student.attendance_blocked_until and student.attendance_blocked_until > timezone.now():
            time_left = int((student.attendance_blocked_until - timezone.now()).total_seconds() / 60)
            return Response(
                {"error": f"Identity verification temporarily blocked due to multiple failures. Try again in {time_left} minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        if not student.face_registered or not student.face_encoding:
            return Response(
                {"error": "No face template registered for this account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        live_encoding = FaceService.get_face_encoding(image_file)
        if not live_encoding:
            return Response(
                {"error": "No face detected in live captured image. Make sure your face is clearly visible."},
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
                    "error": "Face mismatch. Identity could not be verified.",
                    "score": round(confidence, 4),
                    "attempts_left": attempts_left
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset failed attempts on success
        student.attendance_failed_attempts = 0
        student.save()

        return Response(
            {
                "message": "Face Verification Successful",
                "match": True,
                "score": round(confidence, 4)
            },
            status=status.HTTP_200_OK
        )
