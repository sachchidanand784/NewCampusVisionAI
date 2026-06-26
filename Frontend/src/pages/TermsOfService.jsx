import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';

const TermsOfService = () => {
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
            <Scale className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of Service</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-350 leading-relaxed">
          <p>
            Welcome to Campus Vision AI. By registering your account and enrolling your face parameters, you agree to comply with the terms set forth below.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">1. Profile Facial Registration</h3>
          <p>
            Students must upload clear, unaltered photographs representing their actual appearance. Registering or mapping face encodings on behalf of another student is strictly forbidden and constitutes identity fraud, resulting in immediate academic suspension.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">2. Biometric Datasets & Verification</h3>
          <p>
            Our software translates image uploads into numeric float values representing facial structures. This calculation is stored securely within university PostgreSQL databases and is strictly used to automate class registries and manage physical border gates.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">3. Gate Policy Limits</h3>
          <p>
            Users acknowledge that check-ins past specified end limit parameters are logged as late. Reaching 5 late records automatically blocks gate access. System unblocking requires explicit, manual override by campus administration.
          </p>

          <h3 className="text-lg font-semibold text-white pt-2">4. Disclaimers</h3>
          <p>
            This software is provided "as is". The institution is not liable for verification check delays due to technical camera failures, networks lag, or database synchronization events. Offline manual sign-ins are available under supervising guards.
          </p>
        </div>

      </div>
    </div>
  );
};

export default TermsOfService;
