import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, User as UserIcon, AlertCircle, Loader, ArrowRight } from 'lucide-react';

const GatemanRegister = () => {
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
    getValues,
    formState: { errors },
  } = useForm();

  const handleSendOtp = async () => {
    setServerError('');
    setServerSuccess('');
    const email = getValues('email');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError('Please enter a valid email address first.');
      return;
    }

    setSendingOtp(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
      setServerSuccess('Verification code sent to your email!');
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
      otp: data.otp,
      role: 'GATE_MAN'
    };

    try {
      await registerUser(registrationData);
      setServerSuccess('Registration successful! Redirecting to login portal...');
      setTimeout(() => {
        navigate('/gateman/login');
      }, 2000);
    } catch (err) {
      setServerError(err.error || err.detail || 'Registration failed. Check inputs or OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-emerald-50/5">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xl rounded-2xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Gateman Account</h2>
          <p className="text-slate-500 text-sm">Register as gate security staff with your email OTP</p>
        </div>

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
          
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  placeholder="security@university.edu"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                    errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'
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
                className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:bg-emerald-50 border border-emerald-200 font-semibold py-3 rounded-xl transition-all flex justify-center items-center text-sm"
              >
                {sendingOtp ? <Loader className="animate-spin h-4 w-4" /> : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}

          {otpSent && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">OTP Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  maxLength={6}
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                    errors.otp ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                  {...register('otp', { required: 'Verification code is required.' })}
                />
              </div>
              {errors.otp && <p className="text-xs text-red-500 mt-1">{errors.otp.message}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <UserIcon className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="security_officer_01"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                  errors.username ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
                {...register('username', { required: 'Username is required.' })}
              />
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">First Name</label>
              <input
                type="text"
                placeholder="First name"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                {...register('first_name', { required: 'Required.' })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Last Name</label>
              <input
                type="text"
                placeholder="Last name"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                {...register('last_name', { required: 'Required.' })}
              />
            </div>
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
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                  errors.password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
                {...register('password', { required: 'Password is required.', minLength: { value: 8, message: 'Min 8 chars.' } })}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !otpSent}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" /> Registering staff...
              </>
            ) : (
              <span className="flex items-center">
                Register Security Staff <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/gateman/login" className="font-semibold text-emerald-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default GatemanRegister;
