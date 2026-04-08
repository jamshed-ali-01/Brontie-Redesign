'use client';

import React, { useState, useRef, useEffect } from 'react';

type DropdownOption = {
  label: string;
  value: string;
};

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
}

function CustomDropdown({ label, options, value, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-full flex items-center justify-between bg-white text-gray-700 text-[13px] font-bold px-6 py-4 min-w-[200px] focus:outline-none rounded-xl"
      >
        <span className="truncate">
          {label}: <span className="text-gray-900">{selectedOption.label}</span>
        </span>
        <svg 
          className={`w-4 h-4 ml-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[120%] left-0 w-full min-w-[240px] bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] py-3 z-50 border border-gray-50">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-[13px] hover:bg-gray-50 transition-colors flex flex-col items-start ${value === option.value ? 'font-bold text-gray-900 bg-gray-50/50' : 'font-medium text-gray-700'}`}
            >
              {option.label}
              {option.value === 'any_other' && (
                <span className="text-[10px] text-gray-400 font-normal mt-0.5 leading-tight">
                  Any other items they have listed
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface FilterState {
  search: string;
  product: string;
  dateRange: string;
  sortBy: string;
}

interface VouchersFilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export default function VouchersFilterBar({ filters, onChange }: VouchersFilterBarProps) {
  
  const productOptions = [
    { label: 'All', value: 'all' },
    { label: 'Coffee', value: 'coffee' },
    { label: 'Coffee & Cake', value: 'coffee_cake' },
    { label: 'Any other item', value: 'any_other' },
  ];

  const dateOptions = [
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'All Time', value: 'all_time' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Value: High to Low', value: 'value_high' },
    { label: 'Value: Low to High', value: 'value_low' },
    { label: 'Redemption: First to Last', value: 'redemption_first' },
    { label: 'Redemption: Last to First', value: 'redemption_last' },
    { label: 'Purchase: First to Last', value: 'purchase_first' },
    { label: 'Purchase: Last to First', value: 'purchase_last' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6 relative z-30">
      
      {/* Search Input - Independent floating block */}
      <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl relative border-transparent">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-[#879bb1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-transparent h-full py-4 pl-12 pr-6 text-[13px] text-gray-700 placeholder-[#879bb1] font-bold focus:outline-none rounded-xl"
          placeholder="Search by Voucher Code or Name"
        />
      </div>

      {/* Filters Base - 3 floating dropdown blocks */}
      <div className="flex flex-col md:flex-row gap-2">
        <CustomDropdown
          label="Product"
          options={productOptions}
          value={filters.product}
          onChange={(val) => onChange({ ...filters, product: val })}
        />
        <CustomDropdown
          label="Date"
          options={dateOptions}
          value={filters.dateRange}
          onChange={(val) => onChange({ ...filters, dateRange: val })}
        />
        <CustomDropdown
          label="Sort by"
          options={sortOptions}
          value={filters.sortBy}
          onChange={(val) => onChange({ ...filters, sortBy: val })}
        />
      </div>

    </div>
  );
}
