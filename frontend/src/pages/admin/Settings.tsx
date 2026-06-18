import React from 'react';

const Settings = () => {
  return (
    <div className="bg-black min-h-screen text-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">System Settings</h1>
          <p className="text-white/70 font-navbar mt-2">Manage global platform configurations and preferences.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center h-[60vh] border border-white/10 border-dashed rounded-xl bg-white/5">
        <div className="text-center">
          <i className="fas fa-cogs text-5xl text-primary/50 mb-4"></i>
          <h2 className="text-2xl font-semibold font-navbar text-white mb-2">Settings Module Coming Soon</h2>
          <p className="text-white/50 font-navbar max-w-md mx-auto">
            Global configuration and platform-wide settings will be available in the next major update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
