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
