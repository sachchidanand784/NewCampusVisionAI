import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  Settings,
  Calendar,
  Lock,
  Unlock,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  RefreshCw,
  PlusCircle,
  XCircle,
  Activity,
  LogOut,
  MapPin,
  Check,
  QrCode
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard statistics state
  const [stats, setStats] = useState({
    total_students: 0,
    total_active_students: 0,
    present_count: 0,
    absent_count: 0,
    late_count: 0,
    monthly_trends: []
  });

  // Students list state
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gate settings state
  const [attendanceConfig, setAttendanceConfig] = useState({
    attendance_range_start: '08:00:00',
    attendance_range_end: '10:00:00',
    is_gate_closed: false
  });

  // Gate Timing configurations state
  const [gateConfigs, setGateConfigs] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordFilter, setRecordFilter] = useState({ 
    date: '', 
    roll_number: '', 
    department: '', 
    entry_status: '', 
    campus_status: '' 
  });

  // Status & loading indicators
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingGateConfigs, setLoadingGateConfigs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddGateConfigModal, setShowAddGateConfigModal] = useState(false);
  
  // Daily QR attendance states
  const [entryQr, setEntryQr] = useState(null);
  const [exitQr, setExitQr] = useState(null);
  const [generatingEntryQr, setGeneratingEntryQr] = useState(false);
  const [generatingExitQr, setGeneratingExitQr] = useState(false);

  // Forms
  const { register: registerStudent, handleSubmit: handleSubmitStudent, reset: resetStudentForm, formState: { errors: studentErrors } } = useForm();
  const { register: registerConfig, handleSubmit: handleSubmitConfig, reset: resetConfigForm } = useForm();
  const { register: registerTimes, handleSubmit: handleSubmitTimes, reset: resetTimesForm } = useForm();

  // Load all initial data on mount
  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchAttendanceConfig();
    fetchGateConfigs();
    fetchAttendanceRecords();
    fetchActiveEntryQr();
    fetchActiveExitQr();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get('/reports/stats/');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchStudents = async (query = '') => {
    setLoadingStudents(true);
    try {
      const url = query ? `/students/?search=${query}` : '/students/';
      const res = await apiClient.get(url);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load students directory.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchAttendanceConfig = async () => {
    try {
      const res = await apiClient.get('/attendance/config/');
      setAttendanceConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGateConfigs = async () => {
    setLoadingGateConfigs(true);
    try {
      const res = await apiClient.get('/gate/config/');
      setGateConfigs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGateConfigs(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoadingRecords(true);
    try {
      let params = {};
      if (recordFilter.date) params.date = recordFilter.date;
      if (recordFilter.roll_number) params.roll_number = recordFilter.roll_number;
      if (recordFilter.department) params.department = recordFilter.department;
      if (recordFilter.entry_status) params.status = recordFilter.entry_status;
      if (recordFilter.campus_status) params.campus_status = recordFilter.campus_status;

      const res = await apiClient.get('/attendance/records/', { params });
      setAttendanceRecords(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchActiveEntryQr = async () => {
    try {
      const res = await apiClient.get('/qr/daily/active/?qr_type=ENTRY');
      setEntryQr(res.data);
    } catch (err) {
      setEntryQr(null);
    }
  };

  const fetchActiveExitQr = async () => {
    try {
      const res = await apiClient.get('/qr/daily/active/?qr_type=EXIT');
      setExitQr(res.data);
    } catch (err) {
      setExitQr(null);
    }
  };

  const handleGenerateEntryQr = async () => {
    setGeneratingEntryQr(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiClient.post('/qr/daily/generate/', { qr_type: 'ENTRY' });
      setEntryQr(res.data);
      setSuccessMessage("New secure ENTRY QR code generated successfully!");
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Failed to generate entry QR code.");
    } finally {
      setGeneratingEntryQr(false);
    }
  };

  const handleGenerateExitQr = async () => {
    setGeneratingExitQr(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiClient.post('/qr/daily/generate/', { qr_type: 'EXIT' });
      setExitQr(res.data);
      setSuccessMessage("New secure EXIT QR code generated successfully!");
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || "Failed to generate exit QR code.");
    } finally {
      setGeneratingExitQr(false);
    }
  };

  // Trigger records fetch on filter change
  useEffect(() => {
    fetchAttendanceRecords();
  }, [recordFilter]);

  // Handle student search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(searchQuery);
  };

  // Student Actions
  const handleResetStudent = async (studentId) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.post(`/students/reset/${studentId}/`);
      setSuccessMessage('Student access block and late entry logs have been reset successfully.');
      fetchStudents(searchQuery);
      fetchStats();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to reset student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student and their user login account? This action is permanent.')) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.delete(`/students/${studentId}/`);
      setSuccessMessage('Student successfully deleted from database.');
      fetchStudents(searchQuery);
      fetchStats();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to delete student.');
    } finally {
      setActionLoading(false);
    }
  };

  const onAddStudentSubmit = async (data) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Build correct schema matching accounts.views.UserRegisterView
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        roll_number: data.roll_number,
        department: data.department,
        session: data.session,
        phone_number: data.phone_number,
        role: 'STUDENT',
        otp: '111111' // bypass register OTP checks or mock since admin has access
      };
      await apiClient.post('/auth/register/', payload);
      setSuccessMessage('Student profile and user account registered successfully!');
      setShowAddStudentModal(false);
      resetStudentForm();
      fetchStudents(searchQuery);
      fetchStats();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.response?.data?.detail || 'Failed to register student. Verify details or unique username/roll number.');
    } finally {
      setActionLoading(false);
    }
  };

  // Timing Config Actions
  const onUpdateTimeSubmit = async (data) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiClient.put('/attendance/config/', {
        attendance_range_start: data.attendance_range_start,
        attendance_range_end: data.attendance_range_end
      });
      setAttendanceConfig(res.data);
      setSuccessMessage('Attendance time frame configuration updated.');
    } catch (err) {
      setErrorMessage('Failed to update attendance timings.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleGateStatus = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiClient.put('/attendance/config/', {
        is_gate_closed: !attendanceConfig.is_gate_closed
      });
      setAttendanceConfig(res.data);
      setSuccessMessage(`Gate entry access is now ${res.data.is_gate_closed ? 'CLOSED' : 'OPENED'}.`);
    } catch (err) {
      setErrorMessage('Failed to toggle gate entry access status.');
    } finally {
      setActionLoading(false);
    }
  };

  const onAddGateConfigSubmit = async (data) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = {
        config_type: data.config_type,
        entry_start_time: data.entry_start_time,
        entry_end_time: data.entry_end_time,
        exit_start_time: data.exit_start_time,
        exit_end_time: data.exit_end_time
      };

      if (data.config_type === 'DAY_OF_WEEK') {
        payload.day_of_week = parseInt(data.day_of_week);
      } else if (data.config_type === 'SPECIFIC_DATE') {
        payload.specific_date = data.specific_date;
      }

      await apiClient.post('/gate/config/', payload);
      setSuccessMessage('New gate scheduling slot configured successfully.');
      setShowAddGateConfigModal(false);
      resetConfigForm();
      fetchGateConfigs();
    } catch (err) {
      setErrorMessage(err.response?.data?.specific_date ? 'A configuration already exists for this date.' : 'Failed to configure gate timings.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGateConfig = async (configId) => {
    if (!window.confirm('Delete this gate timing scheduling rule?')) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/gate/config/${configId}/`);
      setSuccessMessage('Timing rule deleted.');
      fetchGateConfigs();
    } catch (err) {
      setErrorMessage('Failed to delete rule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Report Export logic using programmatic file downloading via Blobs
  const handleExport = async (type) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      if (recordFilter.date) params.date = recordFilter.date;
      if (recordFilter.roll_number) params.roll_number = recordFilter.roll_number;
      if (recordFilter.department) params.department = recordFilter.department;
      if (recordFilter.entry_status) params.status = recordFilter.entry_status;
      if (recordFilter.campus_status) params.campus_status = recordFilter.campus_status;

      const response = await apiClient.get(`/reports/export/${type}/`, {
        params,
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `attendance_history_report_${new Date().toISOString().split('T')[0]}.${type}`;
      link.click();
      setSuccessMessage(`Attendance reports downloaded successfully in ${type.toUpperCase()} format.`);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to compile and export reports file.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Admin header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600/20 text-purple-400 p-2 rounded-xl border border-purple-500/30">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Campus Vision AI <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-400 font-normal px-2.5 py-0.5 rounded-full">Admin System</span>
            </h1>
            <p className="text-xs text-slate-400">Total System Analytics, Access Rules, and Rosters</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl transition-all border border-slate-700 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Workspace wrapper */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar tabs */}
        <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-950 p-4 space-y-2 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Overview Analytics</span>
            </button>
            
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'students'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Student Roster</span>
            </button>

            <button
              onClick={() => setActiveTab('times')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'times'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Attendance Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('gate-configs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'gate-configs'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Gate Scheduling</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>Gate entry/exit logs</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-attendance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === 'qr-attendance'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <QrCode className="h-5 w-5" />
              <span>QR Attendance</span>
            </button>
          </nav>

          <div className="pt-8 border-t border-slate-800 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gate Safety Switch</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Closed State:</span>
                <span className={`text-xs font-bold ${attendanceConfig.is_gate_closed ? 'text-red-500' : 'text-emerald-500'}`}>
                  {attendanceConfig.is_gate_closed ? 'SHUTDOWN' : 'OPERATIONAL'}
                </span>
              </div>
              <button
                onClick={toggleGateStatus}
                disabled={actionLoading}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  attendanceConfig.is_gate_closed
                    ? 'bg-emerald-600 hover:bg-emerald-550 text-white'
                    : 'bg-red-655 hover:bg-red-700 text-white bg-red-600'
                }`}
              >
                {attendanceConfig.is_gate_closed ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Open Access Gates</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Access Gates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Dashboard main viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Notifications alerts banner */}
          {errorMessage && (
            <div className="bg-red-550/20 border border-red-500/50 text-red-300 rounded-xl p-4 flex items-start space-x-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/20 border border-emerald-555/50 text-emerald-300 rounded-xl p-4 flex items-start space-x-3 text-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Total Enrolled</span>
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats.total_students}</h3>
                    <p className="text-xs text-slate-500">Registered Student Profiles</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Active Students</span>
                    <UserCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats.total_active_students}</h3>
                    <p className="text-xs text-slate-500">Unblocked & verification ready</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Present (Today)</span>
                    <UserCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats.present_count}</h3>
                    <p className="text-xs text-slate-500">Logged physically in range</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Absent (Today)</span>
                    <UserX className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats.absent_count}</h3>
                    <p className="text-xs text-slate-500">Profiles marked absent</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Late (Today)</span>
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-tight">{stats.late_count}</h3>
                    <p className="text-xs text-slate-500">Alerted past boundaries</p>
                  </div>
                </div>
              </div>

              {/* Monthly Attendance Trends Chart */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Monthly Attendance Trends</h3>
                    <p className="text-xs text-slate-400">Daily verification status summary over past 30 days</p>
                  </div>
                  <button
                    onClick={fetchStats}
                    disabled={loadingStats}
                    className="p-2 border border-slate-800 bg-slate-900 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="h-80 w-full pt-4">
                  {stats.monthly_trends?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stats.monthly_trends}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                        <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late" />
                        <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                      No logs compiled for the last 30 days. Log check-ins to view graphs.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STUDENT MANAGEMENT */}
          {activeTab === 'students' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              {/* Header and Search */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Student Registry</h3>
                  <p className="text-xs text-slate-400">Add, monitor status, and manage security blocks</p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                  <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search name, roll, or dept..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-500" />
                  </form>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 transition-all shadow-md shadow-purple-500/10"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                      <th className="py-3 px-4">Student Profile</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Face Model</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Lates</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2 text-purple-500" />
                          Loading database records...
                        </td>
                      </tr>
                    ) : students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-900/40 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>
                              <span>{student.first_name || 'N/A'} {student.last_name || ''}</span>
                              <span className="block text-xs font-normal text-slate-400">@{student.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{student.roll_number}</td>
                          <td className="py-3.5 px-4 text-slate-300">{student.department}</td>
                          <td className="py-3.5 px-4 text-slate-400">{student.session}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              student.face_registered 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                              {student.face_registered ? 'Registered' : 'Missing'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              student.blocked 
                                ? 'bg-red-650/20 border border-red-500/30 text-red-400' 
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              {student.blocked ? 'BLOCKED' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-semibold ${
                              student.late_count >= 4 ? 'text-red-400 font-bold' : student.late_count >= 3 ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {student.late_count} / 5
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              {student.blocked && (
                                <button
                                  onClick={() => handleResetStudent(student.id)}
                                  disabled={actionLoading}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-2.5 rounded-lg transition-all"
                                  title="Unblock student and clear lates"
                                >
                                  Unblock Roster
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                disabled={actionLoading}
                                className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-800 rounded-lg transition-all"
                                title="Delete account permanent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">No students found matches query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE CONFIGURATION */}
          {activeTab === 'times' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Timing settings Form */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    <span>Attendance Timeframe Boundaries</span>
                  </h3>
                  <p className="text-xs text-slate-400">Define the valid range students can check in to be marked present</p>
                </div>

                <form onSubmit={handleSubmitTimes(onUpdateTimeSubmit)} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Class Range Start (Present)</label>
                      <input
                        type="time"
                        step="1"
                        defaultValue={attendanceConfig.attendance_range_start}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                        {...registerTimes('attendance_range_start', { required: true })}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Class Range End (Present Limit)</label>
                      <input
                        type="time"
                        step="1"
                        defaultValue={attendanceConfig.attendance_range_end}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                        {...registerTimes('attendance_range_end', { required: true })}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    * Check-ins logged after the end boundary time will automatically flag the student as <strong className="text-amber-400 font-semibold">LATE</strong>.
                  </p>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2.5 rounded-xl transition-all"
                  >
                    Save Range Configuration
                  </button>
                </form>
              </div>

              {/* Quick statistics */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    <span>Active Campus Limits Status</span>
                  </h3>
                  <p className="text-xs text-slate-400">Quick configuration check parameters</p>
                </div>
                
                <div className="space-y-3 py-4">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-sm">Present Check-In window:</span>
                    <span className="font-mono text-white font-bold">{attendanceConfig.attendance_range_start} to {attendanceConfig.attendance_range_end}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 text-sm">Gate Closure Mode:</span>
                    <span className={`font-bold ${attendanceConfig.is_gate_closed ? 'text-red-500' : 'text-emerald-500'}`}>
                      {attendanceConfig.is_gate_closed ? 'CLOSED' : 'OPEN'}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
                  <strong>Access Policy Notice:</strong> When gate closure mode is turned on, gate verification scanners block all students attempting to check in. To unlock access, click the 'Open Access Gates' safety switch.
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: GATE SCHEDULING (DAY/DATE TIMINGS) */}
          {activeTab === 'gate-configs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Gate Schedules Rules Configuration</h3>
                  <p className="text-xs text-slate-400">Set up customized entry and exit hour limits day-wise, date-wise or fallback default</p>
                </div>
                
                <button
                  onClick={() => setShowAddGateConfigModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-purple-500/10"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Configure Schedule Slot</span>
                </button>
              </div>

              {/* Timings configurations rules table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                      <th className="py-3 px-4">Timing Slot Priority</th>
                      <th className="py-3 px-4">Applied Day/Date</th>
                      <th className="py-3 px-4">Allowed Entry Range</th>
                      <th className="py-3 px-4">Allowed Exit Range</th>
                      <th className="py-3 px-4 text-center">Delete Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loadingGateConfigs ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">Loading configurations list...</td>
                      </tr>
                    ) : gateConfigs.length > 0 ? (
                      gateConfigs.map((cfg) => (
                        <tr key={cfg.id} className="hover:bg-slate-900/40 transition-all">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              cfg.config_type === 'SPECIFIC_DATE' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : cfg.config_type === 'DAY_OF_WEEK'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-slate-700/20 text-slate-350 border border-slate-650'
                            }`}>
                              {cfg.config_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {cfg.config_type === 'DEFAULT' 
                              ? 'Fallback General Default' 
                              : cfg.config_type === 'SPECIFIC_DATE'
                              ? cfg.specific_date
                              : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][cfg.day_of_week]
                            }
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-350">{cfg.entry_start_time} - {cfg.entry_end_time}</td>
                          <td className="py-3 px-4 font-mono text-slate-350">{cfg.exit_start_time} - {cfg.exit_end_time}</td>
                          <td className="py-3 px-4 text-center">
                            {cfg.config_type !== 'DEFAULT' ? (
                              <button
                                onClick={() => handleDeleteGateConfig(cfg.id)}
                                className="text-slate-400 hover:text-red-400 p-1 hover:bg-slate-850 rounded-md transition-all"
                                title="Delete Config Rule"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">N/A (System Required)</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500">No schedules configured. Defaults will apply.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GATE ENTRIES / EXIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              {/* Header and exports */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Gate Access and Attendance Logs</h3>
                  <p className="text-xs text-slate-400">Monitor live logs, search entries, or download reports</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={actionLoading}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-455 text-emerald-450" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={actionLoading}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
                  >
                    <FileText className="h-4 w-4 text-red-455 text-red-450" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Analytics Search Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Date</label>
                  <input
                    type="date"
                    value={recordFilter.date}
                    onChange={(e) => setRecordFilter(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Roll Number</label>
                  <input
                    type="text"
                    placeholder="Search roll..."
                    value={recordFilter.roll_number}
                    onChange={(e) => setRecordFilter(prev => ({ ...prev, roll_number: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <input
                    type="text"
                    placeholder="E.g. CSE"
                    value={recordFilter.department}
                    onChange={(e) => setRecordFilter(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Entry Status</label>
                  <select
                    value={recordFilter.entry_status}
                    onChange={(e) => setRecordFilter(prev => ({ ...prev, entry_status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Campus Status</label>
                  <select
                    value={recordFilter.campus_status}
                    onChange={(e) => setRecordFilter(prev => ({ ...prev, campus_status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All</option>
                    <option value="Inside Campus">Inside Campus</option>
                    <option value="Exited">Exited</option>
                    <option value="Not Entered">Not Entered</option>
                  </select>
                </div>
              </div>

              {/* Analytics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/50">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Entry Time</th>
                      <th className="py-3 px-4">Exit Time</th>
                      <th className="py-3 px-4">Total Time</th>
                      <th className="py-3 px-4">Entry Status</th>
                      <th className="py-3 px-4">Campus Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loadingRecords ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-slate-400">Loading attendance analytics...</td>
                      </tr>
                    ) : attendanceRecords.length > 0 ? (
                      attendanceRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-900/40 transition-all">
                          <td className="py-3 px-4 font-semibold text-white">
                            {rec.student?.user ? `${rec.student.user.first_name} ${rec.student.user.last_name}` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-350">
                            {rec.roll_number || rec.student?.roll_number}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {rec.date}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {rec.time ? rec.time.substring(0, 8) : '--:--'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {rec.checkout_time ? rec.checkout_time.substring(0, 8) : '--:--'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {rec.total_time}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              rec.status === 'LATE'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              rec.campus_status === 'Inside Campus'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : rec.campus_status === 'Exited'
                                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {rec.campus_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-slate-500">No records match the selected query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: QR ATTENDANCE MANAGEMENT */}
          {activeTab === 'qr-attendance' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">QR Attendance Management</h3>
                <p className="text-xs text-slate-400">
                  Generate a unique daily check-in QR code for student attendance. Generating a new QR invalidates all previous sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Entry QR */}
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900/50 rounded-2xl p-6 min-h-[300px] text-center">
                    {entryQr ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                          <img src={entryQr.qr_image} alt="Daily Entry QR" className="h-48 w-48 object-contain" />
                        </div>
                        <div className="space-y-1">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            ACTIVE ENTRY SESSION
                          </span>
                          <p className="text-xs text-slate-400 mt-2 font-mono">Session ID: {entryQr.session_id}</p>
                          <p className="text-xs text-slate-400 font-mono">Date: {entryQr.date}</p>
                          <p className="text-xs text-slate-400 font-mono">Generated: {new Date(entryQr.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 space-y-2">
                        <QrCode className="h-16 w-16 mx-auto stroke-1" />
                        <p className="text-sm">No active ENTRY QR code generated for today.</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateEntryQr}
                    disabled={generatingEntryQr}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center text-sm"
                  >
                    {generatingEntryQr ? (
                      <><RefreshCw className="animate-spin h-5 w-5 mr-2" /> Generating secure ENTRY QR...</>
                    ) : (
                      <><QrCode className="h-5 w-5 mr-2" /> Generate Today's Entry QR</>
                    )}
                  </button>
                </div>

                {/* Exit QR */}
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900/50 rounded-2xl p-6 min-h-[300px] text-center">
                    {exitQr ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                          <img src={exitQr.qr_image} alt="Daily Exit QR" className="h-48 w-48 object-contain" />
                        </div>
                        <div className="space-y-1">
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            ACTIVE EXIT SESSION
                          </span>
                          <p className="text-xs text-slate-400 mt-2 font-mono">Session ID: {exitQr.session_id}</p>
                          <p className="text-xs text-slate-400 font-mono">Date: {exitQr.date}</p>
                          <p className="text-xs text-slate-400 font-mono">Generated: {new Date(exitQr.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 space-y-2">
                        <QrCode className="h-16 w-16 mx-auto stroke-1" />
                        <p className="text-sm">No active EXIT QR code generated for today.</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateExitQr}
                    disabled={generatingExitQr}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center text-sm"
                  >
                    {generatingExitQr ? (
                      <><RefreshCw className="animate-spin h-5 w-5 mr-2" /> Generating secure EXIT QR...</>
                    ) : (
                      <><QrCode className="h-5 w-5 mr-2" /> Generate Today's Exit QR</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: REGISTER NEW STUDENT AS ADMIN */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Register Student Profile</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent(onAddStudentSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              
              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">First Name</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('first_name', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Last Name</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('last_name', { required: true })}
                  />
                </div>
              </div>

              {/* Login credentials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Username Login</label>
                  <input
                    type="text"
                    placeholder="johndoe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('username', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Password Login</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('password', { required: true, minLength: 8 })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <input
                  type="email"
                  placeholder="student@campus.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...registerStudent('email', { required: true })}
                />
              </div>

              {/* Roll Number & Academic Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Roll Number</label>
                  <input
                    type="text"
                    placeholder="CS-22"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm font-mono"
                    {...registerStudent('roll_number', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <input
                    type="text"
                    placeholder="CSE"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('department', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Session</label>
                  <input
                    type="text"
                    placeholder="2022-26"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerStudent('session', { required: true })}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...registerStudent('phone_number', { required: true })}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="w-1/2 border border-slate-800 hover:bg-slate-900 text-slate-400 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  {actionLoading ? 'Saving...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TIMING SCHEDULE RULE */}
      {showAddGateConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Configure Gate Schedule rule</h3>
              <button
                onClick={() => setShowAddGateConfigModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitConfig(onAddGateConfigSubmit)} className="space-y-4">
              
              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Configuration Rule Type</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...registerConfig('config_type', { required: true })}
                >
                  <option value="DAY_OF_WEEK">Day of Week Wise Rule</option>
                  <option value="SPECIFIC_DATE">Specific Date Rule (Priority)</option>
                </select>
              </div>

              {/* Conditional Inputs depend on type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Specific Date (If Date Wise)</label>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...registerConfig('specific_date')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Day of Week (If Day Wise)</label>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...registerConfig('day_of_week')}
                >
                  <option value="0">Monday</option>
                  <option value="1">Tuesday</option>
                  <option value="2">Wednesday</option>
                  <option value="3">Thursday</option>
                  <option value="4">Friday</option>
                  <option value="5">Saturday</option>
                  <option value="6">Sunday</option>
                </select>
              </div>

              {/* Entries Allowed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Entry Hours Start</label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerConfig('entry_start_time', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Entry Hours End</label>
                  <input
                    type="time"
                    defaultValue="18:00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerConfig('entry_end_time', { required: true })}
                  />
                </div>
              </div>

              {/* Exits Allowed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Exit Hours Start</label>
                  <input
                    type="time"
                    defaultValue="16:00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerConfig('exit_start_time', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Exit Hours End</label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...registerConfig('exit_end_time', { required: true })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddGateConfigModal(false)}
                  className="w-1/2 border border-slate-800 hover:bg-slate-900 text-slate-400 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  {actionLoading ? 'Saving...' : 'Add Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
