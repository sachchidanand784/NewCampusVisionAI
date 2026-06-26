from django.urls import path
from .views import GenerateQrView, VerifyQrView, GenerateDailyQrView, ActiveDailyQrView

urlpatterns = [
    path('generate/', GenerateQrView.as_view(), name='generate_qr'),
    path('verify/', VerifyQrView.as_view(), name='verify_qr'),
    path('daily/generate/', GenerateDailyQrView.as_view(), name='generate_daily_qr'),
    path('daily/active/', ActiveDailyQrView.as_view(), name='active_daily_qr'),
]
