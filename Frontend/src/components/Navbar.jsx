import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md shadow-blue-500/20">
                <Shield className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-blue-900">
                Campus<span className="text-blue-600">Vision</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Contact
            </Link>

            {user ? (
              <>
                {/* Role Specific Dashboards */}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-semibold transition-all">
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'GATE_MAN' && (
                  <Link to="/gateman" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-lg font-semibold transition-all">
                    Gateman Dashboard
                  </Link>
                )}
                {user.role === 'STUDENT' && (
                  <Link to="/student" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-semibold transition-all">
                    Student Dashboard
                  </Link>
                )}

                {/* Profile Widget */}
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-800">
                      {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/student/login"
                  className="text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Student Portal
                </Link>
                <Link
                  to="/gateman/login"
                  className="text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Gateman Portal
                </Link>
                <Link
                  to="/admin/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/10 transition-all"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              About
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              Contact
            </Link>

            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'GATE_MAN' && (
                  <Link
                    to="/gateman"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Gateman Dashboard
                  </Link>
                )}
                {user.role === 'STUDENT' && (
                  <Link
                    to="/student"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    Student Dashboard
                  </Link>
                )}

                <div className="border-t border-slate-150 pt-4 pb-2 px-3">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <div className="text-base font-semibold text-slate-800">
                        {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </div>
                      <div className="text-sm font-medium text-slate-400 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-red-200 rounded-md text-base font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Log Out
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-4 pb-2 px-3 border-t border-slate-100 space-y-2">
                <Link
                  to="/student/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center w-full px-4 py-2 border border-slate-200 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Student Portal
                </Link>
                <Link
                  to="/gateman/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center w-full px-4 py-2 border border-slate-200 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Gateman Portal
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center w-full px-4 py-2 bg-blue-600 rounded-md text-base font-semibold text-white hover:bg-blue-700"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
