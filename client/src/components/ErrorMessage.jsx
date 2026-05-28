import React from 'react';

/**
 * Standard Error Notification Banner
 */
const ErrorMessage = ({ message }) => {
  return (
    <div class="glass-panel border-red-500/30 p-6 rounded-2xl max-w-xl mx-auto my-8 flex items-start space-x-4 bg-red-950/20">
      <span class="text-3xl">⚠️</span>
      <div class="flex-grow">
        <h4 class="text-lg font-bold text-red-400">System Diagnostic Alert</h4>
        <p class="text-sm text-red-300 mt-1">{message || 'An unexpected connection error occurred.'}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
