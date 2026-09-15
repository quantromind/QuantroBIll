import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTableToolbar } from '../components/DataTableToolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { announcementsApi } from '../services/announcementsApi';
import type { AnnouncementItem } from '../types';

export const Announcements: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await announcementsApi.getAllAnnouncements();
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      } else {
        setAnnouncements([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await announcementsApi.deleteAnnouncement(deleteTarget.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = typeFilter === 'All' ? true : a.type === typeFilter;

    return matchSearch && matchType;
  });

  const total = announcements.length;
  const activeCount = announcements.filter((a) => a.isActive).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Feature':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Warning':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div>
      <PageHeader
        title="Broadcast Announcements & Notices"
        subtitle="Publish maintenance notices, new feature alerts, and broadcast messages directly to restaurant tenants."
        icon={Megaphone}
        onRefresh={loadAnnouncements}
        isRefreshing={loading}
      >
        <button
          onClick={() => navigate('/superadmin/announcements/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Broadcast Notice</span>
        </button>
      </PageHeader>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Broadcasts"
          value={total}
          icon={Megaphone}
          colorScheme="blue"
          subtext="Notices sent to date"
        />
        <StatCard
          label="Active Broadcasts"
          value={activeCount}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtext="Currently visible on tenant portals"
        />
        <StatCard
          label="Feature Updates"
          value={announcements.filter((a) => a.type === 'Feature').length}
          icon={Info}
          colorScheme="purple"
          subtext="Release announcements"
        />
        <StatCard
          label="Maintenance Windows"
          value={announcements.filter((a) => a.type === 'Maintenance').length}
          icon={AlertTriangle}
          colorScheme="amber"
          subtext="Scheduled downtime notices"
        />
      </div>

      {/* TOOLBAR */}
      <DataTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search notices by title, message, or audience..."
        totalCount={filteredAnnouncements.length}
        filters={[
          {
            id: 'type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: 'All', label: 'All Notice Types' },
              { value: 'Feature', label: 'Feature Release' },
              { value: 'Maintenance', label: 'Maintenance' },
              { value: 'Info', label: 'General Info' },
              { value: 'Warning', label: 'Urgent Warning' },
            ],
          },
        ]}
      />

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadAnnouncements} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold">Loading platform broadcasts...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Announcements Found</h3>
            <p className="text-xs text-slate-400 mt-1">No notices match your current query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Title & Content</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Published / Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredAnnouncements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{item.message}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getTypeBadge(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                      {item.targetAudience === 'All' ? 'All Tenants' : `${item.targetAudience} Plan`}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      <div>{new Date(item.publishedAt).toLocaleDateString('en-IN')}</div>
                      {item.expiresAt && (
                        <div className="text-[10px] text-slate-400">
                          Exp: {new Date(item.expiresAt).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/superadmin/announcements/${item.id}`)}
                          className="w-7 h-7 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="w-7 h-7 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Announcement?"
        message={`Are you sure you want to remove the broadcast notice "${deleteTarget?.title}"? It will no longer display on tenant portals.`}
        confirmText="Delete Notice"
        variant="danger"
        isProcessing={isProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
