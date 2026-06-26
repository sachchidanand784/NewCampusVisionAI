import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';

const ResetPassword = () => {
  const { resetPasswordRequest, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle case where we come from VerifyOtp redirects
  const stateEmail = location.state?.email || '';
  const stateOtp = location.state?.otp || '';

  const [step, setStep] = useState(stateOtp ? 2 : 1);
  const [email, setEmail] = useState(stateEmail);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form for Step 1 (Request Code)
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm({
    defaultValues: { email: stateEmail }
  });

  // Form for Step 2 (Reset Password)
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    watch,
    formState: { errors: errorsReset },
  } = useForm({
    defaultValues: {
      otp: stateOtp,
      new_password: '',
      confirm_password: '',
    }
  });

  const newPasswordValue = watch('new_password');

  // Request Code Submission
  const onRequestSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await resetPasswordRequest(data.email);
      setEmail(data.email);
      setSuccessMessage('Password reset verification code sent to your email.');
      setTimeout(() => {
        setStep(2);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      setServerError(err.error || err.detail || 'Email address not found.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Reset Submission
  const onResetSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await resetPassword(email, data.otp, data.new_password);
      setSuccessMessage('Password reset successfully! Redirecting to login portal...');
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err) {
      setServerError(err.error || err.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-slate-50/20">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 space-y-6">
        
        {/* Title / Headers */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center border border-blue-200">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 ? 'Reset Password' : 'Choose New Password'}
          </h2>
          <p className="text-slate-500 text-sm">
            {step === 1 
              ? 'Enter email address to receive password reset OTP'
              : `Create a strong password for ${email}`
            }
          </p>
        </div>

        {/* Server Error Alerts */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Success Alerts */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 flex items-start space-x-2 text-sm">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Request Code Form */}
        {step === 1 && (
          <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  placeholder="name@campus.edu"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errorsRequest.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...registerRequest('email', { 
                    required: 'Email address is required.',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address.' }
                  })}
                />
              </div>
              {errorsRequest.email && <p className="text-xs text-red-500 mt-1">{errorsRequest.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" /> Requesting...
                </>
              ) : (
                'Request Reset Code'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Update Password Form */}
        {step === 2 && (
          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
            
            {/* OTP Input */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">6-Digit Verification Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errorsReset.otp ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...registerReset('otp', { 
                    required: 'OTP code is required.',
                    minLength: { value: 6, message: 'OTP must be 6 digits.' }
                  })}
                />
              </div>
              {errorsReset.otp && <p className="text-xs text-red-500 mt-1">{errorsReset.otp.message}</p>}
            </div>

            {/* New Password Input */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errorsReset.new_password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...registerReset('new_password', { 
                    required: 'New password is required.',
                    minLength: { value: 8, message: 'Password must be at least 8 characters.' }
                  })}
                />
              </div>
              {errorsReset.new_password && <p className="text-xs text-red-500 mt-1">{errorsReset.new_password.message}</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errorsReset.confirm_password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...registerReset('confirm_password', { 
                    required: 'Please confirm password.',
                    validate: value => value === newPasswordValue || 'Passwords do not match.'
                  })}
                />
              </div>
              {errorsReset.confirm_password && <p className="text-xs text-red-500 mt-1">{errorsReset.confirm_password.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" /> Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:underline">
            Back to Portal Options
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
