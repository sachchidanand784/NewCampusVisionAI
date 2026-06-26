from django.urls import path
from .views import FaceVerificationView

urlpatterns = [
    path('verify-face/', FaceVerificationView.as_view(), name='verify_face'),
]
