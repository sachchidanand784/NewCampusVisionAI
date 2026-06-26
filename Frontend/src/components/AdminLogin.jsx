import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, User as UserIcon, AlertCircle, Loader } from 'lucide-react';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      const user = await login(data.username, data.password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setServerError('This portal is strictly reserved for administrators.');
      }
    } catch (err) {
      setServerError(err.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-slate-900/5">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-purple-100 shadow-2xl rounded-2xl p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center border border-purple-200">
            <ShieldAlert className="h-6 w-6 text-purple-700" />
          </div>
          <h2 className="text-3xl font-extrabold text-purple-950 tracking-tight">Admin Console</h2>
          <p className="text-slate-500 text-sm">Sign in to manage smart campus controls and view analytics</p>
        </div>

        {/* Server Error Alerts */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <UserIcon className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Enter admin username"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all ${
                  errors.username ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-purple-500'
                }`}
                {...register('username', { required: 'Username is required.' })}
              />
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-600">Password</label>
              <Link to="/reset-password" className="text-xs font-semibold text-purple-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <KeyRound className="h-5 w-5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-white border rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all ${
                  errors.password ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-purple-500'
                }`}
                {...register('password', { required: 'Password is required.' })}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all flex justify-center items-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Home link */}
        <div className="text-center pt-2">
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-purple-700 hover:underline">
            Back to Home Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
