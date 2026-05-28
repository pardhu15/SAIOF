import React from 'react';

/**
 * Sleek Search Bar component
 */
const SearchBar = ({ value, onChange, placeholder = 'Search catalog...' }) => {
  return (
    <div class="relative w-full max-w-lg">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="text-gray-500">🔍</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        class="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl text-white outline-none transition-all duration-300 text-sm"
      />
    </div>
  );
};

export default SearchBar;
