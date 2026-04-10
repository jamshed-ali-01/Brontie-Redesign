'use client';

import React, { useState, useEffect } from 'react';

export interface VoucherRow {
  id: string;
  itemName: string;
  itemImage: string;
  value: number;
  location: string;
  purchaseDate: string;
  redemptionDate: string;
  code: string;
}

interface VouchersTableProps {
  data: VoucherRow[];
}

export default function VouchersTable({ data }: VouchersTableProps) {
  const recordsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if data changes (e.g. on new filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / recordsPerPage));
  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentData = data.slice(startIndex, startIndex + recordsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${
              currentPage === i
                ? 'bg-[#f4c24d] text-gray-900 border-none'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(
          <span key={i} className="w-8 h-8 flex items-center justify-center text-gray-400">
            ...
          </span>
        );
      }
    }
    
    // Remove duplicate ellipsis if any
    return pages.filter((item, pos, arr) => {
      if (pos > 0 && item.key?.toString().includes('...') && arr[pos - 1].key?.toString().includes('...')) {
        return false;
      }
      return true;
    });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <h3 className="text-gray-900 text-lg font-bold">No vouchers found</h3>
        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white">ITEM</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white">VALUE</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white">LOCATION</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white">PURCHASE DATE/TIME</th>
              <th className="px-4 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white">REDEMPTION DATE/TIME</th>
              <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase bg-white text-right">CODE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {currentData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-sm p-0.5 bg-white">
                       <img 
                          src={row.itemImage} 
                          alt={row.itemName} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80';
                          }}
                       />
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-gray-900">{row.itemName}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-[13px] font-bold text-[#6ca3a4]">
                  €{row.value.toFixed(2)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-[13px] font-bold text-[#879bb1]">
                  {row.location}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-[13px] font-medium text-gray-400">
                  {row.purchaseDate}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-[13px] font-medium text-gray-400">
                  {row.redemptionDate}
                </td>
                <td className="px-4 sm:px-8 py-3 sm:py-4 text-right">
                  <span className="inline-flex bg-teal-50 text-[#6ca3a4] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border border-teal-100">
                    {row.code}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data.length > recordsPerPage && (
        <div className="border-t border-gray-100 px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 bg-white">
          <span className="text-[11px] sm:text-[13px] font-medium text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, data.length)} of {data.length} entries
          </span>
          <div className="flex space-x-2">
            {/* Previous Button */}
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                currentPage === 1 
                  ? 'border-gray-100 text-gray-300 opacity-50 cursor-not-allowed' 
                  : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            
            {/* Page Numbers */}
            {renderPageNumbers()}
            
            {/* Next Button */}
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                currentPage === totalPages 
                  ? 'border-gray-100 text-gray-300 opacity-50 cursor-not-allowed' 
                  : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
