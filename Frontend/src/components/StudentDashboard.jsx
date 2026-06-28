import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Html5Qrcode } from 'html5-qrcode';
import { User, QrCode, FileText, Camera, UploadCloud, CheckCircle, AlertTriangle, RefreshCw, Clipboard, Video, CheckCircle2, XCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Daily QR Check-in states
  const [attendanceStep, setAttendanceStep] = useState(1); // 1: QR Scan, 2: Roll Number, 3: Face Capture, 4: Result
  const [scannedToken, setScannedToken] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [capturedFaceFile, setCapturedFaceFile] = useState(null);
  const [capturedFacePreview, setCapturedFacePreview] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [attendanceError, setAttendanceError] = useState('');
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendanceAttemptsLeft, setAttendanceAttemptsLeft] = useState(3);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isQrValidating, setIsQrValidating] = useState(false);
  const [gateDetails, setGateDetails] = useState(null);
  const [isVerifyingRoll, setIsVerifyingRoll] = useState(false);
  const [verifiedStudentProfile, setVerifiedStudentProfile] = useState(null);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);

  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamStream, setWebcamStream] = useState(null);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const profileRes = await apiClient.get('/students/me/');
      setProfile(profileRes.data);
      
      const qrRes = await apiClient.get('/qr/generate/');
      setQrCode(qrRes.data);

      const attendanceRes = await apiClient.get('/attendance/records/');
      setAttendance(attendanceRes.data.results || attendanceRes.data);
    } catch (err) {
      console.error("Failed to load student data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Clear scanner and camera on tab switch
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
      }).catch(err => console.error(err));
      scannerRef.current = null;
    }
    stopWebcam();
    setAttendanceError('');
  }, [activeTab]);

  const startQrScanner = async () => {
    setAttendanceError('');
    setIsCameraStarting(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-student");
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        (errorMessage) => {
          // silent parsing errors
        }
      );
      scannerRef.current = html5QrCode;
    } catch (err) {
      console.error("Scanner init error:", err);
      setAttendanceError("Failed to access camera. Please check browser permissions.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const handleQrCodeScanned = async (tokenText) => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
      }).catch(err => console.error(err));
      scannerRef.current = null;
    }
    setScannedToken(tokenText);
    await validateGateQr(tokenText);
  };

  const handleTokenInputSubmit = async (e) => {
    e.preventDefault();
    if (!scannedToken.trim()) {
      setAttendanceError("Please enter a valid token.");
      return;
    }
    await validateGateQr(scannedToken);
  };

  const validateGateQr = async (token) => {
    setIsQrValidating(true);
    setAttendanceError('');
    try {
      const response = await apiClient.post('/qr/daily/validate/', { token });
      setGateDetails(response.data);
      setAttendanceStep(2);
    } catch (err) {
      setAttendanceError(err.response?.data?.error || "Invalid QR Code. Validation failed.");
    } finally {
      setIsQrValidating(false);
    }
  };

  const handleVerifyRoll = async () => {
    if (!studentRoll.trim()) {
      setAttendanceError("Please enter your roll number.");
      return;
    }
    setIsVerifyingRoll(true);
    setAttendanceError('');
    try {
      const response = await apiClient.post('/students/verify-roll/', { roll_number: studentRoll });
      
      if (response.data.blocked) {
        setAttendanceError("Student access is blocked.");
        return;
      }

      if (!response.data.face_registered) {
        alert("Biometric registration required. Redirecting to Face Registration...");
        setActiveTab('face');
        resetAttendanceFlow();
        return;
      }

      setVerifiedStudentProfile(response.data);
      setAttendanceStep(3);
    } catch (err) {
      setAttendanceError(err.response?.data?.error || "Student record not found.");
    } finally {
      setIsVerifyingRoll(false);
    }
  };

  const startWebcam = async () => {
    setAttendanceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      setAttendanceError("Failed to open camera. Please check camera permissions or upload a snapshot file instead.");
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });
        setCapturedFaceFile(file);
        setCapturedFacePreview(URL.createObjectURL(file));
        stopWebcam();
      }, 'image/jpeg');
    }
  };

  const handleFaceUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturedFaceFile(file);
      setCapturedFacePreview(URL.createObjectURL(file));
      setAttendanceError('');
      setIsFaceVerified(false);
    }
  };

  const handleFaceVerification = async () => {
    if (!capturedFaceFile) {
      setAttendanceError("Please capture your face or select an image file first.");
      return;
    }

    setIsVerifyingFace(true);
    setAttendanceError('');

    const formData = new FormData();
    formData.append('roll_number', studentRoll);
    formData.append('image', capturedFaceFile);

    try {
      const response = await apiClient.post('/students/verify-face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsFaceVerified(true);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.attempts_left !== undefined) {
        setAttendanceAttemptsLeft(errData.attempts_left);
      }
      setAttendanceError(errData?.error || 'Face verification failed.');
      setIsFaceVerified(false);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  const handleAttendanceSubmit = async () => {
    if (!capturedFaceFile) {
      setAttendanceError("Please capture your face or select an image file first.");
      return;
    }

    setSubmittingAttendance(true);
    setAttendanceError('');

    const formData = new FormData();
    formData.append('token', scannedToken);
    formData.append('roll_number', studentRoll);
    formData.append('image', capturedFaceFile);

    try {
      const response = await apiClient.post('/attendance/qr-mark/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttendanceResult({ success: true, data: response.data });
      setAttendanceStep(4);
      fetchStudentData(); // Refresh history
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.attempts_left !== undefined) {
        setAttendanceAttemptsLeft(errData.attempts_left);
      }
      setAttendanceError(errData?.error || 'Failed to register attendance. Verify details.');
      if (errData?.error && errData.error.includes("blocked")) {
        setAttendanceResult({ success: false, isBlocked: true });
        setAttendanceStep(4);
      }
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const resetAttendanceFlow = () => {
    setAttendanceStep(1);
    setScannedToken('');
    setStudentRoll('');
    setCapturedFaceFile(null);
    setCapturedFacePreview(null);
    setAttendanceResult(null);
    setAttendanceError('');
    setGateDetails(null);
    setVerifiedStudentProfile(null);
    setIsFaceVerified(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError('');
      setUploadSuccess('');
    }
  };

  const handleFaceUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await apiClient.post('/students/register-face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(response.data.message);
      
      if (profile) {
        const updatedProfile = { 
          ...profile, 
          face_registered: true, 
          face_image_url: response.data.face_image_url 
        };
        setProfile(updatedProfile);
        
        setUser({
          ...user,
          student_profile: {
            ...user.student_profile,
            face_registered: true
          }
        });
      }
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setUploadError(err.response?.data?.image || err.response?.data?.error || 'Failed to register face. Ensure your face is clearly visible.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-semibold">Loading student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/10 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="bg-white border border-blue-50 shadow-xl rounded-2xl p-6 h-fit space-y-6">
          <div className="text-center md:text-left">
            <h2 className="font-bold text-xl text-blue-900">Student Portal</h2>
            <p className="text-xs text-slate-400">Manage your profile & passes</p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profile Info</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'qr'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <QrCode className="h-5 w-5" />
              <span>Gate pass QR</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Attendance History</span>
            </button>
            <button
              onClick={() => { setActiveTab('qr-attendance'); resetAttendanceFlow(); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'qr-attendance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <QrCode className="h-5 w-5" />
              <span>Mark Entry</span>
            </button>
            <button
              onClick={() => { setActiveTab('mark-exit'); resetAttendanceFlow(); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'mark-exit'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <QrCode className="h-5 w-5" />
              <span>Mark Exit</span>
            </button>
          </div>
          
          {profile?.blocked && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500 animate-bounce" />
              <h4 className="font-bold text-red-900 text-sm">ACCESS BLOCKED</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                You have reached 5 late entries. Your QR pass is disabled. Please contact the administrator.
              </p>
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="md:col-span-3 bg-white border border-blue-50 shadow-xl rounded-2xl p-8 min-h-[500px]">
          
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">Academic Profile</h3>
                <p className="text-sm text-slate-500">Your registered university record information</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Full Name</span>
                  <p className="font-semibold text-slate-800 text-base">
                    {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Roll Number</span>
                  <p className="font-semibold text-slate-800 text-base">{profile.roll_number}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Department</span>
                  <p className="font-semibold text-slate-800 text-base">{profile.department}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Session / Year</span>
                  <p className="font-semibold text-slate-800 text-base">{profile.session}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Email Address</span>
                  <p className="font-semibold text-slate-800 text-base">{profile.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Phone Number</span>
                  <p className="font-semibold text-slate-800 text-base">{profile.phone_number || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Late Count</span>
                  <p className={`font-bold text-base ${profile.late_count >= 3 ? 'text-red-500' : 'text-slate-800'}`}>
                    {profile.late_count} / 5
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Face Enrolled Status</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {profile.face_registered ? (
                      <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active Encoding
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Unregistered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'face' && profile && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">AI Face Registration</h3>
                <p className="text-sm text-slate-500">Provide a clear selfie or passport photo to enable automated gate access</p>
              </div>

              {profile.face_registered ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Face registration verified</h5>
                    <p className="text-xs mt-1">
                      Your biometric encoding is safely uploaded to our PostgreSQL cloud catalog. You can scan at any automated gate. Uploading a new photo will replace your existing biometric key.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Biometric registration required</h5>
                    <p className="text-xs mt-1">
                      You must upload a clear front-facing image of your face to enable access tracking and automated attendance.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="flex flex-col items-center justify-center border border-slate-100 bg-slate-50/50 rounded-2xl p-6 min-h-[260px]">
                  {previewUrl ? (
                    <div className="text-center space-y-3">
                      <img src={previewUrl} alt="Face Preview" className="h-44 w-44 rounded-full object-cover border-4 border-blue-500" />
                      <span className="text-xs font-semibold text-slate-400">Selected Photo Preview</span>
                    </div>
                  ) : profile.face_image_url ? (
                    <div className="text-center space-y-3">
                      <img src={profile.face_image_url} alt="Registered Face" className="h-44 w-44 rounded-full object-cover border-4 border-emerald-500" />
                      <span className="text-xs font-semibold text-slate-400">Currently Enrolled Image</span>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 space-y-2">
                      <Camera className="h-16 w-16 mx-auto stroke-1" />
                      <p className="text-sm">No face image registered yet</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleFaceUpload} className="flex flex-col justify-center space-y-4">
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-slate-600">Select Face Snapshot</span>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 cursor-pointer hover:bg-blue-50/20 transition-all">
                      <UploadCloud className="h-10 w-10 text-slate-400" />
                      <span className="mt-2 text-sm font-medium text-slate-600">Click to choose image</span>
                      <span className="text-xs text-slate-400 mt-1">JPEG or PNG, max 5MB</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mr-2" /> Uploading & Extracting...
                      </>
                    ) : (
                      'Save Biometric Image'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-full text-center md:text-left">
                <h3 className="text-2xl font-bold text-blue-900">Digital Student Card</h3>
                <p className="text-sm text-slate-500">Scan this cryptographically signed QR pass at gate monitoring kiosks</p>
              </div>

              {profile?.blocked ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center max-w-md mt-6 space-y-3">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto animate-pulse" />
                  <h5 className="font-bold text-base">QR Access Code Disabled</h5>
                  <p className="text-xs leading-relaxed">
                    Your account access is currently blocked due to accumulating 5 late gate entries. Your digital card is disabled. Contact admin immediately.
                  </p>
                </div>
              ) : qrCode ? (
                <div className="relative bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-8 max-w-sm w-full shadow-2xl mt-6 flex flex-col items-center space-y-6">
                  <div className="w-full flex justify-between items-center">
                    <span className="font-bold text-sm tracking-wider opacity-85">CAMPUS SMART PASS</span>
                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full">ACTIVE</span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center">
                    <img src={qrCode.qr_image} alt="Student QR Pass" className="h-44 w-44 object-contain" />
                    {qrCode.pass_code && (
                      <div className="mt-4 text-center border-t border-slate-100 w-full pt-3">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">One-Time Pass Code:</p>
                        <p className="text-3xl font-mono font-bold tracking-widest text-slate-800">{qrCode.pass_code}</p>
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center space-y-1">
                    <h4 className="font-bold text-lg">{user?.first_name ? `${user.first_name} ${user.last_name}` : user.username}</h4>
                    <p className="text-xs opacity-75 font-mono">Roll: {profile?.roll_number}</p>
                    <p className="text-xs opacity-60">{profile?.department} | {profile?.session}</p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-12">
                  <RefreshCw className="h-10 w-10 mx-auto animate-spin" />
                  <p className="mt-2 text-sm">Generating secure token...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">Attendance History</h3>
                <p className="text-sm text-slate-500">View your daily records verified by face scans or manually</p>
              </div>

              {attendance.length === 0 ? (
                <div className="border border-slate-100 rounded-xl p-8 text-center text-slate-400">
                  <FileText className="h-12 w-12 mx-auto stroke-1" />
                  <p className="mt-2 text-sm font-semibold">No attendance records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Marked By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{record.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              record.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : record.status === 'LATE'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                            {record.marked_by === 'AUTO' ? 'Face Recognition' : 'Gateman manual'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {record.time ? record.time : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {record.checkout_time ? record.checkout_time : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'qr-attendance' || activeTab === 'mark-exit') && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">{activeTab === 'qr-attendance' ? 'Mark Entry' : 'Mark Exit'}</h3>
                <p className="text-sm text-slate-500">Scan the {activeTab === 'qr-attendance' ? 'Entry' : 'Exit'} QR code and verify your face</p>
              </div>

              {attendanceError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start space-x-2 text-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                  <span className="font-semibold">{attendanceError}</span>
                </div>
              )}

              {/* STEP 1: SCAN QR CODE */}
              {attendanceStep === 1 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-700 text-base">Step 1: Scan Attendance QR</h4>
                    <p className="text-xs text-slate-400">Position the daily active QR code in front of your camera or enter details below.</p>
                  </div>

                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-6 min-h-[250px]">
                    <div id="qr-reader-student" className="w-full max-w-sm overflow-hidden rounded-xl"></div>
                    
                    {!scannerRef.current && (
                      <button
                        onClick={startQrScanner}
                        disabled={isCameraStarting}
                        className="mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 border border-blue-200 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mx-auto"
                      >
                        {isCameraStarting ? <RefreshCw className="animate-spin h-4 w-4" /> : <Camera className="h-4 w-4" />}
                        {isCameraStarting ? 'Accessing Camera...' : 'Launch Camera Scanner'}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleTokenInputSubmit} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 block">Or Paste QR Code Token Directly:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scannedToken}
                        onChange={(e) => setScannedToken(e.target.value)}
                        placeholder="Enter daily QR token code..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <button
                        type="submit"
                        disabled={!scannedToken || isQrValidating}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 rounded-xl text-xs transition-all flex items-center gap-1"
                      >
                        {isQrValidating ? <RefreshCw className="animate-spin h-4 w-4" /> : null}
                        Submit Token
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 2: ENTER ROLL NUMBER */}
              {attendanceStep === 2 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-700 text-base">Step 2: Enter Student Roll Number</h4>
                    <p className="text-xs text-slate-400">Please provide your official university roll number to retrieve your face template.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Roll Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <Clipboard className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={studentRoll}
                          onChange={(e) => setStudentRoll(e.target.value)}
                          placeholder="e.g. CS-2022-04"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setAttendanceStep(1)}
                        className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-xs transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifyRoll}
                        disabled={isVerifyingRoll}
                        className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex justify-center items-center gap-2"
                      >
                        {isVerifyingRoll ? <RefreshCw className="animate-spin h-4 w-4" /> : null}
                        Verify Roll Number
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LIVE FACE CAPTURE */}
              {attendanceStep === 3 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-700 text-base">Step 3: Face Verification</h4>
                    <p className="text-xs text-slate-400">Review your details and capture a live snapshot to confirm your identity.</p>
                  </div>

                  {verifiedStudentProfile && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center space-x-4">
                      {verifiedStudentProfile.face_image_url ? (
                        <img src={verifiedStudentProfile.face_image_url} alt="Registered Face" className="h-16 w-16 rounded-full object-cover border-2 border-blue-500 shadow-sm" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">
                          {verifiedStudentProfile.first_name ? `${verifiedStudentProfile.first_name} ${verifiedStudentProfile.last_name}` : verifiedStudentProfile.roll_number}
                        </h5>
                        <p className="text-xs font-mono text-slate-500 font-semibold">{verifiedStudentProfile.roll_number}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {verifiedStudentProfile.department || 'No Dept'} | {verifiedStudentProfile.session || 'No Session'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="relative border border-slate-200 bg-slate-900 rounded-2xl overflow-hidden min-h-[260px] flex items-center justify-center">
                    {capturedFacePreview ? (
                      <img src={capturedFacePreview} alt="Captured Face" className="h-64 w-full object-cover" />
                    ) : cameraActive ? (
                      <video ref={videoRef} autoPlay className="h-64 w-full object-cover transform -scale-x-100" />
                    ) : (
                      <div className="text-slate-400 text-center space-y-2">
                        <Video className="h-16 w-16 mx-auto stroke-1" />
                        <p className="text-xs">Camera is offline</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-center gap-3">
                      {!cameraActive && !capturedFacePreview && (
                        <button
                          onClick={startWebcam}
                          className="bg-slate-800 text-slate-200 hover:bg-slate-750 font-semibold px-6 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
                        >
                          <Video className="h-4 w-4" /> Start Camera
                        </button>
                      )}
                      {cameraActive && (
                        <button
                          onClick={captureFrame}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
                        >
                          <Camera className="h-4 w-4" /> Capture Photo
                        </button>
                      )}
                      {capturedFacePreview && (
                        <button
                          onClick={() => { setCapturedFacePreview(null); setCapturedFaceFile(null); startWebcam(); }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-6 py-2 rounded-xl text-xs transition-all"
                        >
                          Retake Photo
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <label className="text-xs font-semibold text-slate-500 block">Or upload snapshot file instead:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFaceUploadChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => { stopWebcam(); setAttendanceStep(2); setIsFaceVerified(false); }}
                        className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-xl text-xs transition-all"
                      >
                        Back
                      </button>
                      
                      {!isFaceVerified ? (
                        <button
                          onClick={handleFaceVerification}
                          disabled={isVerifyingFace || !capturedFaceFile}
                          className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                        >
                          {isVerifyingFace ? <RefreshCw className="animate-spin h-4 w-4" /> : null}
                          Verify Identity
                        </button>
                      ) : (
                        <button
                          onClick={handleAttendanceSubmit}
                          disabled={submittingAttendance}
                          className="w-2/3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                        >
                          {submittingAttendance ? <RefreshCw className="animate-spin h-4 w-4" /> : null}
                          Mark Present
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}


              {/* STEP 4: VERIFICATION RESULT */}
              {attendanceStep === 4 && attendanceResult && (
                <div className="space-y-6 max-w-md mx-auto text-center py-6">
                  {attendanceResult.success ? (
                    <div className="space-y-4">
                      <div className="mx-auto bg-emerald-50 border border-emerald-100 w-16 h-16 rounded-full flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-slate-800 text-lg text-emerald-600">
                          ✅ {attendanceResult.data.message || 'Attendance Marked Successfully'}
                        </h4>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 space-y-2 font-medium max-w-sm mx-auto text-left">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Date:</span>
                            <span className="text-slate-800 font-bold">{attendanceResult.data.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Time:</span>
                            <span className="text-slate-800 font-bold">
                              {attendanceResult.data.checkout_time ? `Out at ${attendanceResult.data.checkout_time}` : `In at ${attendanceResult.data.time}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status:</span>
                            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold uppercase">
                              {attendanceResult.data.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Match Accuracy:</span>
                            <span className="font-mono text-slate-800 font-bold">
                              {Math.round(attendanceResult.data.face_match_score * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto bg-red-50 border border-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
                        <XCircle className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-red-650 text-lg text-red-600">
                          ❌ Face Verification Failed
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                          The live face match score did not meet the required 85% similarity threshold. 
                        </p>
                        {attendanceResult.isBlocked && (
                          <div className="bg-red-50 text-red-750 p-3 rounded-xl text-xs font-semibold max-w-sm mx-auto mt-2">
                            This student portal has been temporarily locked from marking attendance for the next 15 minutes due to 3 failed attempts.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={resetAttendanceFlow}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10"
                    >
                      {attendanceResult.success ? 'Finish Session' : 'Try Again'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
