import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, EyeOff } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <EyeOff className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-350 leading-relaxed">
          <p>
            Your privacy is crucial. Campus Vision AI is committed to securing personal parameters, photographic models, and campus log histories.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">1. Collected Information</h3>
          <p>
            When registering, we collect your academic particulars (name, email, roll number, department, session) and biometric face capture details. The system generates mathematical 128D arrays to map distances between eye sockets, bridges, and jawlines.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">2. Processing & Storage</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Face Encodings</strong>: Stored as numerical arrays inside our secure PostgreSQL database.</li>
            <li><strong>Images</strong>: Saved on highly-secure Cloudinary repositories. Direct links are only retrievable via authenticated API calls.</li>
            <li><strong>Check-in Logs</strong>: Timestamps and gate access directions are stored to compute class attendance.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white pt-2">3. Data Security</h3>
          <p>
            All endpoints are shielded using JSON Web Tokens (JWT) using HS256 validation. Direct database records cannot be queried publicly.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">4. Biometric Data Deletion</h3>
          <p>
            When a student profile is deleted by administrators, the corresponding database rows, numeric face encodings, and hosted Cloudinary files are immediately and permanently erased from the network.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
