import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Utensils,
  ShoppingBag,
  Coffee,
  Wine,
  History,
  Cake,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  ChefHat,
  MenuSquare,
  Settings,
  HelpCircle,
  Save,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import type { OwnerEmployee } from '../types';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Default permissions matrix by role
const defaultRolePermissions: Record<string, OwnerEmployee['permissions']> = {
  Cashier: {
    orders: true, fineDine: true, qsr: true, foodCourt: true, restroBar: true,
    recents: true, bakery: true, salesHistory: true, reports: true, expenses: true,
    inventory: false, kitchen: false, menu: false, settings: false, help: true,
  },
  Waiter: {
    orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
    recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
    inventory: false, kitchen: false, menu: false, settings: false, help: true,
  },
  Captain: {
    orders: true, fineDine: true, qsr: true, foodCourt: false, restroBar: true,
    recents: true, bakery: false, salesHistory: true, reports: false, expenses: false,
    inventory: false, kitchen: false, menu: false, settings: false, help: true,
  },
  Chef: {
    orders: false, fineDine: false, qsr: false, foodCourt: false, restroBar: false,
    recents: false, bakery: false, salesHistory: false, reports: false, expenses: false,
    inventory: false, kitchen: true, menu: false, settings: false, help: true,
  },
  Manager: {
    orders: true, fineDine: true, qsr: true, foodCourt: true, restroBar: true,
    recents: true, bakery: true, salesHistory: true, reports: true, expenses: true,
    inventory: true, kitchen: true, menu: true, settings: true, help: true,
  },
};

