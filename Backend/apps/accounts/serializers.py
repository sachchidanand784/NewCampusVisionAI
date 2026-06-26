from rest_framework import serializers
from django.utils import timezone
from .models import OTPVerification, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('id', 'role')


class UserRegisterSerializer(serializers.ModelSerializer):
    otp = serializers.CharField(write_only=True, required=True, max_length=6)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.STUDENT)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'otp')

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        
        # Bypass OTP verification if the registration is being performed by an Admin
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.role == 'ADMIN':
            return attrs
        
        # Verify OTP
        otp_record = OTPVerification.objects.filter(email=email, is_verified=False).first()
        if not otp_record:
            raise serializers.ValidationError({"otp": "No OTP verification record found for this email."})
            
        if otp_record.is_expired():
            raise serializers.ValidationError({"otp": "OTP has expired."})
            
        if otp_record.otp != otp:
            raise serializers.ValidationError({"otp": "Invalid OTP code."})

        return attrs

    def create(self, validated_data):
        otp = validated_data.pop('otp')
        password = validated_data.pop('password')
        role = validated_data.get('role', User.STUDENT)
        
        # Mark OTP as verified
        OTPVerification.objects.filter(email=validated_data['email']).update(is_verified=True)

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.role = role
        user.save()
        return user


class RequestOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        
        # Verify OTP for password reset
        otp_record = OTPVerification.objects.filter(email=email, is_verified=False).first()
        if not otp_record:
            raise serializers.ValidationError({"otp": "No active OTP found for this email."})
            
        if otp_record.is_expired():
            raise serializers.ValidationError({"otp": "OTP has expired."})
            
        if otp_record.otp != otp:
            raise serializers.ValidationError({"otp": "Invalid OTP code."})
            
        return attrs
