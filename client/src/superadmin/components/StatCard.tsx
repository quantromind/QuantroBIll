import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'indigo';
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const colorStyles = {
  blue: {
    number: 'text-blue-600',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    badge: 'bg-blue-50 text-blue-700',
  },
  emerald: {
    number: 'text-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  amber: {
    number: 'text-amber-600',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    badge: 'bg-amber-50 text-amber-700',
  },
  purple: {
    number: 'text-purple-600',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    badge: 'bg-purple-50 text-purple-700',
  },
  rose: {
    number: 'text-rose-600',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    badge: 'bg-rose-50 text-rose-700',
  },
  slate: {
    number: 'text-slate-800',
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: 'bg-slate-100 text-slate-700',
  },
  indigo: {
    number: 'text-indigo-600',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    badge: 'bg-indigo-50 text-indigo-700',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  colorScheme = 'blue',
  subtext,
  trend,
  className = '',
}) => {
  const scheme = colorStyles[colorScheme] || colorStyles.blue;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${scheme.number}`}>
          {value}
        </div>

        {(subtext || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            {trend && (
              <span
                className={`font-semibold px-1.5 py-0.5 rounded-sm ${
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtext && <span className="truncate">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