export const EmployeeManager: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const tenantId = user?.tenantId || tenant?.id || localStorage.getItem('quantrobill_tenant_id') || '';

  const [employees, setEmployees] = useState<OwnerEmployee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAlert, setSavedAlert] = useState(false);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'Cashier' | 'Waiter' | 'Captain' | 'Chef' | 'Manager'>('Cashier');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<OwnerEmployee['permissions']>(defaultRolePermissions['Cashier']);

  // Editable Form fields for selected employee
  const [editName, setEditName] = useState('');
  const [editMenuCode, setEditMenuCode] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Helper to map backend user object to OwnerEmployee
  const mapBackendUserToEmployee = (u: any): OwnerEmployee => {
    let role: OwnerEmployee['role'] = 'Cashier';
    const rawRole = (u.role || '').toLowerCase();
    if (rawRole.includes('admin') || rawRole.includes('manager')) role = 'Manager';
    else if (rawRole.includes('cashier')) role = 'Cashier';
    else if (rawRole.includes('waiter')) role = 'Waiter';
    else if (rawRole.includes('captain')) role = 'Captain';
    else if (rawRole.includes('kitchen') || rawRole.includes('chef')) role = 'Chef';

    // Parse permissions from array or use role defaults
    const perms: OwnerEmployee['permissions'] = { ...defaultRolePermissions[role] };
    if (Array.isArray(u.permissions) && u.permissions.length > 0) {
      if (u.permissions.includes('all')) {
        Object.keys(perms).forEach((k) => {
          (perms as any)[k] = true;
        });
      } else {
        Object.keys(perms).forEach((k) => {
          (perms as any)[k] = u.permissions.includes(k);
        });
      }
    }

    const username = u.username || 'staff';
    const menuCode = (username.length >= 2 ? username.slice(0, 2) : 'st') + '91@';

    const lastLogin = u.lastLoginAt
      ? `Active ${new Date(u.lastLoginAt).toLocaleDateString()}`
      : 'Never logged in';

    return {
      id: u.id,
      name: u.fullName || u.username,
      menuCode,
      contact: u.phone || '',
      password: '',
      role,
      isActiveNow: !!u.lastLoginAt && Date.now() - new Date(u.lastLoginAt).getTime() < 30 * 60 * 1000,
      lastActive: lastLogin,
      allowedSections: {
        fineDine: true,
        fineDineTables: 23,
        takeAway: role !== 'Chef',
        takeAwayCounters: 5,
        homeDelivery: role !== 'Chef',
        homeDeliveryZones: 10,
      },
      permissions: perms,
    };
  };

  // Fetch employees from backend
  const fetchEmployees = useCallback(async () => {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      try {
        const tRes = await apiClient.get<{ success: boolean; data: any[] }>('/tenants');
        const myTenant = tRes.data?.data?.find(
          (t: any) =>
            (user?.email && t.ownerEmail?.toLowerCase() === user.email.toLowerCase()) ||
            (tenant?.businessName && t.businessName?.toLowerCase() === tenant.businessName.toLowerCase())
        );
        if (myTenant) {
          resolvedTenantId = myTenant.id;
          localStorage.setItem('quantrobill_tenant_id', myTenant.id);
        }
      } catch {
        // fallback
      }
    }

    if (!resolvedTenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{ success: boolean; data: any[] }>(`/tenants/${resolvedTenantId}/users`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map(mapBackendUserToEmployee);
        setEmployees(mapped);
        if (mapped.length > 0) {
          const current = mapped.find((e) => e.id === selectedEmpId) || mapped[0];
          setSelectedEmpId(current.id);
          setEditName(current.name);
          setEditMenuCode(current.menuCode);
          setEditContact(current.contact);
          setEditPassword('');
        }
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.response?.data?.message || 'Failed to load employees from server.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedEmpId]);

  useEffect(() => {
    fetchEmployees();
  }, [tenantId]);

  // Sync edit form when selected employee changes
  const handleSelectEmployee = (emp: OwnerEmployee) => {
    setSelectedEmpId(emp.id);
    setEditName(emp.name);
    setEditMenuCode(emp.menuCode);
    setEditContact(emp.contact);
    setEditPassword('');
    setSavedAlert(false);
  };

  // Toggle single permission for current selected employee
  const handleTogglePermission = (permKey: keyof OwnerEmployee['permissions']) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === selectedEmpId) {
          return {
            ...emp,
            permissions: {
              ...emp.permissions,
              [permKey]: !emp.permissions[permKey],
            },
          };
        }
        return emp;
      })
    );
    setSavedAlert(false);
  };

  // Save changes to backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !tenantId) return;

    try {
      setSaving(true);
      const activePermissions = Object.keys(selectedEmployee.permissions).filter(
        (k) => (selectedEmployee.permissions as any)[k]
      );

      const updatePayload: any = {
        fullName: editName.trim(),
        phone: editContact.trim(),
        role: selectedEmployee.role,
        permissions: activePermissions,
      };

      if (editPassword.trim()) {
        updatePayload.password = editPassword.trim();
      }

      await apiClient.put(`/tenants/${tenantId}/users/${selectedEmployee.id}`, updatePayload);

      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === selectedEmpId) {
            return {
              ...emp,
              name: editName,
              menuCode: editMenuCode,
              contact: editContact,
            };
          }
          return emp;
        })
      );

      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update employee credentials.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Role change in Add Modal
  const handleNewRoleChange = (role: typeof newRole) => {
    setNewRole(role);
    setNewPermissions(defaultRolePermissions[role] || defaultRolePermissions['Cashier']);
  };

  // Handle Create Employee Submit
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newUsername.trim()) {
      setCreateError('Username is required.');
      return;
    }
    if (!newPassword.trim()) {
      setCreateError('Password is required.');
      return;
    }
    const targetTenantId = tenantId || localStorage.getItem('quantrobill_tenant_id') || '';
    if (!targetTenantId) {
      setCreateError('Tenant identifier missing.');
      return;
    }

    try {
      setCreateLoading(true);
      const activePermissions = Object.keys(newPermissions).filter((k) => (newPermissions as any)[k]);

      const res = await apiClient.post(`/tenants/${targetTenantId}/users`, {
        username: newUsername.trim(),
        fullName: newFullName.trim() || newUsername.trim(),
        phone: newPhone.trim(),
        password: newPassword.trim(),
        role: newRole,
        permissions: activePermissions,
      });

      if (res.data?.success && res.data.data) {
        const createdEmp = mapBackendUserToEmployee(res.data.data);
        setEmployees((prev) => [...prev, createdEmp]);
        setSelectedEmpId(createdEmp.id);
        setEditName(createdEmp.name);
        setEditMenuCode(createdEmp.menuCode);
        setEditContact(createdEmp.contact);
        setEditPassword('');

        // Reset and close modal
        setIsAddModalOpen(false);
        setNewFullName('');
        setNewUsername('');
        setNewPhone('');
        setNewPassword('');
        setNewRole('Cashier');
        setNewPermissions(defaultRolePermissions['Cashier']);
        setSavedAlert(true);
        setTimeout(() => setSavedAlert(false), 3000);
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create employee.');
    } finally {
      setCreateLoading(false);
    }
  };

  // 15 Permissions definitions
  const permissionCards = [
    { key: 'orders' as const, label: 'Orders', icon: ShoppingBag },
    { key: 'fineDine' as const, label: 'Fine Dine', icon: Utensils },
    { key: 'qsr' as const, label: 'QSR', icon: Coffee },
    { key: 'foodCourt' as const, label: 'Food Court', icon: Coffee },
    { key: 'restroBar' as const, label: 'Restro Bar', icon: Wine },
    { key: 'recents' as const, label: 'Recents', icon: History },
    { key: 'bakery' as const, label: 'Bakery', icon: Cake },
    { key: 'salesHistory' as const, label: 'Sales History', icon: TrendingUp },
    { key: 'reports' as const, label: 'Reports', icon: FileText },
    { key: 'expenses' as const, label: 'Expenses', icon: DollarSign },
    { key: 'inventory' as const, label: 'Inventory', icon: Package },
    { key: 'kitchen' as const, label: 'Kitchen', icon: ChefHat },
    { key: 'menu' as const, label: 'Menu', icon: MenuSquare },
    { key: 'settings' as const, label: 'Settings', icon: Settings },
    { key: 'help' as const, label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-slate-900 select-none">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Employee Login & Access Matrix</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </h1>
          <p className="text-[11px] text-slate-400">
            Configure staff credentials, allowed section tables and individual module permissions dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedAlert && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
              <UserCheck className="w-3.5 h-3.5" />
              <span>✓ Successfully Updated!</span>
            </span>
          )}

          {/* ADD EMPLOYEE BUTTON */}
          <button
            onClick={() => {
              setCreateError(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split Layout: Left Staff List (1 Col), Right Permissions Grid (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Employee Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Staff Members</span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {employees.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading staff roster...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">No staff members yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add New Employee" to create your first Cashier or Waiter.</p>
                </div>
              </div>
            ) : (
              employees.map((emp) => {
                const isSelected = emp.id === selectedEmpId;
                const roleBadgeColor =
                  emp.role === 'Manager'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : emp.role === 'Cashier'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : emp.role === 'Waiter'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : emp.role === 'Chef'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200';

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 border-l-4 border-blue-600 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Active Presence Dot Indicator */}
                      <span className="relative flex h-2.5 w-2.5">
                        {emp.isActiveNow ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </>
                        ) : (
                          <span className="rounded-full h-2.5 w-2.5 bg-slate-300"></span>
                        )}
                      </span>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {emp.name}
                        </p>
                        <p className={`text-[10px] ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                          {emp.lastActive}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                      {emp.role}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Employee Details & 15 Permission Grid */}
        <div className="lg:col-span-3 space-y-4">
          {selectedEmployee ? (
            <>
              {/* Top Form: Menu Code, Username, Contact, Password & Section Assignment */}
              <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Menu Code / Code
                    </label>
                    <input
                      type="text"
                      value={editMenuCode}
                      onChange={(e) => setEditMenuCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      User Contact / Phone
                    </label>
                    <input
                      type="text"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Allowed Sections Selector & UPDATE Button */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ROLE:</span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                      {selectedEmployee.role.toUpperCase()} • ALL OUTLETS
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saving ? 'SAVING...' : 'UPDATE CREDENTIALS'}</span>
                  </button>
                </div>
              </form>

              {/* 15 Permissions Visual Grid */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Assigned Capabilities for <span className="text-blue-600 underline">{selectedEmployee.name}</span>
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Click any card to toggle access & click UPDATE CREDENTIALS to save</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {permissionCards.map((perm) => {
                    const Icon = perm.icon;
                    const isAllowed = selectedEmployee.permissions[perm.key];

                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`relative p-3.5 rounded-xl border transition flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs hover:shadow-xs select-none ${
                          isAllowed
                            ? 'border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50/70 text-blue-900'
                            : 'border-dashed border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-90 text-slate-400'
                        }`}
                      >
                        {/* Top Right Status Badge Icon */}
                        <div className="absolute top-2 right-2">
                          {isAllowed ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                              ✕
                            </span>
                          )}
                        </div>

                        {/* Module Icon */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                            isAllowed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Module Title */}
                        <span className={`text-xs font-bold ${isAllowed ? 'text-slate-900' : 'text-slate-500'}`}>
                          {perm.label}
                        </span>
                        <span
                          className={`text-[9px] font-semibold mt-0.5 ${
                            isAllowed ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          {isAllowed ? 'Allowed' : 'Restricted'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-2xs text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <h2 className="text-base font-bold text-slate-800">No Employee Selected</h2>
              <p className="text-xs text-slate-500 max-w-md">
                Create a new Cashier or Waiter using the button above to assign role permissions and credentials.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                + Add Employee Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE EMPLOYEE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Staff Employee</h3>
                  <p className="text-[11px] text-slate-400">Add Cashier, Waiter, Captain, or Kitchen Staff</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEmployee} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => handleNewRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cashier">Cashier (Biller)</option>
                    <option value="Waiter">Waiter (Mobile Floor)</option>
                    <option value="Captain">Captain (Floor Manager)</option>
                    <option value="Chef">Chef (Kitchen / KDS)</option>
                    <option value="Manager">Manager (Store Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cashier1"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Pawar"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Login Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password for employee"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Module Capabilities Quick Preview */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Initial Capabilities ({newRole})
                </span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                  {permissionCards.slice(0, 9).map((p) => {
                    const isAllowed = newPermissions[p.key];
                    return (
                      <label key={p.key} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          onChange={(e) =>
                            setNewPermissions((prev) => ({
                              ...prev,
                              [p.key]: e.target.checked,
                            }))
                          }
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className={isAllowed ? 'font-medium text-slate-800' : 'text-slate-400'}>
                          {p.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{createLoading ? 'Creating...' : 'Create Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
