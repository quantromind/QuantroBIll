import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface MustChangePasswordModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        setSuccessMessage('Password changed successfully! Redirecting...');

        // Update current user in auth store
        if (user) {
          const updatedUser = { ...user, mustChangePassword: false };
          const userStr = JSON.stringify(updatedUser);
          localStorage.setItem('quantrobill_user', userStr);
          localStorage.setItem('petbharke_user', userStr);

          // Update Zustand store
          useAuthStore.setState({ user: updatedUser });
        }

        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Security Notice: Password Reset Required</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              First-time login detected. You must change your temporary password before accessing the system.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Current Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current / temporary password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">New Password (min 8 characters) *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Confirm New Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Save New Password & Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
