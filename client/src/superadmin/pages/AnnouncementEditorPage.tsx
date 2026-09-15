import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Megaphone,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { announcementsApi } from '../services/announcementsApi';
import type { AnnouncementItem } from '../types';

export const AnnouncementEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<AnnouncementItem>>({
    title: '',
    message: '',
    type: 'Feature',
    targetAudience: 'All',
    isActive: true,
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      announcementsApi
        .getAnnouncementById(id)
        .then((res) => {
          if (res.success && res.data) {
            setFormData({
              ...res.data,
              expiresAt: res.data.expiresAt
                ? new Date(res.data.expiresAt).toISOString().split('T')[0]
                : '',
            });
          } else {
            setError('Announcement not found.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load announcement.');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditing, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('Title is required.');
      return;
    }
    if (!formData.message?.trim()) {
      setError('Message body is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await announcementsApi.updateAnnouncement(id, formData);
        setSuccessMessage('Announcement updated successfully.');
      } else {
        await announcementsApi.createAnnouncement(formData);
        setSuccessMessage('Broadcast notice published.');
      }
      setTimeout(() => {
        navigate('/superadmin/announcements');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading announcement...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/superadmin/announcements')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Announcements</span>
        </button>
      </div>

      <PageHeader
        title={isEditing ? 'Edit Announcement' : 'Compose Platform Broadcast'}
        subtitle="Broadcast system alerts, update notifications, or scheduled maintenance notices to tenants."
        icon={Megaphone}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Headline / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. QuantroBill v2.0 Platform Upgrade & Cloud Kitchen Sync"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notice Category
              </label>
              <select
                value={formData.type || 'Feature'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Feature">Feature Release / Enhancement</option>
                <option value="Maintenance">Scheduled Maintenance Window</option>
                <option value="Info">General Platform Information</option>
                <option value="Warning">Urgent Security / Regulatory Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Audience Segment
              </label>
              <select
                value={formData.targetAudience || 'All'}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Restaurant Tenants (Universal)</option>
                <option value="Starter">Starter Plan Tenants Only</option>
                <option value="Professional">Professional Plan Tenants Only</option>
                <option value="Enterprise">Enterprise Plan Tenants Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Body Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Detailed description of the update, actions required by restaurant staff, or expected maintenance window..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expiry Date (Auto-dismiss after date)
              </label>
              <input
                type="date"
                value={formData.expiresAt || ''}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Broadcast is Active & Visible Now</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/announcements')}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : isEditing ? 'Update Notice' : 'Broadcast Notice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
