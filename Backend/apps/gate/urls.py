from django.urls import path
from .views import (
    GateConfigListCreateView,
    GateConfigDetailView,
    GateRecordListView,
    ProcessGateEntryView
)

urlpatterns = [
    path('config/', GateConfigListCreateView.as_view(), name='gate_config_list'),
    path('config/<int:pk>/', GateConfigDetailView.as_view(), name='gate_config_detail'),
    path('records/', GateRecordListView.as_view(), name='gate_records_list'),
    path('process/', ProcessGateEntryView.as_view(), name='process_gate_entry'),
]
