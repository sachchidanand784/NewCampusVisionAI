import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Camera, QrCode, Search, UserCheck, AlertCircle, CheckCircle2, ShieldAlert, ArrowLeftRight, RefreshCw, FileText, Check, X } from 'lucide-react';

const GatemanDashboard = () => {
  const [activeTab, setActiveTab] = useState('qr');
  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Verification states
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [direction, setDirection] = useState('ENTRY');



  // QR Verification States
  const [qrToken, setQrToken] = useState('');

  // Manual search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Active daily QR states
  const [entryQr, setEntryQr] = useState(null);
  const [exitQr, setExitQr] = useState(null);
  const [loadingActiveQr, setLoadingActiveQr] = useState(false);

  // Load recent gate records
  const fetchRecentLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await apiClient.get('/gate/records/');
      setRecentLogs(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load gate records:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
    fetchActiveQrs(true);

    // Poll for active daily QR codes every 10 seconds
    const interval = setInterval(() => {
      fetchActiveQrs(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveQrs = async (showLoading = false) => {
    if (showLoading) setLoadingActiveQr(true);
    try {
      const [resEntry, resExit] = await Promise.allSettled([
        apiClient.get('/qr/daily/active/?qr_type=ENTRY'),
        apiClient.get('/qr/daily/active/?qr_type=EXIT')
      ]);
      setEntryQr(resEntry.status === 'fulfilled' ? resEntry.value.data : null);
      setExitQr(resExit.status === 'fulfilled' ? resExit.value.data : null);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingActiveQr(false);
    }
  };

  const clearVerification = () => {
    setVerifiedStudent(null);
    setQrToken('');
    setStatusMessage({ type: '', text: '' });
  };



  // 2. QR Code Verification Submit
  const handleQrVerify = async (e) => {
    e.preventDefault();
    if (!qrToken.trim()) return;

    setVerifying(true);
    setStatusMessage({ type: '', text: '' });
    setVerifiedStudent(null);

    try {
      const response = await apiClient.post('/qr/verify/', { pass_code: qrToken });
      setVerifiedStudent(response.data.student);
      setStatusMessage({ type: 'success', text: 'Gate Pass Validated Successfully!' });
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Invalid or Expired QR Code pass.' 
      });
      if (err.response?.data?.student) {
        setVerifiedStudent(err.response.data.student);
      }
    } finally {
      setVerifying(false);
    }
  };

  // 3. Manual Search Submit
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const response = await apiClient.get(`/students/?search=${searchQuery}`);
      setSearchResults(response.data.results || response.data);
      if (response.data.length === 0) {
        setStatusMessage({ type: 'error', text: 'No student matches found.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Search query failed.' });
    } finally {
      setSearching(false);
    }
  };

  // Log Gate pass Action
  const handleConfirmGateLog = async (studentRoll, methodUsed) => {
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await apiClient.post('/gate/process/', {
        roll_number: studentRoll,
        direction: direction,
        method: methodUsed
      });
      
      const resData = response.data;
      let successMsg = `Gate ${direction} registered successfully for ${resData.student_name}.`;
      if (resData.is_late_entry) {
        successMsg += ` (LATE ENTRY logged. Current Late Count: ${resData.late_count})`;
      }
      
      setStatusMessage({ type: 'success', text: successMsg });
      setVerifiedStudent(null);
      clearVerification();
      fetchRecentLogs();
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to log gate movement.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Dashboard Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200/80 shadow-md p-6 rounded-2xl gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gate Security Console</h2>
            <p className="text-sm text-slate-500">Monitor entries, scan smart codes, and verify student credentials</p>
          </div>
          
          {/* Direction toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setDirection('ENTRY')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                direction === 'ENTRY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Checking ENTRY
            </button>
            <button
              onClick={() => setDirection('EXIT')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                direction === 'EXIT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Checking EXIT
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Verification Flow & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Scan & Search Methods Panel */}
          <div className="lg:col-span-2 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-6">
            
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-200">

              <button
                onClick={() => { setActiveTab('qr'); clearVerification(); }}
                className={`pb-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
                  activeTab === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>6-Digit Pass Code</span>
              </button>
              <button
                onClick={() => { setActiveTab('manual'); clearVerification(); }}
                className={`pb-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
                  activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Manual Lookup</span>
              </button>
              <button
                onClick={() => { setActiveTab('attendance-qr'); clearVerification(); }}
                className={`pb-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
                  activeTab === 'attendance-qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>Attendance QR</span>
              </button>
            </div>

            {/* QR Scanner Module */}
            {activeTab === 'qr' && (
              <form onSubmit={handleQrVerify} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Enter 6-Digit Gate Pass Code</label>
                  <input
                    type="text"
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    placeholder="Enter student 6-digit code..."
                    maxLength={6}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono text-xl tracking-widest text-center"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || !qrToken.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center"
                >
                  {verifying ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <UserCheck className="h-5 w-5 mr-2" />}
                  {verifying ? 'Verifying Pass...' : 'Verify Pass'}
                </button>
              </form>
            )}

            {/* Manual Lookup Module */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Roll number, Department, or Username..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 rounded-xl transition-all flex items-center justify-center"
                  >
                    {searching ? <RefreshCw className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                  </button>
                </form>

                {/* Search Results list */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {searchResults.map((student) => (
                      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-55/20 transition-all">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {student.first_name ? `${student.first_name} ${student.last_name}` : student.username}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Roll: <span className="font-semibold">{student.roll_number}</span> | Dept: {student.department}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setVerifiedStudent(student);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-4 py-2 rounded-lg text-xs transition-all"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attendance QR Code display Tab */}
            {activeTab === 'attendance-qr' && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Today's Attendance QRs</h3>
                <p className="text-xs text-slate-550 max-w-md leading-relaxed">
                  Display these QR codes for students to scan and mark their entry/exit.
                </p>
                
                {loadingActiveQr ? (
                  <div className="py-12">
                    <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Fetching active QR sessions...</p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6 justify-center w-full">
                    {/* Entry QR */}
                    <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                      <h4 className="font-bold text-blue-900 mb-2">ENTRY QR</h4>
                      {entryQr ? (
                        <div className="space-y-4">
                          <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-inner inline-block">
                            <img src={entryQr.qr_image} alt="Entry QR" className="h-40 w-40 object-contain mx-auto" />
                          </div>
                          <div className="space-y-1">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono break-all">ID: {entryQr.session_id}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 py-6 space-y-2">
                          <QrCode className="h-10 w-10 stroke-1 mx-auto" />
                          <p className="text-[10px]">No active ENTRY QR.</p>
                        </div>
                      )}
                    </div>

                    {/* Exit QR */}
                    <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                      <h4 className="font-bold text-amber-600 mb-2">EXIT QR</h4>
                      {exitQr ? (
                        <div className="space-y-4">
                          <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-inner inline-block">
                            <img src={exitQr.qr_image} alt="Exit QR" className="h-40 w-40 object-contain mx-auto" />
                          </div>
                          <div className="space-y-1">
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono break-all">ID: {exitQr.session_id}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 py-6 space-y-2">
                          <QrCode className="h-10 w-10 stroke-1 mx-auto" />
                          <p className="text-[10px]">No active EXIT QR.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right: Results / Action Panel */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
            {verifiedStudent ? (
              <div className="space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">VERIFICATION PROFILE</span>
                    {verifiedStudent.face_image_url ? (
                      <img src={verifiedStudent.face_image_url} alt="Profile Photo" className="h-28 w-28 rounded-full object-cover border-4 border-blue-500 mx-auto mt-3" />
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200 mx-auto mt-3 text-slate-400">
                        No Face Photo
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 text-sm">
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400">Student Name:</span>
                      <span className="font-bold text-slate-800">
                        {verifiedStudent.first_name ? `${verifiedStudent.first_name} ${verifiedStudent.last_name}` : verifiedStudent.username}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400">Roll Number:</span>
                      <span className="font-semibold text-slate-800">{verifiedStudent.roll_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800">{verifiedStudent.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                      <span className="text-slate-400">Late Count:</span>
                      <span className={`font-bold ${verifiedStudent.late_count >= 3 ? 'text-red-500' : 'text-slate-700'}`}>
                        {verifiedStudent.late_count} / 5
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                      <span className="text-slate-400">Access Status:</span>
                      <span className={`font-extrabold ${verifiedStudent.blocked ? 'text-red-600' : 'text-emerald-600'}`}>
                        {verifiedStudent.blocked ? 'BLOCKED' : 'ALLOWED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleConfirmGateLog(
                      verifiedStudent.roll_number,
                      activeTab === 'camera' ? 'FACE' : activeTab === 'qr' ? 'QR' : 'MANUAL'
                    )}
                    disabled={verifiedStudent.blocked}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center ${
                      verifiedStudent.blocked 
                        ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                    }`}
                  >
                    <Check className="h-5 w-5 mr-1" /> Approve {direction}
                  </button>
                  <button
                    onClick={clearVerification}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center"
                  >
                    <X className="h-4 w-4 mr-1" /> Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 text-center space-y-3 py-12">
                <ArrowLeftRight className="h-16 w-16 stroke-1 text-slate-300" />
                <h4 className="font-semibold text-slate-500">Awaiting Scanner Input</h4>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Enter 6-digit gate pass codes, or search credentials to take action.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Section: Recent Gate Logs list */}
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Live Gate Monitoring</h3>
              <p className="text-xs text-slate-400">Real-time log of campus entries and exits</p>
            </div>
            <button 
              onClick={fetchRecentLogs} 
              disabled={loadingLogs}
              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-5 w-5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingLogs ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="mt-1">Updating logs...</p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No gate movements logged today.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-150">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-55/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                        {log.student?.first_name ? `${log.student.first_name} ${log.student.last_name}` : log.student?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{log.student?.roll_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          log.direction === 'ENTRY' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {log.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {log.verified_by === 'FACE' ? 'Face Scan' : log.verified_by === 'QR' ? 'QR Pass' : 'Manual ID'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.is_late ? (
                          <span className="inline-flex px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-bold">LATE</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">ON TIME</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GatemanDashboard;
