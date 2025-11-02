import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-black relative">
      <img 
        src="/Halftone.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />
      <div className="rounded-lg p-3 backdrop-blur-sm border border-white/20 shadow-lg w-full max-w-md text-center relative z-10">
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-shield text-4xl text-red-400"></i>
          </div>
          <h3 className="text-6xl font-navbar leading-none tracking-tight text-white py-4">Access Denied</h3>
          <p className="text-xl text-white/70 pb-2">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <div className="p-6 pt-0">
          <Link 
            to="/login"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xl font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-accent h-10 px-4 py-2 w-full text-[#0f181a]"
          >
            <i className="fas fa-arrow-left w-4 h-4 mr-2"></i>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;