import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Shield, Users, Server, ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Back Link */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">About Campus Vision AI</h1>
          <p className="text-slate-400 text-lg">
            An intelligent, automated system managing attendance, gates security, and roles authorization through advanced facial algorithms.
          </p>
        </div>

        {/* Grid description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Facial Encoding Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Leverages OpenCV and dlib's state-of-the-art 128-dimensional encodings. Compares incoming video frames or photographs against data in PostgreSQL databases to verify identity with a 99.3% accuracy rate.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Dynamic Late Access Control</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enforces gate schedule parameters date-wise or day-wise. Late entries trigger warnings, while persistent delay (up to 5 events) automatically locks gate access.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Role-Based Operations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Provides dedicated screens and access tiers for Administrators (rules, analytics), Gate Guards (captures, scans), and Students (QR cards, history tracking).
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Scalable Infrastructure</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed with a modular presentation-service architecture. Works with Django REST Framework, JWT validation, PostgreSQL databases, and Cloudinary media hosts.
            </p>
          </div>
        </div>

        {/* Development team / project details */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold text-white">Final Year / Resume Ready Project</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Campus Vision AI satisfies production standards for computer engineering, integrating AI layers, security frameworks, and real-time frontend charts.
          </p>
        </div>

      </div>
    </div>
  );
};

export default About;
