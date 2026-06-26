import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand & Rights */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-bold text-lg text-blue-900">
              Campus<span className="text-blue-600">Vision AI</span>
            </span>
            <p className="text-sm text-slate-500 mt-1">
              &copy; {new Date().getFullYear()} Campus Vision AI. All rights reserved.
            </p>
          </div>

          {/* Quick Legal Links */}
          <div className="flex flex-wrap justify-center space-x-6">
            <Link to="/about" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              Contact
            </Link>
            <Link to="/terms-of-service" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
