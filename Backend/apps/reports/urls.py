from django.urls import path
from .views import (
    AdminDashboardStatsView,
    ExportAttendanceCsvView,
    ExportAttendancePdfView
)

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('export/csv/', ExportAttendanceCsvView.as_view(), name='export_attendance_csv'),
    path('export/pdf/', ExportAttendancePdfView.as_view(), name='export_attendance_pdf'),
]
