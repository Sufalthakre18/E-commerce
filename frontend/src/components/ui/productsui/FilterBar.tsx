'use client';

import React from 'react';
import { Filter, Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  clearFilters: () => void;
  sortOptions: { value: string; label: string }[];
  categories: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  sortBy,
  setSortBy,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
  clearFilters,
  sortOptions,
  categories,
}) => {
  return (
    <div className="border-b border-gray-200 py-4 lg:py-8">
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-1 lg:py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 lg:gap-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-300"
          >
            <Filter className="w-4 h-4" />
            FILTER & SORT
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-900 transition-colors duration-300"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-4 tracking-wide">CATEGORY</label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedType('')}
                  className={`block w-full text-left text-sm py-2 transition-colors duration-300 ${
                    selectedType === '' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Items
                </button>
                {categories.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`block w-full text-left text-sm py-2 transition-colors duration-300 ${
                      selectedType === type ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-4 tracking-wide">PRICE RANGE</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 underline"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;