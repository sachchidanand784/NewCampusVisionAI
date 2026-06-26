import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, User as UserIcon, AlertCircle, Loader, School, Phone, Clipboard, ArrowRight } from 'lucide-react';

const StudentRegister = () => {
  const { register: registerUser, requestOtp } = useAuth();
  const navigate = useNavigate();
  
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm();

  const userEmail = watch('email');

  const handleSendOtp = async () => {
    setServerError('');
    setServerSuccess('');
    const email = getValues('email');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError('Please enter a valid email address first to receive the OTP.');
      return;
    }

    setSendingOtp(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      setServerSuccess('Verification code sent! Please check your email.');
    } catch (err) {
      setServerError(err.error || err.detail || 'Failed to send OTP. Please check backend config.');
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    setServerSuccess('');
    setLoading(true);

    const registrationData = {
      username: data.username,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      roll_number: data.roll_number,
      department: data.department,
      session: data.session,
      phone_number: data.phone_number,
      otp: data.otp,
      role: 'STUDENT'
    };

    try {
      await registerUser(registrationData);
      setServerSuccess('Registration successful! Redirecting to login portal...');
      setTimeout(() => {
        navigate('/student/login');
      }, 2500);
    } catch (err) {
      setServerError(err.error || err.detail || 'Registration failed. Check inputs or OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-12 bg-blue-50/20">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-blue-100 shadow-2xl rounded-2xl p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Create Student Account</h2>
          <p className="text-slate-500 text-sm">Register with your email OTP to set up your AI face profile</p>
        </div>

        {/* Alerts */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}
        {serverSuccess && (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{serverSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Email and OTP send block */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  placeholder="name@university.edu"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('email', { 
                    required: 'Email is required.',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address.' }
                  })}
                />
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-blue-50 disabled:text-blue-400 border border-blue-200 font-semibold py-3 rounded-xl transition-all flex justify-center items-center text-sm"
              >
                {sendingOtp ? <Loader className="animate-spin h-4 w-4" /> : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}

          {/* OTP Code */}
          {otpSent && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">OTP Code (6 digits)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  maxLength={6}
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.otp ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('otp', { 
                    required: 'Verification code is required.',
                    minLength: { value: 6, message: 'OTP must be 6 digits.' }
                  })}
                />
              </div>
              {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp.message}</p>}
            </div>
          )}

          {/* Basic User Data Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="johndoe"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.username ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('username', { required: 'Username is required.' })}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('password', { 
                    required: 'Password is required.',
                    minLength: { value: 8, message: 'Password must be at least 8 characters.' }
                  })}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">First Name</label>
              <input
                type="text"
                placeholder="John"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                {...register('first_name', { required: 'First name is required.' })}
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                {...register('last_name', { required: 'Last name is required.' })}
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Academic Info Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Roll Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Clipboard className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="CS-2022-04"
                  className={`w-full bg-white border rounded-xl pl-9 pr-2 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.roll_number ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('roll_number', { required: 'Required.' })}
                />
              </div>
              {errors.roll_number && <p className="text-xs text-red-500 mt-1">{errors.roll_number.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Department</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <School className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="CSE"
                  className={`w-full bg-white border rounded-xl pl-9 pr-2 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    errors.department ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  {...register('department', { required: 'Required.' })}
                />
              </div>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Session</label>
              <input
                type="text"
                placeholder="2022-2026"
                className={`w-full bg-white border rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
                  errors.session ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                {...register('session', { required: 'Required.' })}
              />
              {errors.session && <p className="text-xs text-red-500 mt-1">{errors.session.message}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                {...register('phone_number', { required: 'Phone number is required.' })}
              />
            </div>
            {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !otpSent}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" /> Registering student...
              </>
            ) : (
              <span className="flex items-center">
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        {/* Login redirect link */}
        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/student/login" className="font-semibold text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default StudentRegister;
