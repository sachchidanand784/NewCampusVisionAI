import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    // Mock submit behavior
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      reset();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Back Link */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Contact Administration & Support</h1>
          <p className="text-slate-400 text-lg">
            Have questions about system access, block overrides, or registration? Get in touch with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Details Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Campus Location</h3>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Admin Block, Sector 4<br />
                  Campus Science & Technology Campus
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Support Channels</h3>
              <div className="space-y-3 text-slate-400 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-purple-400 shrink-0" />
                  <span>support@campusvision.edu</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-purple-400 shrink-0" />
                  <span>+1 (555) 019-2834</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-white">Send an Inquiry Message</h3>
            
            {success && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl p-4 flex items-center space-x-3 text-sm">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Your message has been sent successfully. Support will reply via email shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...register('name', { required: true })}
                  />
                  {errors.name && <p className="text-[10px] text-red-500">Name is required</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
                    {...register('email', { required: true })}
                  />
                  {errors.email && <p className="text-[10px] text-red-500">Email is required</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Requesting manual override block list"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm"
                  {...register('subject', { required: true })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or questions in detail..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm resize-none"
                  {...register('message', { required: true })}
                />
                {errors.message && <p className="text-[10px] text-red-500">Message is required</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10"
              >
                <span>Send Message</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
