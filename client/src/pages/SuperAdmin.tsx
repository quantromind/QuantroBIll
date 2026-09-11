import React, { useState } from 'react';
import { Building2, Store, Users, DollarSign, ShieldCheck, ArrowRight, Plus, Coffee, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TenantItem {
  id: string;
  name: string;
  type: 'Cafe' | 'Restaurant' | 'QSR' | 'FineDine';
  ownerEmail: string;
  plan: 'Basic' | 'Standard' | 'Premium' | 'Enterprise';
  outletsCount: number;
  status: 'Active' | 'Suspended';
  joinedAt: string;
}

export const SuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);

  const [newBusinessName, setNewBusinessName] = useState('');
  const [newType, setNewType] = useState<'Cafe' | 'Restaurant' | 'QSR' | 'FineDine'>('Cafe');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newPlan, setNewPlan] = useState<'Basic' | 'Standard' | 'Premium' | 'Enterprise'>('Premium');
  const [newMaxOutlets, setNewMaxOutlets] = useState<number>(3);

  const [tenants, setTenants] = useState<TenantItem[]>([
    {
      id: 't1',
      name: 'The Magic Bottle - Milkshakes And Snacks',
      type: 'Cafe',
      ownerEmail: 'owner@magicbottle.com',
      plan: 'Premium',
      outletsCount: 1,
      status: 'Active',
      joinedAt: '2026-06-01',
    },
    {
      id: 't2',
      name: 'Spice Garden Multi-Cuisine',
      type: 'Restaurant',
      ownerEmail: 'admin@spicegarden.com',
      plan: 'Standard',
      outletsCount: 3,
      status: 'Active',
      joinedAt: '2026-05-15',
    },
    {
      id: 't3',
      name: 'Urban Chai & Bakery Cafe',
      type: 'Cafe',
      ownerEmail: 'owner@urbanchai.com',
      plan: 'Basic',
      outletsCount: 1,
      status: 'Active',
      joinedAt: '2026-07-10',
    },
  ]);

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim() || !newOwnerEmail.trim()) return;

    setTenants((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        name: newBusinessName.trim(),
        type: newType,
        ownerEmail: newOwnerEmail.trim(),
        plan: newPlan,
        outletsCount: newMaxOutlets,
        status: 'Active',
        joinedAt: new Date().toISOString().split('T')[0],
      },
    ]);

    setNewBusinessName('');
    setNewOwnerEmail('');
    setShowAddTenantModal(false);
    alert(`Tenant restaurant "${newBusinessName}" provisioned successfully with ${newType} POS mode!`);
  };

  const toggleTenantStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' } : t
      )
    );
  };

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Platform Super Admin Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Multi-Tenant Restaurant Accounts, Cafe/Restaurant SaaS Subscriptions & Outlets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddTenantModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 touch-btn shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Restaurant / Cafe</span>
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 touch-btn"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Tenant SaaS</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{tenants.length}</p>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Cafe & Restaurant</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Outlets Provisioned</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {tenants.reduce((acc, t) => acc + t.outletsCount, 0)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">All Online</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Active POS Staff</p>
            <p className="text-2xl font-black text-slate-900 mt-1">18</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cashiers, KDS, Riders</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Platform GMV (Monthly)</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹8.4L</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">+22% Growth</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800 flex justify-between items-center">
          <span>Tenant Restaurant & Cafe Directory</span>
          <span className="text-xs font-normal text-slate-500">{tenants.length} Enrolled</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Restaurant / Cafe Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Outlets</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                    {t.type === 'Cafe' ? (
                      <Coffee className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Utensils className="w-4 h-4 text-red-600" />
                    )}
                    <span>{t.name}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{t.type} POS</td>
                  <td className="px-4 py-3 text-slate-600">{t.ownerEmail}</td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-bold">{t.outletsCount} Outlets</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleTenantStatus(t.id)}
                      className={`px-2 py-0.5 rounded font-bold touch-btn ${
                        t.status === 'Active'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {t.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        alert(`Switched context to ${t.name}. Launching POS billing...`);
                        navigate('/billing');
                      }}
                      className="text-red-600 hover:text-red-700 font-bold flex items-center justify-end space-x-1"
                    >
                      <span>Impersonate / POS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard New Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Onboard New Restaurant / Cafe</h3>
            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roastery Coffee House or Royal Biryani"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">POS Business Mode</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-medium"
                  >
                    <option value="Cafe">Cafe / Bakery POS</option>
                    <option value="Restaurant">Full Restaurant (Dine-In)</option>
                    <option value="QSR">Fast Food / QSR Counter</option>
                    <option value="FineDine">Fine Dining & Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SaaS Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e: any) => setNewPlan(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-medium"
                  >
                    <option value="Basic">Basic (1 Outlet)</option>
                    <option value="Standard">Standard (3 Outlets)</option>
                    <option value="Premium">Premium (10 Outlets)</option>
                    <option value="Enterprise">Enterprise (Unlimited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  placeholder="owner@business.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Allowed Outlets Count</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newMaxOutlets}
                  onChange={(e) => setNewMaxOutlets(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg touch-btn shadow-xs"
                >
                  Provision Tenant SaaS
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg touch-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
