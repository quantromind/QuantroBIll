import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  onRefresh,
  isRefreshing = false,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs transition disabled:opacity-60 cursor-pointer"
            title="Refresh dataset"
          >
            <span className={`inline-block text-sm ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
            <span>Refresh</span>
          </button>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionLabel}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
