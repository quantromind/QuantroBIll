import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, size = 'md' }) => {
  const dims = size === 'sm'
    ? { track: 'w-8 h-[18px]', thumb: 'w-3.5 h-3.5', translate: 'translate-x-[14px]' }
    : { track: 'w-10 h-[22px]', thumb: 'w-4 h-4', translate: 'translate-x-[18px]' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex items-center rounded-full shrink-0
        transition-colors duration-200 ease-in-out
        focus:outline-none touch-btn
        ${dims.track}
        ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-sm
          transform transition-transform duration-200 ease-in-out
          ${dims.thumb}
          ${enabled ? dims.translate : 'translate-x-[3px]'}
        `}
      />
    </button>
  );
};
