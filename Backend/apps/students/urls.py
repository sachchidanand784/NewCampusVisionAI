from django.urls import path
from .views import (
    StudentProfileMeView,
    RegisterFaceView,
    StudentListView,
    StudentDetailView,
    StudentResetView,
    VerifyRollNumberView,
    VerifyLiveFaceView
)

urlpatterns = [
    path('me/', StudentProfileMeView.as_view(), name='student_profile_me'),
    path('register-face/', RegisterFaceView.as_view(), name='register_face'),
    path('', StudentListView.as_view(), name='student_list'),
    path('<int:pk>/', StudentDetailView.as_view(), name='student_detail'),
    path('reset/<int:pk>/', StudentResetView.as_view(), name='student_reset'),
    path('verify-roll/', VerifyRollNumberView.as_view(), name='verify_roll'),
    path('verify-face/', VerifyLiveFaceView.as_view(), name='verify_face'),
]
