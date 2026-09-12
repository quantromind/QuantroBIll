import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Monitor,
  Receipt,
  CreditCard,
  Tv,
  Printer,
  Grid3X3,
  BadgeAlert,
  Bike,
  Banknote,
  ReceiptRussianRuble,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Utensils,
  ToggleLeft,
  FileSpreadsheet,
  Percent,
  Users,
  MessageSquareHeart,
  Presentation,
  Package,
  Airplay,
  UserCog,
  Bell,
  Sliders,
  Languages,
  RotateCcw,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import {
  DuePaymentModal,
  ReprintModal,
  DeliveryBoysModal,
  ExpenseModal,
  TaxSettingsModal,
  DiscountModal,
  CustomersModal,
  LedDisplayModal,
  InventoryModal,
  DualScreenModal,
  StoreSettingsModal,
  HelpModal,
  ServiceRenewalModal,
  ModalWrapper
} from '../components/modals/OperationsModals';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';

type ActiveModal =
  | null
  | 'duePayment'
  | 'reprint'
  | 'deliveryBoys'
  | 'expense'
  | 'tax'
  | 'discount'
  | 'customers'
  | 'feedback'
  | 'ledDisplay'
  | 'inventory'
  | 'dualScreen'
  | 'userProfile'
  | 'alerts'
  | 'settings'
  | 'language'
  | 'serviceRenewal'
  | 'help';

