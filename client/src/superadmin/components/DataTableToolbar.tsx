import React from 'react';
import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  id: string;
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface DataTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  totalCount?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  children?: React.ReactNode;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  totalCount,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-wrap">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto">
        {filters.map((filter) => (
          <div key={filter.id} className="min-w-[130px]">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Page Size Selector */}
        {pageSize && onPageSizeChange && (
          <div className="min-w-[110px]">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz} per page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Count Badge */}
        {totalCount !== undefined && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 shrink-0">
            {totalCount} {totalCount === 1 ? 'found' : 'found'}
          </div>
        )}

        {/* Custom Actions slot */}
        {children}
      </div>
    </div>
  );
};
