import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const buttonStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition disabled:opacity-60 cursor-pointer ${buttonStyles[variant]}`}
            >
              {isProcessing ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