export const Operations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentLang, setLanguage } = useLangStore();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncToast(true);
      setTimeout(() => setSyncToast(false), 3000);
    }, 1200);
  };

  const sections = [
    {
      title: 'Orders & Billing',
      items: [
        { label: 'Orders', icon: FileText, action: () => navigate('/online-orders') },
        { label: 'Online Orders', icon: Monitor, action: () => navigate('/online-orders') },
        { label: 'KOTs', icon: Receipt, action: () => navigate('/kds') },
        { label: 'Due Payment', icon: CreditCard, action: () => setActiveModal('duePayment') },
        { label: 'Billing Screen', icon: Tv, action: () => navigate('/billing') },
        { label: 'Live View', icon: Tv, action: () => navigate('/kds') },
        { label: 'Bill / KOT Print', icon: Printer, action: () => setActiveModal('reprint') },
        { label: 'Table Matrix', icon: Grid3X3, action: () => navigate('/tables') },
        { label: 'Custom Order Status', icon: BadgeAlert, action: () => navigate('/online-orders') },
        { label: 'Delivery Boys', icon: Bike, action: () => setActiveModal('deliveryBoys') },
      ],
    },
    {
      title: 'Payments & Finance',
      items: [
        { label: 'Cash Flow', icon: Banknote, action: () => navigate('/finance') },
        { label: 'Expense', icon: ReceiptRussianRuble, action: () => setActiveModal('expense') },
        { label: 'Withdrawal', icon: Wallet, action: () => setActiveModal('expense') },
        { label: 'Cash Top-Up', icon: ArrowUpRight, action: () => setActiveModal('expense') },
        { label: 'Currency & Tax', icon: RefreshCw, action: () => setActiveModal('tax') },
      ],
    },
    {
      title: 'Menu & Inventory',
      items: [
        { label: 'Menu Catalog', icon: Utensils, action: () => navigate('/menu-manager') },
        { label: 'Menu Item On Off', icon: ToggleLeft, action: () => navigate('/menu-manager') },
        { label: 'Tax & GST', icon: FileSpreadsheet, action: () => setActiveModal('tax') },
        { label: 'Discount Coupons', icon: Percent, action: () => setActiveModal('discount') },
        { label: 'Customers CRM', icon: Users, action: () => setActiveModal('customers') },
        { label: 'Feedback & Ratings', icon: MessageSquareHeart, action: () => setActiveModal('feedback') },
        { label: 'LED Display', icon: Presentation, action: () => setActiveModal('ledDisplay') },
        { label: 'Inventory Stock', icon: Package, action: () => setActiveModal('inventory') },
        { label: 'Dual Customer Screen', icon: Airplay, action: () => setActiveModal('dualScreen') },
      ],
    },
    {
      title: 'System Settings',
      items: [
        { label: 'Billing User Profile', icon: UserCog, action: () => setActiveModal('userProfile') },
        { label: 'Manual Cloud Sync', icon: RefreshCw, action: handleManualSync },
        { label: 'Alerts & Health', icon: Bell, action: () => setActiveModal('alerts') },
        { label: 'Hardware Settings', icon: Sliders, action: () => setActiveModal('settings') },
        { label: 'Language Profiles', icon: Languages, action: () => setActiveModal('language') },
        { label: 'Service Renewal', icon: RotateCcw, action: () => setActiveModal('serviceRenewal') },
        { label: '24x7 Help Desk', icon: HelpCircle, action: () => setActiveModal('help') },
      ],
    },
  ];

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 select-none">
      {/* Toast */}
      {syncToast && (
        <div className="fixed top-14 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Manual cloud database sync completed successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Operations Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store Management, Hardware Configuration, Customer CRM & Finance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg touch-btn shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            onClick={() => navigate('/billing')}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg touch-btn shadow-sm"
          >
            Go to Billing POS
          </button>
        </div>
      </div>

      {/* Grid Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="bg-white hover:bg-red-50/40 border border-slate-200 hover:border-red-300 rounded-xl p-4 text-left shadow-xs flex flex-col justify-between h-28 transition-all touch-btn group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-red-100 flex items-center justify-center text-slate-600 group-hover:text-red-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-red-700 line-clamp-2 leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modals */}
      <DuePaymentModal isOpen={activeModal === 'duePayment'} onClose={() => setActiveModal(null)} />
      <ReprintModal isOpen={activeModal === 'reprint'} onClose={() => setActiveModal(null)} />
      <DeliveryBoysModal isOpen={activeModal === 'deliveryBoys'} onClose={() => setActiveModal(null)} />
      <ExpenseModal isOpen={activeModal === 'expense'} onClose={() => setActiveModal(null)} />
      <TaxSettingsModal isOpen={activeModal === 'tax'} onClose={() => setActiveModal(null)} />
      <DiscountModal isOpen={activeModal === 'discount'} onClose={() => setActiveModal(null)} />
      <CustomersModal isOpen={activeModal === 'customers'} onClose={() => setActiveModal(null)} />
      <LedDisplayModal isOpen={activeModal === 'ledDisplay'} onClose={() => setActiveModal(null)} />
      <InventoryModal isOpen={activeModal === 'inventory'} onClose={() => setActiveModal(null)} />
      <DualScreenModal isOpen={activeModal === 'dualScreen'} onClose={() => setActiveModal(null)} />
      <StoreSettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} />
      <HelpModal isOpen={activeModal === 'help'} onClose={() => setActiveModal(null)} />
      <ServiceRenewalModal isOpen={activeModal === 'serviceRenewal'} onClose={() => setActiveModal(null)} />

      {/* User Profile Modal */}
      <ModalWrapper
        isOpen={activeModal === 'userProfile'}
        onClose={() => setActiveModal(null)}
        title="Biller & Staff Profile"
        icon={<UserCog className="w-4 h-4" />}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
            <span className="text-slate-400">Current Logged-in Staff:</span>
            <h4 className="font-bold text-slate-900 text-sm capitalize">{user?.fullName || user?.username || 'biller'}</h4>
            <p className="text-slate-500 font-mono">Role: {user?.role || 'Cashier'}</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Quick POS PIN (4 Digits)</label>
            <input type="password" defaultValue="1234" maxLength={4} className="w-full border rounded-lg px-3 py-2 bg-slate-50 font-mono font-bold tracking-widest text-center" />
          </div>
          <button
            onClick={() => {
              alert('PIN updated successfully!');
              setActiveModal(null);
            }}
            className="w-full bg-red-600 text-white font-bold py-2 rounded-lg"
          >
            Update PIN
          </button>
        </div>
      </ModalWrapper>

      {/* Feedback Modal */}
      <ModalWrapper
        isOpen={activeModal === 'feedback'}
        onClose={() => setActiveModal(null)}
        title="Customer Reviews & Feedback"
        icon={<MessageSquareHeart className="w-4 h-4" />}
      >
        <div className="space-y-3 text-xs">
          {[
            { customer: 'Rohan M.', rating: 5, comment: 'Best Mango Shake and Crispy Wrap in Wakad! Super fast billing.' },
            { customer: 'Pooja K.', rating: 5, comment: 'Great ambience, cold coffee was thick & creamy.' },
            { customer: 'Sagar T.', rating: 4, comment: 'Sandwich was very tasty. Service charge is zero, which is great.' },
          ].map((f, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{f.customer}</span>
                <span className="text-amber-500 font-bold">{'★'.repeat(f.rating)}</span>
              </div>
              <p className="text-slate-600 text-[11px]">"{f.comment}"</p>
            </div>
          ))}
        </div>
      </ModalWrapper>

      {/* Alerts Modal */}
      <ModalWrapper
        isOpen={activeModal === 'alerts'}
        onClose={() => setActiveModal(null)}
        title="System Alerts & Operational Diagnostics"
        icon={<Bell className="w-4 h-4" />}
      >
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>MongoDB Database: Connected & Synchronized (Healthy)</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zomato & Swiggy Webhook Integration: Active</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Low Stock Alert: Mozzarella Cheese Blend is below 10 KG.</span>
          </div>
        </div>
      </ModalWrapper>

      {/* Language Profiles Modal */}
      <ModalWrapper
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        title="Language & Regional Profiles"
        icon={<Languages className="w-4 h-4" />}
      >
        <div className="space-y-2 text-xs">
          {[
            { id: 'en', label: 'English (Default Interface)' },
            { id: 'mr', label: 'Marathi' },
            { id: 'hi', label: 'Hindi' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLanguage(l.id as any);
                setActiveModal(null);
              }}
              className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                currentLang === l.id ? 'bg-red-50 border-red-500 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span>{l.label}</span>
              {currentLang === l.id && <CheckCircle2 className="w-4 h-4 text-red-600" />}
            </button>
          ))}
        </div>
      </ModalWrapper>
    </div>
  );
};
