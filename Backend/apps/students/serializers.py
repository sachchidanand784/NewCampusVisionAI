from rest_framework import serializers
from .models import StudentProfile
from services.cloudinary_service import CloudinaryService
from services.face_service import FaceService

class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 
            'roll_number', 'department', 'session', 'phone_number',
            'face_image_url', 'face_registered', 'blocked', 'late_count'
        )
        read_only_fields = ('id', 'face_image_url', 'face_registered', 'blocked', 'late_count')


class RegisterFaceSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True, write_only=True)

    def validate(self, attrs):
        image_file = attrs.get('image')
        
        # Test if we can extract a face encoding from it using FaceService
        encoding = FaceService.get_face_encoding(image_file)
        if not encoding:
            raise serializers.ValidationError(
                {"image": "No face detected in the image or face recognition failed. Please upload a clear photo."}
            )
            
        attrs['face_encoding'] = encoding
        return attrs

    def update_profile_face(self, student_profile, image_file, encoding):
        # Reset file pointer to the beginning since it was read during face encoding extraction
        if hasattr(image_file, 'seek'):
            image_file.seek(0)

        # Delete old face image from Cloudinary if exists
        if student_profile.face_image_public_id:
            CloudinaryService.delete_image(student_profile.face_image_public_id)

        # Upload new image to Cloudinary
        upload_data = CloudinaryService.upload_image(image_file, folder="campus_vision/faces")
        
        # Save encoding and details
        student_profile.face_image_url = upload_data.get('url')
        student_profile.face_image_public_id = upload_data.get('public_id')
        student_profile.face_encoding = encoding
        student_profile.face_registered = True
        student_profile.save()
        
        return student_profile
