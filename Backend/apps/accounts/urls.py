from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RequestOtpView,
    VerifyOtpView,
    UserRegisterView,
    ResetPasswordRequestView,
    ResetPasswordConfirmView,
    UserProfileView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('request-otp/', RequestOtpView.as_view(), name='request_otp'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify_otp'),
    path('register/', UserRegisterView.as_view(), name='register'),
    path('reset-password-request/', ResetPasswordRequestView.as_view(), name='reset_password_request'),
    path('reset-password-confirm/', ResetPasswordConfirmView.as_view(), name='reset_password_confirm'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
