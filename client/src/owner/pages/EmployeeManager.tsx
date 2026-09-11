import React, { useState } from 'react';
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
} from 'lucide-react';
import type { OwnerEmployee } from '../types';

export const EmployeeManager: React.FC = () => {
  // Initial Employee roster matching Screenshot 3
  const [employees, setEmployees] = useState<OwnerEmployee[]>([
    {
      id: 'e-1',
      name: 'raju',
      menuCode: 'ra91@',
      contact: '9876543210',
      password: 'password123',
      role: 'Waiter',
      isActiveNow: false,
      lastActive: 'Logged Out 26 days ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-2',
      name: 'naveenk',
      menuCode: 'na91@',
      contact: '9876543211',
      password: 'pass456',
      role: 'Cashier',
      isActiveNow: false,
      lastActive: 'Logged Out 4 months ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: true, takeAwayCounters: 5, homeDelivery: true, homeDeliveryZones: 10 },
      permissions: {
        orders: true, fineDine: true, qsr: true, foodCourt: true, restroBar: true,
        recents: true, bakery: true, salesHistory: true, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-3',
      name: 'Chid1234',
      menuCode: 'ch91@',
      contact: '9876543212',
      password: 'pass789',
      role: 'Captain',
      isActiveNow: false,
      lastActive: 'Logged Out 3 months ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-4',
      name: 'Harini',
      menuCode: 'ha91@',
      contact: '9876543213',
      password: 'pass101',
      role: 'Cashier',
      isActiveNow: false,
      lastActive: 'Logged Out 4 days ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: true, takeAwayCounters: 5, homeDelivery: true, homeDeliveryZones: 10 },
      permissions: {
        orders: true, fineDine: true, qsr: true, foodCourt: true, restroBar: true,
        recents: true, bakery: true, salesHistory: true, reports: true, expenses: true,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-5',
      name: 'Nushrath',
      menuCode: 'la91@',
      contact: '9000000000',
      password: 'c12345',
      role: 'Manager',
      isActiveNow: false,
      lastActive: 'Logged Out 7 days ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: true, takeAwayCounters: 5, homeDelivery: true, homeDeliveryZones: 10 },
      permissions: {
        orders: true, fineDine: true, qsr: true, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: true, reports: true, expenses: true,
        inventory: false, kitchen: false, menu: false, settings: true, help: true,
      },
    },
    {
      id: 'e-6',
      name: 'gayathri',
      menuCode: 'ga91@',
      contact: '9876543215',
      password: 'pass202',
      role: 'Waiter',
      isActiveNow: true,
      lastActive: 'Active now',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-7',
      name: 'Nizam',
      menuCode: 'ni91@',
      contact: '9876543216',
      password: 'pass303',
      role: 'Chef',
      isActiveNow: false,
      lastActive: 'Logged Out 1 month ago',
      allowedSections: { fineDine: false, fineDineTables: 0, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: false, fineDine: false, qsr: false, foodCourt: false, restroBar: false,
        recents: false, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: true, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-8',
      name: 'TEST2',
      menuCode: 'te91@',
      contact: '9876543217',
      password: 'pass404',
      role: 'Waiter',
      isActiveNow: true,
      lastActive: 'Active now',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-9',
      name: 'waiter1',
      menuCode: 'w191@',
      contact: '9876543218',
      password: 'pass505',
      role: 'Waiter',
      isActiveNow: false,
      lastActive: 'Logged Out 1 month ago',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
    {
      id: 'e-10',
      name: 'waiter2',
      menuCode: 'w291@',
      contact: '9876543219',
      password: 'pass606',
      role: 'Waiter',
      isActiveNow: true,
      lastActive: 'Active now',
      allowedSections: { fineDine: true, fineDineTables: 23, takeAway: false, takeAwayCounters: 0, homeDelivery: false, homeDeliveryZones: 0 },
      permissions: {
        orders: true, fineDine: true, qsr: false, foodCourt: false, restroBar: false,
        recents: true, bakery: false, salesHistory: false, reports: false, expenses: false,
        inventory: false, kitchen: false, menu: false, settings: false, help: true,
      },
    },
  ]);

  // Selected employee (Default to Nushrath as shown in Screenshot 3)
  const [selectedEmpId, setSelectedEmpId] = useState<string>('e-5');
  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Editable Form fields for selected employee
  const [editName, setEditName] = useState(selectedEmployee?.name || '');
  const [editMenuCode, setEditMenuCode] = useState(selectedEmployee?.menuCode || '');
  const [editContact, setEditContact] = useState(selectedEmployee?.contact || '');
  const [editPassword, setEditPassword] = useState(selectedEmployee?.password || '');
  const [savedAlert, setSavedAlert] = useState(false);

  // Sync edit form when selected employee changes
  const handleSelectEmployee = (emp: OwnerEmployee) => {
    setSelectedEmpId(emp.id);
    setEditName(emp.name);
    setEditMenuCode(emp.menuCode);
    setEditContact(emp.contact);
    setEditPassword(emp.password || '');
    setSavedAlert(false);
  };

  // Toggle single permission
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

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === selectedEmpId) {
          return {
            ...emp,
            name: editName,
            menuCode: editMenuCode,
            contact: editContact,
            password: editPassword,
          };
        }
        return emp;
      })
    );
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  // 15 Permissions definitions exactly matching Screenshot 3
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Employee Login & Access Matrix</h1>
          <p className="text-[11px] text-slate-400">
            Configure staff credentials, allowed section tables and individual module permissions.
          </p>
        </div>

        {savedAlert && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            ✓ Updated Successfully!
          </span>
        )}
      </div>

      {/* Main Split Layout: Left Staff List (1 Col), Right Permissions Grid (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Employee Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Staff Members</span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {employees.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {employees.map((emp) => {
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
            })}
          </div>
        </div>

        {/* Right Panel: Employee Details & 15 Permission Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Form: Menu Code, Username, Contact, Password & Section Assignment */}
          <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Menu Code
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
                  User Name
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
                  User Contact
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
                  Password
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Allowed Sections Selector & UPDATE Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SECTIONS:</span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                  FINE DINE - 23 • TAKE AWAY - 5 • HOME DELIVERY - 10
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-sm shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>UPDATE CREDENTIALS</span>
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
              <span className="text-[10px] text-slate-400">Click any card to toggle access</span>
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
        </div>
      </div>
    </div>
  );
};
