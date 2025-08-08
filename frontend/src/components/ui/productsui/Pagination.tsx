'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Source_Sans_3 } from 'next/font/google';

const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxPageButtons?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxPageButtons = 3,
}) => {
  // Generate page numbers with ellipses
  const generatePageNumbers = () => {
    const pages = [];

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (startPage > 1) {
        pages.unshift(1, '...');
      }
      if (endPage < totalPages) {
        pages.push('...', totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-between px-3 lg:px-0">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${sourceSansPro.className} flex items-center gap-1 text-sm text-gray-600 px-4 py-2 rounded-lg transition-colors ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      
      <div className="flex gap-2">
        {generatePageNumbers().map((page, index) => (
          <React.Fragment key={`${page}-${index}`}>
            {page === '...' ? (
              <span className={`${sourceSansPro.className} text-sm text-gray-600`}>...</span>
            ) : (
              <button
                onClick={() => handlePageChange(Number(page))}
                className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-lg transition-colors ${
                  currentPage === page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${sourceSansPro.className} flex items-center gap-1 text-sm text-gray-600 px-4 py-2 rounded-lg transition-colors ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
        }`}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;