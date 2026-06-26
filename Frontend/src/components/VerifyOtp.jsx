import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const VerifyOtp = () => {
  const { verifyOtp, requestOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from router state if available
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get('email') || '';

  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: initialEmail,
      otp: '',
    }
  });

  const emailValue = watch('email');

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await verifyOtp(data.email, data.otp);
      setSuccessMessage('OTP code verified successfully!');
      
      // If navigating from reset password, redirect to confirm
      if (location.state?.fromReset) {
        setTimeout(() => {
          navigate('/reset-password', { state: { email: data.email, otp: data.otp } });
        }, 1500);
      }
    } catch (err) {
      setServerError(err.error || err.detail || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailValue) {
      setServerError('Please enter your email to resend OTP.');
      return;
    }
    setServerError('');
    setSuccessMessage('');
    setResending(true);
    try {
      await requestOtp(emailValue);
      setSuccessMessage('A new OTP code has been sent to your email.');
    } catch (err) {
      setServerError(err.error || err.detail || 'Failed to send OTP code. Please verify email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-slate-50/20">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center border border-blue-200">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verify OTP</h2>
          <p className="text-slate-500 text-sm">Enter the 6-digit code sent to your email address</p>
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

        {/* Verification Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                placeholder="you@campus.edu"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                {...register('email', { 
                  required: 'Email address is required.',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address.' }
                })}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* OTP Input */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">6-Digit Verification Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-center text-2xl font-bold tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                errors.otp ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              {...register('otp', { 
                required: 'OTP code is required.',
                minLength: { value: 6, message: 'OTP must be 6 digits.' },
                maxLength: { value: 6, message: 'OTP must be 6 digits.' }
              })}
            />
            {errors.otp && <p className="text-xs text-red-500 mt-1 text-center">{errors.otp.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" /> Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Didn't receive code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              type="button"
              className="font-semibold text-blue-600 hover:underline hover:text-blue-700 focus:outline-none disabled:text-blue-300"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </p>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            Cancel & Return to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtp;
