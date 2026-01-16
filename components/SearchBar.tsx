/**
 * Search Bar Component
 * 会话搜索和筛选
 */

import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  filters?: { label: string; value: string }[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterChange,
  filters = [
    { label: '全部', value: 'all' },
    { label: 'Gemini', value: 'gemini' },
    { label: 'DeepSeek', value: 'deepseek' }
  ],
  placeholder = '搜索对话...'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
      {/* Search Input */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="搜索对话"
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="清除搜索"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            role="tab"
            aria-selected={activeFilter === filter.value}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeFilter === filter.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
