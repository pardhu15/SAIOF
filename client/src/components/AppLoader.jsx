import React from 'react';

/**
 * Fullscreen App Initialization Loader
 */
const AppLoader = () => {
  return (
    <div class="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-6 text-gray-100 font-sans">
      <div class="flex items-center space-x-3 animate-pulse">
        <span class="text-4xl">🛍️</span>
        <span class="text-2xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
          SAIOF
        </span>
      </div>
      <div class="flex flex-col items-center">
        <div class="w-10 h-10 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400 font-semibold mt-4">Connecting to store server...</span>
      </div>
    </div>
  );
};

export default AppLoader;
