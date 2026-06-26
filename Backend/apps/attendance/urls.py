from django.urls import path
from .views import (
    AttendanceConfigDetailView,
    AttendanceRecordListView,
    ManualMarkAttendanceView,
    MarkQrAttendanceView
)

urlpatterns = [
    path('config/', AttendanceConfigDetailView.as_view(), name='attendance_config'),
    path('records/', AttendanceRecordListView.as_view(), name='attendance_records'),
    path('manual-mark/', ManualMarkAttendanceView.as_view(), name='manual_mark_attendance'),
    path('qr-mark/', MarkQrAttendanceView.as_view(), name='qr_mark_attendance'),
]
