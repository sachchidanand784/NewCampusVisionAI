import csv
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from io import BytesIO

# ReportLab imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from apps.attendance.models import AttendanceRecord
from apps.students.models import StudentProfile
from apps.accounts.permissions import IsAdmin, IsAdminOrGateMan

class AdminDashboardStatsView(APIView):
    """
    Endpoint to retrieve summary stats and chart data for the Admin Dashboard.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localdate()
        
        # 1. Basic Stats Card Counts
        total_students = StudentProfile.objects.count()
        total_active_students = StudentProfile.objects.filter(blocked=False).count()
        
        today_records = AttendanceRecord.objects.filter(date=today)
        present_count = today_records.filter(status='PRESENT').count()
        absent_count = today_records.filter(status='ABSENT').count()
        late_count = today_records.filter(status='LATE').count()
        
        # 2. Compile Monthly Trends (last 30 days)
        last_30_days = today - timezone.timedelta(days=30)
        daily_stats = (
            AttendanceRecord.objects.filter(date__gte=last_30_days, date__lte=today)
            .values('date')
            .annotate(
                present=Count('id', filter=Q(status='PRESENT')),
                absent=Count('id', filter=Q(status='ABSENT')),
                late=Count('id', filter=Q(status='LATE'))
            )
            .order_by('date')
        )
        
        monthly_trends = [
            {
                "date": str(item['date']),
                "present": item['present'],
                "absent": item['absent'],
                "late": item['late']
            } for item in daily_stats
        ]

        return Response({
            "total_students": total_students,
            "total_active_students": total_active_students,
            "present_count": present_count,
            "absent_count": absent_count,
            "late_count": late_count,
            "monthly_trends": monthly_trends
        }, status=status.HTTP_200_OK)


class ExportAttendanceCsvView(APIView):
    """
    Generates and downloads a CSV export of attendance history.
    """
    permission_classes = [IsAdminOrGateMan]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        roll_number = request.query_params.get('roll_number')

        queryset = AttendanceRecord.objects.all().select_related('student__user')

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if roll_number:
            queryset = queryset.filter(student__roll_number=roll_number)

        # Setup HTTP response header
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_report_{timezone.localdate()}.csv"'

        writer = csv.writer(response)
        # Header Row
        writer.writerow(['Date', 'Student Name', 'Roll Number', 'Department', 'Session', 'Status', 'Marked By', 'Time'])

        for record in queryset:
            writer.writerow([
                record.date,
                record.student.user.get_full_name() or record.student.user.username,
                record.student.roll_number,
                record.student.department,
                record.student.session,
                record.status,
                record.get_marked_by_display(),
                record.timestamp.astimezone(timezone.get_current_timezone()).strftime("%H:%M:%S") if record.timestamp else ''
            ])

        return response


class ExportAttendancePdfView(APIView):
    """
    Generates and downloads a high-quality PDF report of attendance logs.
    """
    permission_classes = [IsAdminOrGateMan]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        roll_number = request.query_params.get('roll_number')

        queryset = AttendanceRecord.objects.all().select_related('student__user')

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if roll_number:
            queryset = queryset.filter(student__roll_number=roll_number)

        # Buffer for PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            name='SubTitleStyle',
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=20
        )
        cell_style = ParagraphStyle(
            name='CellStyle',
            fontName='Helvetica',
            fontSize=8,
            leading=10
        )
        header_cell_style = ParagraphStyle(
            name='HeaderCellStyle',
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.white
        )

        # Title
        elements.append(Paragraph("Campus Vision AI - Attendance Report", title_style))
        date_str = f"Generated on: {timezone.localdate()} | Range: {start_date or 'All'} to {end_date or 'All'}"
        elements.append(Paragraph(date_str, subtitle_style))

        # Data Table
        table_data = [[
            Paragraph("Date", header_cell_style),
            Paragraph("Roll Number", header_cell_style),
            Paragraph("Name", header_cell_style),
            Paragraph("Department", header_cell_style),
            Paragraph("Status", header_cell_style),
            Paragraph("Marked By", header_cell_style),
            Paragraph("Time", header_cell_style),
        ]]

        for record in queryset:
            time_str = record.timestamp.astimezone(timezone.get_current_timezone()).strftime("%H:%M:%S") if record.timestamp else ''
            table_data.append([
                Paragraph(str(record.date), cell_style),
                Paragraph(record.student.roll_number, cell_style),
                Paragraph(record.student.user.get_full_name() or record.student.user.username, cell_style),
                Paragraph(record.student.department, cell_style),
                Paragraph(record.status, cell_style),
                Paragraph(record.get_marked_by_display(), cell_style),
                Paragraph(time_str, cell_style),
            ])

        # Render Table
        # Widths: Date(60), Roll(70), Name(140), Dept(80), Status(65), Marked(80), Time(45) -> Sum = 540 (matches printable area)
        col_widths = [60, 70, 140, 80, 65, 80, 45]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t)

        # Build PDF
        doc.build(elements)
        
        pdf_content = buffer.getvalue()
        buffer.close()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="attendance_report_{timezone.localdate()}.pdf"'
        response.write(pdf_content)
        return response
