import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Portal authentication components
import StudentLogin from './components/StudentLogin';
import StudentRegister from './components/StudentRegister';
import GatemanLogin from './components/GatemanLogin';
import GatemanRegister from './components/GatemanRegister';
import AdminLogin from './components/AdminLogin';
import VerifyOtp from './components/VerifyOtp';
import ResetPassword from './components/ResetPassword';

// Dashboards components
import StudentDashboard from './components/StudentDashboard';
import GatemanDashboard from './components/GatemanDashboard';
import AdminDashboard from './components/AdminDashboard';

// Marketing and informational pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Loading Spinner helper
import { Loader } from 'lucide-react';

// Wrapper for checking user authorization
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center space-y-3">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <p className="text-sm font-semibold text-slate-400">Verifying session credentials...</p>
      </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect to home page
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If user role doesn't match expected dashboard, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

// General layout rendering Navbar and Footer
const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/20">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Publicly visible pages styled with corporate footer/header */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* Authenticated Portals Entries */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            
            <Route path="/gateman/login" element={<GatemanLogin />} />
            <Route path="/gateman/register" element={<GatemanRegister />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Secure Protected dashboards */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gateman" 
            element={
              <ProtectedRoute allowedRole="GATE_MAN">
                <GatemanDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
