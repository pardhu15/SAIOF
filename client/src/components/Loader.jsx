import React from 'react';

/**
 * Standard Loading Spinner
 */
const Loader = () => {
  return (
    <div class="flex flex-col items-center justify-center space-y-4">
      <div class="w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin"></div>
      <span class="text-sm text-gray-400 font-medium tracking-wide">Syncing telemetry data...</span>
    </div>
  );
};

export default Loader;
