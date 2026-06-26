import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, User, KeyRound, ArrowRight, Eye, QrCode, FileText, CheckCircle2 } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 text-center max-w-6xl mx-auto space-y-8">
        
        {/* Glow Effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse" />

        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
            <Eye className="h-3.5 w-3.5" /> Next-Gen Smart Campus Security
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Automated Campus Management <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Driven by Computer Vision AI
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Integrating high-fidelity Facial Recognition, dynamic Attendance boundaries, live Gate Monitoring, and secure QR credentials into a unified, secure campus system.
          </p>
        </div>
      </section>

      {/* Access Portals Grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Student Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Student Portal</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Register your facial model, generate your secure dynamic QR pass, and review physical attendance history.
            </p>
          </div>
          <Link
            to="/student/login"
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <span>Access Student Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Gateman Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">Gate Guard Console</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify identity using automated face capture, perform manual searches, and scan QR access credentials.
            </p>
          </div>
          <Link
            to="/gateman/login"
            className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <span>Launch Gate Terminal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Admin Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Admin Command</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Manage student directories, update gate timing configurations, oversee attendance records, and review analytics.
            </p>
          </div>
          <Link
            to="/admin/login"
            className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <span>Open Admin Panel</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </section>

      {/* Feature Highlight Sections */}
      <section className="bg-slate-950 border-t border-slate-800/60 py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Full-Spectrum Smart Integrations</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Our backend matches models against computer vision datasets while automating record logging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Face Recognition</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Extracts 128D encodings via dlib/OpenCV, comparing metrics in 0.2s.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Dynamic QR Passes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Generates timestamp-locked encrypted cards for failover verification.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Access Scheduling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Supports customized date, day-of-week, and general gate hour limitations.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Automated Reports</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Exports structured CSV registers and professional, formatted PDF logs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security alerts logic showcase */}
      <section className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <div className="space-y-4 flex-1">
            <h3 className="text-2xl font-bold text-white">Dynamic Late & Block Policy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              To encourage compliance, the gate monitoring engine enforces soft alerts and automated lockouts:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" /> Warning email alert triggered on 3rd late entry.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" /> Strong warning email triggered on 4th late entry.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-red-500 shrink-0" /> Automated account block and physical gate lock on 5th late attempt.</li>
            </ul>
          </div>
          <div className="w-48 h-48 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 space-y-3 shrink-0">
            <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Security Engine</span>
            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Operational</span>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
