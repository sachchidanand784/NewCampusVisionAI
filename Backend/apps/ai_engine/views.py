from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
import logging

from apps.students.models import StudentProfile
from services.face_service import FaceService
from apps.accounts.permissions import IsAdminOrGateMan
from apps.students.serializers import StudentProfileSerializer

logger = logging.getLogger(__name__)

class FaceVerificationView(APIView):
    """
    Verifies a captured camera image against all registered, active student face encodings.
    Expects an uploaded image file in request.FILES['image'].
    """
    permission_classes = [IsAdminOrGateMan]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "Image file is required in 'image' field."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Generate face encoding for the query image
            query_encoding = FaceService.get_face_encoding(image_file)
            if not query_encoding:
                return Response(
                    {"error": "No face detected in the captured image. Please try again with clear lighting."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Retrieve all active registered students
            active_students = StudentProfile.objects.filter(
                face_registered=True, 
                blocked=False
            ).select_related('user')
            
            if not active_students.exists():
                return Response(
                    {"error": "No registered students found in the system database."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # 3. Compile list of known encodings and map them to students
            known_encodings = []
            student_mapping = []
            
            for student in active_students:
                if student.face_encoding:
                    known_encodings.append(student.face_encoding)
                    student_mapping.append(student)

            if not known_encodings:
                return Response(
                    {"error": "No valid face encodings found in student profiles."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # 4. Compare faces
            match_index, confidence = FaceService.verify_face(query_encoding, known_encodings)

            if match_index is None:
                return Response(
                    {"error": "Verification failed. No matching student found."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # 5. Retrieve matching student
            matched_student = student_mapping[match_index]
            
            return Response(
                {
                    "message": "Student verified successfully by face recognition.",
                    "confidence_score": round(confidence, 4),
                    "student": StudentProfileSerializer(matched_student).data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Error during face verification: {str(e)}")
            return Response(
                {"error": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
