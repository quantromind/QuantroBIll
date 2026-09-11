import React from 'react';
import {
  Settings2,
  Printer,
  FileText,
  ReceiptText,
  XCircle,
  RotateCcw,
  Eye,
  ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useReceiptSettingsStore, type ReceiptSettings as IReceiptSettings } from '../store/receiptSettingsStore';
import { useAuthStore } from '../store/authStore';

/* ───────── Template Styles Config ───────── */

const INVOICE_TEMPLATES = [
  {
    id: 'classic' as const,
    name: 'Classic Thermal',
    badge: 'Standard',
    desc: 'Traditional receipt with dashed dividers & centered layout',
    icon: '🧾',
  },
  {
    id: 'modern' as const,
    name: 'Modern Clean',
    badge: 'Popular',
    desc: 'Boxed metadata pills, crisp solid lines & highlighted totals',
    icon: '📑',
  },
  {
    id: 'minimal' as const,
    name: 'Compact Eco',
    badge: 'Paper Saver',
    desc: 'Dense single-line format engineered to save roll paper',
    icon: '⚡',
  },
];

const KOT_TEMPLATES = [
  {
    id: 'standard' as const,
    name: 'Standard KOT',
    badge: 'Default',
    desc: 'Clean kitchen ticket with dashed sections & standard items',
    icon: '🎫',
  },
  {
    id: 'bold' as const,
    name: 'Bold Chef Display',
    badge: 'High Visibility',
    desc: 'Giant inverted table banner & high-contrast quantity boxes',
    icon: '👨‍🍳',
  },
  {
    id: 'compact' as const,
    name: 'Compact Express',
    badge: 'Quick Serve',
    desc: 'Dense multi-item slip optimized for high-speed kitchen lines',
    icon: '⚡',
  },
];

/* ───────── tiny helpers ───────── */

const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
    <span className="text-base">{icon}</span>
    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">{title}</span>
  </div>
);

const FontSizeSelect: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-700 font-bold w-16 focus:outline-none focus:border-red-500"
  >
    {[9, 10, 11, 12, 13, 14, 15, 16].map((s) => (
      <option key={s} value={s}>
        {s} px
      </option>
    ))}
  </select>
);

const BoldButton: React.FC<{
  active: boolean;
  onClick: () => void;
}> = ({ active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-black touch-btn transition-colors ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100'
    }`}
    title="Toggle Bold"
  >
    B
  </button>
);

const UppercaseButton: React.FC<{
  active: boolean;
  onClick: () => void;
}> = ({ active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] font-black touch-btn transition-colors ${
      active
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100'
    }`}
    title="Toggle Uppercase"
  >
    AA
  </button>
);

/* ───────── Toggle Row wrapper ───────── */

interface ToggleRowProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  badge?: string;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, enabled, onToggle, children, badge }) => (
  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
    <div className="flex items-center space-x-2.5 min-w-0">
      <ToggleSwitch enabled={enabled} onChange={onToggle} size="sm" />
      <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{label}</span>
      {badge && (
        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
    {children && <div className="flex items-center space-x-1.5 shrink-0">{children}</div>}
  </div>
);

/* ───────── SAMPLE DATA for preview ───────── */

const SAMPLE_ITEMS = [
  {
    name: 'Chicken Biryani',
    variant: '(Half)',
    qty: 2,
    price: 120.0,
    total: 260.0,
    addons: 'Extra Raita (₹20.00)',
    note: 'No onion',
    isVeg: false,
  },
  {
    name: 'Margherita Pizza',
    variant: '(Single)',
    qty: 1,
    price: 180.0,
    total: 180.0,
    addons: null,
    note: null,
    isVeg: true,
  },
  {
    name: 'Green Salad',
    variant: null,
    qty: 1,
    price: 60.0,
    total: 70.0,
    addons: 'Mayo (₹10.00)',
    note: null,
    isVeg: true,
  },
];

const SAMPLE_SUBTOTAL = 510.0;
const SAMPLE_CGST = 12.75;
const SAMPLE_SGST = 12.75;
const SAMPLE_GRAND = 480;

/* ───────── Preview Width Config ───────── */

const WIDTH_OPTIONS: { value: IReceiptSettings['previewWidth']; label: string }[] = [
  { value: 48, label: '48mm' },
  { value: 58, label: '58mm' },
  { value: 75, label: '75mm' },
  { value: 78, label: '78mm' },
  { value: 80, label: '80mm' },
];

const widthToPx = (mm: number): number => {
  const map: Record<number, number> = { 48: 220, 58: 260, 75: 300, 78: 310, 80: 320 };
  return map[mm] ?? 300;
};

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */

export const ReceiptSettings: React.FC = () => {
  const store = useReceiptSettingsStore();
  const { activeOutlet, tenant } = useAuthStore();

  const tabs: { id: IReceiptSettings['activeTab']; label: string; icon: React.ReactNode }[] = [
    { id: 'printer', label: 'Printer Settings', icon: <Printer className="w-3.5 h-3.5" /> },
    { id: 'kot', label: 'KOT Template', icon: <ReceiptText className="w-3.5 h-3.5" /> },
    { id: 'invoice', label: 'Invoice Template', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'cancelKot', label: 'Cancel KOT Template', icon: <XCircle className="w-3.5 h-3.5" /> },
  ];

  /* ─── Logo upload handlers ─── */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        store.setField('logoDataUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    store.setField('logoDataUrl', '');
  };

  /* ─── derived values for preview ─── */
  const outletName = store.customRestaurantName || activeOutlet?.name || tenant?.businessName || 'SAMPLE RESTAURANT';
  const address1 = store.addressLine1 || activeOutlet?.address || '123 Main Street, Locality';
  const address2 = store.addressLine2 || 'City, State - 300001';
  const phone = store.contactNumber || activeOutlet?.phone || '+91 98765 43210';
  const gstin = store.gstinNumber || '33AAAAA0000A1U';
  const fssai = store.fssaiNumber || '12345678901234';
  const email = store.emailAddress || 'contact@myrestaurant.com';
  const website = store.websiteUrl || 'www.myrestaurant.com';
  const curr = store.currencySymbol || '₹';
  const upiId = store.upiId || 'petbharkhao@upi';

  const previewPx = widthToPx(store.previewWidth);

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none bg-[#f1f5f9]">
      {/* ════ Page Header ════ */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900">Cashier Settings</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Printers & Templates Configuration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={store.resetToDefaults}
            className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg touch-btn shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* ════ Tab Bar ════ */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center space-x-1.5 overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => store.setField('activeTab', tab.id)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap touch-btn transition-all ${
              store.activeTab === tab.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════ Main Content (3 columns) ════ */}
      {store.activeTab === 'invoice' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* ──── LEFT: Store Info Section ──── */}
          <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            <SectionHeader icon="🏪" title="Store Info Section" />

            {/* Logo */}
            <ToggleRow label="Logo" enabled={store.showLogo} onToggle={() => store.toggleField('showLogo')}>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 font-semibold">W</span>
                <input
                  type="number"
                  value={store.logoWidth}
                  onChange={(e) => store.setField('logoWidth', Number(e.target.value))}
                  className="w-12 text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold bg-white focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 font-semibold">H</span>
                <input
                  type="number"
                  value={store.logoHeight}
                  onChange={(e) => store.setField('logoHeight', Number(e.target.value))}
                  className="w-12 text-[11px] border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold bg-white focus:outline-none focus:border-red-500"
                />
              </div>
            </ToggleRow>

            {/* Logo Upload Sub-panel */}
            {store.showLogo && (
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                {store.logoDataUrl ? (
                  <div className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="w-12 h-12 bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={store.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Custom Logo</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 inline" /> Active on Receipt
                      </p>
                    </div>
                    <label className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded cursor-pointer transition-colors shadow-xs">
                      Change
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-lg cursor-pointer bg-white hover:bg-red-50/20 transition-all group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors mb-1" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-red-600">
                      Upload Restaurant Logo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or SVG (Max 2MB)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                )}
              </div>
            )}

            {/* Restaurant Name */}
            <ToggleRow
              label="Restaurant Name"
              enabled={store.showRestaurantName}
              onToggle={() => store.toggleField('showRestaurantName')}
            >
              <BoldButton
                active={store.restaurantNameBold}
                onClick={() => store.toggleField('restaurantNameBold')}
              />
              <FontSizeSelect
                value={store.restaurantNameSize}
                onChange={(v) => store.setField('restaurantNameSize', v)}
              />
            </ToggleRow>
            <div className="px-4 py-2 border-b border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Display Name (Editable)
              </label>
              <input
                type="text"
                placeholder={activeOutlet?.name || tenant?.businessName || 'e.g. My Restaurant'}
                value={store.customRestaurantName}
                onChange={(e) => store.setField('customRestaurantName', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Store Address */}
            <ToggleRow
              label="Store Address"
              enabled={store.showAddress}
              onToggle={() => store.toggleField('showAddress')}
            />
            <div className="px-4 py-1 space-y-1 border-b border-slate-100">
              <input
                type="text"
                placeholder="Address Line 1"
                value={store.addressLine1}
                onChange={(e) => store.setField('addressLine1', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Address Line 2"
                value={store.addressLine2}
                onChange={(e) => store.setField('addressLine2', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* GSTIN */}
            <ToggleRow label="GSTIN Number" enabled={store.showGSTIN} onToggle={() => store.toggleField('showGSTIN')} />
            <div className="px-4 py-1.5 border-b border-slate-100">
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1U"
                value={store.gstinNumber}
                onChange={(e) => store.setField('gstinNumber', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* FSSAI */}
            <ToggleRow
              label="FSSAI License"
              enabled={store.showFSSAI}
              onToggle={() => store.toggleField('showFSSAI')}
            />
            <div className="px-4 py-1.5 border-b border-slate-100">
              <input
                type="text"
                placeholder="e.g. 12345678901234"
                value={store.fssaiNumber}
                onChange={(e) => store.setField('fssaiNumber', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Contact Number */}
            <ToggleRow
              label="Contact Number"
              enabled={store.showContactNumber}
              onToggle={() => store.toggleField('showContactNumber')}
            />
            <div className="px-4 py-1.5 border-b border-slate-100">
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={store.contactNumber}
                onChange={(e) => store.setField('contactNumber', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Email */}
            <ToggleRow label="Email ID" enabled={store.showEmail} onToggle={() => store.toggleField('showEmail')} />
            <div className="px-4 py-1.5 border-b border-slate-100">
              <input
                type="email"
                placeholder="e.g. contact@myrestaurant.com"
                value={store.emailAddress}
                onChange={(e) => store.setField('emailAddress', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Website Link */}
            <ToggleRow
              label="Website Link"
              enabled={store.showWebsiteLink}
              onToggle={() => store.toggleField('showWebsiteLink')}
            />
            <div className="px-4 py-1.5 border-b border-slate-100">
              <input
                type="url"
                placeholder="e.g. www.myrestaurant.com"
                value={store.websiteUrl}
                onChange={(e) => store.setField('websiteUrl', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* ── SUMMARY & TAX TOTALS ── */}
            <SectionHeader icon="💲" title="Summary & Tax Totals" />

            {/* Tax Calculation Mode */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Tax Calculation Mode</span>
              <select
                value={store.taxCalculationMode}
                onChange={(e) =>
                  store.setField('taxCalculationMode', e.target.value as 'inclusive' | 'exclusive')
                }
                className="text-[11px] border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 font-bold focus:outline-none focus:border-red-500"
              >
                <option value="inclusive">Inclusive (Show Tax Breakdown)</option>
                <option value="exclusive">Exclusive (Tax Extra)</option>
              </select>
            </div>

            {/* Currency Symbol */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Currency Symbol</span>
              <input
                type="text"
                value={store.currencySymbol}
                onChange={(e) => store.setField('currencySymbol', e.target.value)}
                className="w-16 text-xs text-center border border-slate-300 rounded px-2 py-1 bg-white font-bold focus:outline-none focus:border-red-500"
                placeholder="₹"
              />
            </div>

            <ToggleRow
              label="Total Quantity"
              enabled={store.showTotalQuantity}
              onToggle={() => store.toggleField('showTotalQuantity')}
            />

            <ToggleRow
              label="Member Count"
              enabled={store.showMemberCount}
              onToggle={() => store.toggleField('showMemberCount')}
            />

            {/* ── FOOTER, FONT & MARGINS ── */}
            <SectionHeader icon="🖨️" title="Footer, Font & Margins" />

            {/* Footer Message */}
            <ToggleRow
              label="Footer Message"
              enabled={store.showFooterMessage}
              onToggle={() => store.toggleField('showFooterMessage')}
            >
              <BoldButton
                active={store.footerMessageBold}
                onClick={() => store.toggleField('footerMessageBold')}
              />
              <FontSizeSelect
                value={store.footerMessageSize}
                onChange={(v) => store.setField('footerMessageSize', v)}
              />
            </ToggleRow>
            {store.showFooterMessage && (
              <div className="px-4 py-1.5 border-b border-slate-100">
                <input
                  type="text"
                  value={store.thankYouText}
                  onChange={(e) => store.setField('thankYouText', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500 text-center font-semibold"
                  placeholder="*** Thank You! Visit Again ***"
                />
              </div>
            )}

            <ToggleRow
              label="UPI QR Code"
              enabled={store.showUPIQR}
              onToggle={() => store.toggleField('showUPIQR')}
            />
            {store.showUPIQR && (
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  UPI ID / VPA for QR Code
                </label>
                <div className="flex items-center space-x-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. restaurant@upi"
                    value={store.upiId}
                    onChange={(e) => store.setField('upiId', e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            )}

            <ToggleRow
              label="Powered By PetBharke"
              enabled={store.showPoweredBy}
              onToggle={() => store.toggleField('showPoweredBy')}
            />

            {/* Bottom spacer */}
            <div className="h-8 shrink-0" />
          </div>

          {/* ──── CENTER: Invoice Details Header + Customer Info + Items Table Formatting ──── */}
          <div className="w-96 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            {/* ── Receipt Template Style Selector ── */}
            <SectionHeader icon="🎨" title="Receipt Template Style" />
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {INVOICE_TEMPLATES.map((tmpl) => {
                  const isSelected = store.invoiceTemplateStyle === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => store.setField('invoiceTemplateStyle', tmpl.id)}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-red-600 bg-white shadow-sm ring-2 ring-red-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl mb-1">{tmpl.icon}</span>
                      <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                        {tmpl.name}
                      </span>
                      <span
                        className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tmpl.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                {INVOICE_TEMPLATES.find((t) => t.id === store.invoiceTemplateStyle)?.desc}
              </p>
            </div>

            <SectionHeader icon="📄" title="Invoice Details Header" />

            {/* Invoice Title */}
            <ToggleRow
              label="Invoice Title"
              enabled={store.showInvoiceTitle}
              onToggle={() => store.toggleField('showInvoiceTitle')}
            >
              <BoldButton
                active={store.invoiceTitleBold}
                onClick={() => store.toggleField('invoiceTitleBold')}
              />
              <FontSizeSelect
                value={store.invoiceTitleSize}
                onChange={(v) => store.setField('invoiceTitleSize', v)}
              />
              <input
                type="text"
                value={store.invoiceTitle}
                onChange={(e) => store.setField('invoiceTitle', e.target.value)}
                className="w-24 text-[11px] border border-slate-300 rounded px-2 py-1 bg-white font-bold text-center uppercase focus:outline-none focus:border-red-500"
              />
            </ToggleRow>

            {/* Bill No */}
            <ToggleRow
              label="Bill No."
              enabled={store.showBillNo}
              onToggle={() => store.toggleField('showBillNo')}
            />

            {/* Token No */}
            <ToggleRow
              label="Token No."
              enabled={store.showTokenNo}
              onToggle={() => store.toggleField('showTokenNo')}
            />

            {/* Date */}
            <ToggleRow
              label="Date"
              enabled={store.showDate}
              onToggle={() => store.toggleField('showDate')}
            >
              <select
                value={store.dateFormat}
                onChange={(e) => store.setField('dateFormat', e.target.value)}
                className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white text-slate-700 font-bold focus:outline-none focus:border-red-500"
              >
                <option value="DD/MM/YY">DD/MM/YY</option>
                <option value="MM/DD/YY">MM/DD/YY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YY HH:mm">DD/MM/YY HH:mm</option>
              </select>
            </ToggleRow>

            {/* Time Toggle (sub-option of Date) */}
            {store.showDate && (
              <div className="pl-10 pr-4 py-1.5 border-b border-slate-100 flex items-center space-x-2">
                <ToggleSwitch
                  enabled={store.showTime}
                  onChange={() => store.toggleField('showTime')}
                  size="sm"
                />
                <span className="text-[11px] text-slate-500 font-semibold">Show Time</span>
              </div>
            )}

            {/* Order Type / Table */}
            <ToggleRow
              label="Order Type / Table"
              enabled={store.showOrderType}
              onToggle={() => store.toggleField('showOrderType')}
            />

            {/* Table No */}
            <ToggleRow
              label="Table No."
              enabled={store.showTableNo}
              onToggle={() => store.toggleField('showTableNo')}
            />

            {/* Order By */}
            <ToggleRow
              label="Order By"
              enabled={store.showOrderBy}
              onToggle={() => store.toggleField('showOrderBy')}
              badge="Dine-in only"
            />

            {/* Info Row Style */}
            <ToggleRow label="Info Row Style" enabled={true} onToggle={() => {}}>
              <BoldButton
                active={store.infoRowBold}
                onClick={() => store.toggleField('infoRowBold')}
              />
              <FontSizeSelect
                value={store.infoRowSize}
                onChange={(v) => store.setField('infoRowSize', v)}
              />
              <span className="text-[10px] text-slate-400 italic whitespace-nowrap">Applies to the fields above</span>
            </ToggleRow>

            {/* ── Customer Info Sub-section ── */}
            <SectionHeader icon="👤" title="Customer Info Section" />

            <ToggleRow
              label="Show Note"
              enabled={store.showOrderNote}
              onToggle={() => store.toggleField('showOrderNote')}
            >
              <BoldButton
                active={store.orderNoteBold}
                onClick={() => store.toggleField('orderNoteBold')}
              />
              <FontSizeSelect
                value={store.orderNoteSize}
                onChange={(v) => store.setField('orderNoteSize', v)}
              />
              <input
                type="text"
                value={store.orderNoteLabel}
                onChange={(e) => store.setField('orderNoteLabel', e.target.value)}
                className="w-24 text-[11px] border border-slate-300 rounded px-2 py-1 bg-white font-semibold focus:outline-none focus:border-red-500"
                placeholder="Label text"
              />
            </ToggleRow>

            <ToggleRow
              label="Customer Name"
              enabled={store.showCustomerName}
              onToggle={() => store.toggleField('showCustomerName')}
            />

            <ToggleRow
              label="Customer Phone"
              enabled={store.showCustomerPhone}
              onToggle={() => store.toggleField('showCustomerPhone')}
            />

            <ToggleRow
              label="Customer Address"
              enabled={store.showCustomerAddress}
              onToggle={() => store.toggleField('showCustomerAddress')}
            />

            {/* ── Items Table Formatting ── */}
            <SectionHeader icon="🍽️" title="Items Table Formatting" />

            <ToggleRow label="Item Names" enabled={true} onToggle={() => {}}>
              <BoldButton
                active={store.itemNameBold}
                onClick={() => store.toggleField('itemNameBold')}
              />
              <FontSizeSelect
                value={store.itemNameSize}
                onChange={(v) => store.setField('itemNameSize', v)}
              />
              <UppercaseButton
                active={store.itemNameUppercase}
                onClick={() => store.toggleField('itemNameUppercase')}
              />
            </ToggleRow>

            <ToggleRow
              label="Size / Variant"
              enabled={store.showItemVariant}
              onToggle={() => store.toggleField('showItemVariant')}
            />

            <ToggleRow
              label="Item Add-ons"
              enabled={store.showItemAddons}
              onToggle={() => store.toggleField('showItemAddons')}
            />

            <ToggleRow
              label="Item Instructions"
              enabled={store.showItemNote}
              onToggle={() => store.toggleField('showItemNote')}
            >
              <BoldButton
                active={store.itemNoteBold}
                onClick={() => store.toggleField('itemNoteBold')}
              />
              <FontSizeSelect
                value={store.itemNoteSize}
                onChange={(v) => store.setField('itemNoteSize', v)}
              />
            </ToggleRow>

            <ToggleRow
              label="Item Price"
              enabled={store.showItemPrice}
              onToggle={() => store.toggleField('showItemPrice')}
            />

            {/* Bottom spacer */}
            <div className="h-8 shrink-0" />
          </div>

          {/* ──── RIGHT: Live Preview ──── */}
          <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto">
            {/* Width & Style Selector Bar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Width</span>
                <div className="flex items-center space-x-1">
                  {WIDTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => store.setField('previewWidth', opt.value)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold touch-btn transition-all ${
                        store.previewWidth === opt.value
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Template Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                {INVOICE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => store.setField('invoiceTemplateStyle', tmpl.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all ${
                      store.invoiceTemplateStyle === tmpl.id
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Label */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold text-slate-700 uppercase">Invoice Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  {store.previewWidth}MM
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                  {store.invoiceTemplateStyle} Style
                </span>
              </div>
            </div>

            {/* ═══ The Receipt Preview ═══ */}
            <div className="px-4 pb-8 flex justify-center">
              {/* ── TEMPLATE 1: MODERN CLEAN ── */}
              {store.invoiceTemplateStyle === 'modern' ? (
                <div
                  className="bg-white border border-slate-200 shadow-xl rounded-lg font-sans text-slate-800 transition-all duration-300"
                  style={{ width: previewPx, minHeight: 400, padding: '16px 14px' }}
                >
                  {/* Modern Header */}
                  <div className="text-center pb-2.5 border-b border-slate-200">
                    {store.showLogo && (
                      <div className="flex justify-center mb-2">
                        {store.logoDataUrl ? (
                          <img
                            src={store.logoDataUrl}
                            alt="Logo"
                            className="object-contain"
                            style={{ width: store.logoWidth * 0.6, maxHeight: store.logoHeight * 0.6 }}
                          />
                        ) : (
                          <div
                            className="bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400"
                            style={{ width: store.logoWidth * 0.6, height: store.logoHeight * 0.6 }}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    )}

                    {store.showRestaurantName && (
                      <h2
                        className="tracking-tight text-slate-900 leading-tight"
                        style={{
                          fontSize: store.restaurantNameSize * 0.78,
                          fontWeight: store.restaurantNameBold ? 900 : 700,
                        }}
                      >
                        {outletName}
                      </h2>
                    )}

                    {store.showAddress && (
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                        {address1} {address2 && `• ${address2}`}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-x-2 text-[9px] text-slate-500 mt-0.5">
                      {store.showContactNumber && <span>📞 {phone}</span>}
                      {store.showEmail && <span>✉ {email}</span>}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-2 text-[9px] text-slate-600 mt-0.5 font-semibold">
                      {store.showGSTIN && <span>GSTIN: {gstin}</span>}
                      {store.showFSSAI && <span>FSSAI: {fssai}</span>}
                    </div>

                    {store.showWebsiteLink && (
                      <p className="text-[9px] text-red-600 font-semibold mt-0.5">{website}</p>
                    )}
                  </div>

                  {/* Modern Title Tag */}
                  {store.showInvoiceTitle && (
                    <div className="text-center py-2">
                      <span
                        className="inline-block bg-slate-100 text-slate-800 px-3 py-0.5 rounded-full uppercase tracking-widest text-[10px]"
                        style={{
                          fontSize: store.invoiceTitleSize * 0.75,
                          fontWeight: store.invoiceTitleBold ? 900 : 700,
                        }}
                      >
                        {store.invoiceTitle}
                      </span>
                    </div>
                  )}

                  {/* Modern Metadata Box */}
                  <div
                    className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-md my-1.5 space-y-1 text-slate-700"
                    style={{
                      fontSize: store.infoRowSize * 0.65,
                      fontWeight: store.infoRowBold ? 700 : 500,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        {store.showTableNo && (
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black">
                            TABLE 8
                          </span>
                        )}
                        {store.showTokenNo && (
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Token: 1, 2
                          </span>
                        )}
                      </div>
                      {store.showOrderType && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">
                          Dine-In
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[9px] text-slate-600">
                      {store.showBillNo && <span>Bill: #BILL-74</span>}
                      {store.showDate && (
                        <span>
                          {store.dateFormat === 'YYYY-MM-DD'
                            ? '2026/09/08'
                            : store.dateFormat === 'MM/DD/YY'
                            ? '09/08/26'
                            : '08/09/26'}
                          {store.showTime && ' • 17:05'}
                        </span>
                      )}
                    </div>

                    {(store.showCustomerName || store.showCustomerPhone) && (
                      <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                        {store.showCustomerName && <span>Guest: Walk-in</span>}
                        {store.showCustomerPhone && <span>+91 98765 43210</span>}
                      </div>
                    )}
                    {store.showOrderBy && (
                      <div className="text-[9px] text-slate-400">Biller: Cashier</div>
                    )}
                  </div>

                  {/* Modern Items Table */}
                  <div className="py-2 border-b border-slate-200">
                    <div
                      className="grid grid-cols-12 font-bold px-2 py-1 bg-slate-100 rounded text-slate-700 mb-1"
                      style={{ fontSize: store.itemFontSize * 0.7 }}
                    >
                      <span className="col-span-5">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      {store.showItemPrice && (
                        <>
                          <span className="col-span-2 text-right">Price</span>
                          <span className="col-span-3 text-right">Amount</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5 px-1">
                      {SAMPLE_ITEMS.map((item, idx) => (
                        <div key={idx} className="border-b border-slate-100 pb-1 last:border-b-0">
                          <div
                            className="grid grid-cols-12 items-center"
                            style={{ fontSize: store.itemFontSize * 0.7 }}
                          >
                            <span
                              className={`${store.showItemPrice ? 'col-span-5' : 'col-span-7'} font-medium leading-tight`}
                              style={{
                                fontWeight: store.itemNameBold ? 700 : 500,
                                fontSize: store.itemNameSize * 0.7,
                                textTransform: store.itemNameUppercase ? 'uppercase' : 'none',
                              }}
                            >
                              {item.name}
                              {store.showItemVariant && item.variant && (
                                <span className="block text-slate-400 text-[9px]">{item.variant}</span>
                              )}
                            </span>
                            <span className="col-span-2 text-center font-bold text-slate-800">
                              {item.qty}
                            </span>
                            {store.showItemPrice && (
                              <>
                                <span className="col-span-2 text-right text-slate-500">
                                  {curr}{item.price.toFixed(2)}
                                </span>
                                <span className="col-span-3 text-right font-bold text-slate-900">
                                  {curr}{item.total.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                          {store.showItemAddons && item.addons && (
                            <p className="text-[9px] text-slate-400 pl-1">+ {item.addons}</p>
                          )}
                          {store.showItemNote && item.note && (
                            <p
                              className="text-amber-700 pl-1 text-[9px] italic"
                              style={{
                                fontSize: store.itemNoteSize * 0.6,
                                fontWeight: store.itemNoteBold ? 700 : 400,
                              }}
                            >
                              * {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modern Totals & Grand Total Banner */}
                  <div className="py-2 space-y-1 text-[9px]">
                    {store.showSubTotal && (
                      <div className="flex justify-between text-slate-600">
                        <span>Sub Total:</span>
                        <span>{curr}{SAMPLE_SUBTOTAL.toFixed(2)}</span>
                      </div>
                    )}
                    {store.showTaxBreakdown && (
                      <>
                        <div className="flex justify-between text-slate-400">
                          <span>CGST (2.5%):</span>
                          <span>{curr}{SAMPLE_CGST.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>SGST (2.5%):</span>
                          <span>{curr}{SAMPLE_SGST.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {store.showDiscountRow && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount:</span>
                        <span>- {curr}0.00</span>
                      </div>
                    )}
                    {store.showRoundOff && (
                      <div className="flex justify-between text-slate-400">
                        <span>Round Off:</span>
                        <span>{curr}0.50</span>
                      </div>
                    )}

                    {/* Standout Grand Total Box */}
                    <div className="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-md mt-2 shadow-xs">
                      <span className="text-[10px] font-black tracking-wider uppercase">Grand Total</span>
                      <span className="text-sm font-black">{curr}{SAMPLE_GRAND.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Note */}
                  {store.showOrderNote && (
                    <div
                      className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 my-1.5"
                      style={{
                        fontSize: store.orderNoteSize * 0.65,
                        fontWeight: store.orderNoteBold ? 700 : 400,
                      }}
                    >
                      <span className="font-bold">{store.orderNoteLabel}:</span>
                      <p className="mt-0.5 italic">1. Less spicy please</p>
                    </div>
                  )}

                  {/* Modern QR Card */}
                  {store.showUPIQR && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-center my-2">
                      <div className="w-14 h-14 bg-white border border-slate-200 rounded mx-auto flex items-center justify-center p-1 mb-1 shadow-xs">
                        <div className="grid grid-cols-3 gap-0.5">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-xs ${
                                [0, 1, 2, 3, 5, 6, 8].includes(i) ? 'bg-slate-900' : 'bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-700">Scan & Pay via UPI</p>
                      <p className="text-[8px] font-mono text-slate-400">{upiId}</p>
                    </div>
                  )}

                  {/* Modern Footer */}
                  <div className="text-center pt-1 space-y-0.5">
                    {store.showFooterMessage && (
                      <p
                        className="text-slate-600 font-medium"
                        style={{
                          fontSize: store.footerMessageSize * 0.7,
                          fontWeight: store.footerMessageBold ? 700 : 400,
                        }}
                      >
                        {store.thankYouText}
                      </p>
                    )}
                    {store.showPoweredBy && (
                      <p className="text-[8px] text-slate-400">Powered by PetBharke POS</p>
                    )}
                  </div>
                </div>
              ) : store.invoiceTemplateStyle === 'minimal' ? (
                /* ── TEMPLATE 3: COMPACT ECO (Paper Saver) ── */
                <div
                  className="bg-white border border-slate-300 shadow-sm font-mono text-slate-900 transition-all duration-300"
                  style={{ width: previewPx, minHeight: 320, padding: '10px 8px' }}
                >
                  {/* Compact Header */}
                  <div className="text-center pb-1 border-b border-dotted border-slate-400">
                    {store.showLogo && store.logoDataUrl && (
                      <div className="flex justify-center mb-1">
                        <img
                          src={store.logoDataUrl}
                          alt="Logo"
                          className="object-contain"
                          style={{ width: store.logoWidth * 0.45, maxHeight: store.logoHeight * 0.45 }}
                        />
                      </div>
                    )}
                    {store.showRestaurantName && (
                      <h2
                        className="uppercase tracking-tight font-black leading-tight"
                        style={{ fontSize: store.restaurantNameSize * 0.7 }}
                      >
                        {outletName}
                      </h2>
                    )}
                    {store.showAddress && (
                      <p className="text-[8px] text-slate-600 truncate">{address1}</p>
                    )}
                    <div className="text-[8px] text-slate-600">
                      {store.showContactNumber && <span>{phone}</span>}
                      {store.showGSTIN && <span> • {gstin}</span>}
                    </div>
                  </div>

                  {/* Compact Info Line */}
                  <div className="py-1 border-b border-dotted border-slate-400 text-[8px] flex justify-between items-center">
                    <span>
                      {store.showTableNo && <strong>T-8 • </strong>}
                      {store.showOrderType && 'Dine-In • '}
                      {store.showBillNo && '#74'}
                    </span>
                    {store.showDate && <span>08/09 17:05</span>}
                  </div>

                  {/* Compact Single-line Items */}
                  <div className="py-1 border-b border-dotted border-slate-400 space-y-1">
                    {SAMPLE_ITEMS.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-baseline text-[9px]">
                        <span className="truncate pr-1">
                          <strong className="font-black">{item.qty}×</strong>{' '}
                          {store.itemNameUppercase ? item.name.toUpperCase() : item.name}
                          {store.showItemVariant && item.variant && ` ${item.variant}`}
                        </span>
                        {store.showItemPrice && (
                          <span className="font-bold shrink-0">{curr}{item.total.toFixed(0)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Compact Totals */}
                  <div className="py-1 border-b border-dotted border-slate-400 text-[9px] space-y-0.5">
                    {store.showSubTotal && (
                      <div className="flex justify-between text-slate-600 text-[8px]">
                        <span>Subtotal:</span>
                        <span>{curr}{SAMPLE_SUBTOTAL.toFixed(2)}</span>
                      </div>
                    )}
                    {store.showTaxBreakdown && (
                      <div className="flex justify-between text-slate-600 text-[8px]">
                        <span>GST:</span>
                        <span>{curr}{(SAMPLE_CGST + SAMPLE_SGST).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] font-black pt-0.5 border-t border-slate-800">
                      <span>TOTAL:</span>
                      <span>{curr}{SAMPLE_GRAND}</span>
                    </div>
                  </div>

                  {/* Compact QR */}
                  {store.showUPIQR && (
                    <div className="py-1 text-center border-b border-dotted border-slate-300">
                      <div className="w-10 h-10 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center mb-0.5">
                        <QrCode className="w-6 h-6 text-slate-700" />
                      </div>
                      <p className="text-[7px] text-slate-500 font-mono">UPI: {upiId}</p>
                    </div>
                  )}

                  {/* Compact Footer */}
                  {store.showFooterMessage && (
                    <p className="text-[8px] text-center text-slate-600 pt-1 font-semibold">
                      {store.thankYouText}
                    </p>
                  )}
                </div>
              ) : (
                /* ── TEMPLATE 2: CLASSIC THERMAL (Traditional Default) ── */
                <div
                  className="bg-white border border-slate-300 shadow-md font-mono text-slate-800 transition-all duration-300"
                  style={{ width: previewPx, minHeight: 400, padding: '16px 12px' }}
                >
                  {/* ── Receipt Header ── */}
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    {store.showLogo && (
                      <div className="flex justify-center mb-2">
                        {store.logoDataUrl ? (
                          <img
                            src={store.logoDataUrl}
                            alt="Logo"
                            className="object-contain"
                            style={{ width: store.logoWidth * 0.6, maxHeight: store.logoHeight * 0.6 }}
                          />
                        ) : (
                          <div
                            className="bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400"
                            style={{ width: store.logoWidth * 0.6, height: store.logoHeight * 0.6 }}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    )}

                    {store.showRestaurantName && (
                      <h2
                        className="uppercase tracking-wider text-slate-900 leading-tight"
                        style={{
                          fontSize: store.restaurantNameSize * 0.75,
                          fontWeight: store.restaurantNameBold ? 900 : 600,
                        }}
                      >
                        {outletName}
                      </h2>
                    )}

                    {store.showAddress && (
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                        {address1}
                        {address2 && (
                          <>
                            <br />
                            {address2}
                          </>
                        )}
                      </p>
                    )}

                    {store.showContactNumber && (
                      <p className="text-[9px] text-slate-500">Ph: {phone}</p>
                    )}
                    {store.showEmail && (
                      <p className="text-[9px] text-slate-500">{email}</p>
                    )}
                    {store.showWebsiteLink && (
                      <p className="text-[9px] text-blue-600 underline">{website}</p>
                    )}
                    {store.showGSTIN && (
                      <p className="text-[9px] font-bold text-slate-700 mt-0.5">GSTIN: {gstin}</p>
                    )}
                    {store.showFSSAI && (
                      <p className="text-[9px] text-slate-500">FSSAI: {fssai}</p>
                    )}
                  </div>

                  {/* ── Invoice Title ── */}
                  {store.showInvoiceTitle && (
                    <div className="text-center py-1.5 border-b border-dashed border-slate-300">
                      <span
                        className="uppercase tracking-widest text-slate-900"
                        style={{
                          fontSize: store.invoiceTitleSize * 0.8,
                          fontWeight: store.invoiceTitleBold ? 900 : 600,
                        }}
                      >
                        {store.invoiceTitle}
                      </span>
                    </div>
                  )}

                  {/* ── Bill/Order Details ── */}
                  <div
                    className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5"
                    style={{
                      fontSize: store.infoRowSize * 0.65,
                      fontWeight: store.infoRowBold ? 700 : 400,
                    }}
                  >
                    {store.showDate && (
                      <div className="flex justify-between">
                        <span>
                          Date:{' '}
                          {store.dateFormat === 'YYYY-MM-DD'
                            ? '2026/09/08'
                            : store.dateFormat === 'MM/DD/YY'
                            ? '09/08/26'
                            : '08/09/26'}{' '}
                          {store.showTime && '17:05'}
                        </span>
                        {store.showTableNo && <span>Table No: 8</span>}
                      </div>
                    )}

                    {(store.showTokenNo || store.showBillNo) && (
                      <div className="flex justify-between">
                        {store.showTokenNo && <span>Token No: 1, 2</span>}
                        {store.showBillNo && <span>Bill No: BILL-74</span>}
                      </div>
                    )}

                    {store.showOrderType && (
                      <div className="flex justify-between">
                        <span>Type: Dine-In</span>
                      </div>
                    )}

                    {store.showOrderBy && (
                      <div>
                        <span>Biller: Cashier</span>
                      </div>
                    )}

                    {store.showCustomerName && (
                      <div>
                        <span>Customer: Walk-in</span>
                      </div>
                    )}

                    {store.showCustomerPhone && (
                      <div>
                        <span>Phone: +91 98765 43210</span>
                      </div>
                    )}

                    {store.showCustomerAddress && (
                      <div>
                        <span>Address: 123 MG Road, Pune</span>
                      </div>
                    )}

                    {store.showMemberCount && (
                      <div>
                        <span>Members: 4</span>
                      </div>
                    )}
                  </div>

                  {/* ── Items Table ── */}
                  <div className="py-1.5 border-b border-dashed border-slate-300">
                    <div
                      className="grid grid-cols-12 font-bold pb-1 border-b border-slate-200"
                      style={{ fontSize: store.itemFontSize * 0.7 }}
                    >
                      <span className="col-span-5">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      {store.showItemPrice && (
                        <>
                          <span className="col-span-2 text-right">Price</span>
                          <span className="col-span-3 text-right">Amount</span>
                        </>
                      )}
                    </div>

                    <div className="pt-1 space-y-1.5">
                      {SAMPLE_ITEMS.map((item, idx) => (
                        <div key={idx}>
                          <div
                            className="grid grid-cols-12"
                            style={{ fontSize: store.itemFontSize * 0.7 }}
                          >
                            <span
                              className={`${store.showItemPrice ? 'col-span-5' : 'col-span-7'} font-sans leading-tight`}
                              style={{
                                fontWeight: store.itemNameBold ? 700 : 500,
                                fontSize: store.itemNameSize * 0.7,
                                textTransform: store.itemNameUppercase ? 'uppercase' : 'none',
                              }}
                            >
                              {item.name}
                              {store.showItemVariant && item.variant && (
                                <span className="block text-slate-500 normal-case" style={{ fontSize: store.itemFontSize * 0.6 }}>
                                  {item.variant}
                                </span>
                              )}
                            </span>
                            <span className="col-span-2 text-center">{item.qty}</span>
                            {store.showItemPrice && (
                              <>
                                <span className="col-span-2 text-right">{curr}{item.price.toFixed(2)}</span>
                                <span className="col-span-3 text-right font-bold">{curr}{item.total.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                          {store.showItemAddons && item.addons && (
                            <p
                              className="text-slate-500 pl-1 leading-tight"
                              style={{ fontSize: store.itemFontSize * 0.6 }}
                            >
                              Addons : {item.addons}
                            </p>
                          )}
                          {store.showItemNote && item.note && (
                            <p
                              className="text-slate-400 pl-1 italic"
                              style={{
                                fontSize: store.itemNoteSize * 0.6,
                                fontWeight: store.itemNoteBold ? 700 : 400,
                              }}
                            >
                              * {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Totals ── */}
                  <div className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5 text-[9px]">
                    {store.showTotalQuantity && (
                      <div className="flex justify-between">
                        <span>Total Qty: 4</span>
                        {store.showSubTotal && <span>Sub Total: {curr}{SAMPLE_SUBTOTAL.toFixed(2)}</span>}
                      </div>
                    )}

                    {!store.showTotalQuantity && store.showSubTotal && (
                      <div className="flex justify-between">
                        <span>Sub Total:</span>
                        <span>{curr}{SAMPLE_SUBTOTAL.toFixed(2)}</span>
                      </div>
                    )}

                    {store.showTaxBreakdown && (
                      <>
                        <div className="flex justify-between text-slate-500">
                          <span>CGST (2.5%):</span>
                          <span>{curr}{SAMPLE_CGST.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>SGST (2.5%):</span>
                          <span>{curr}{SAMPLE_SGST.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {store.showDiscountRow && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span>- {curr}0.00</span>
                      </div>
                    )}

                    {store.showRoundOff && (
                      <div className="flex justify-between text-slate-500">
                        <span>Round Off:</span>
                        <span>{curr}0.50</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] font-black pt-1 border-t border-slate-200 text-slate-900">
                      <span>Grand Total</span>
                      <span>{curr}{SAMPLE_GRAND}</span>
                    </div>
                  </div>

                  {/* ── Order Note ── */}
                  {store.showOrderNote && (
                    <div
                      className="py-1.5 border-b border-dashed border-slate-300"
                      style={{
                        fontSize: store.orderNoteSize * 0.7,
                        fontWeight: store.orderNoteBold ? 700 : 400,
                      }}
                    >
                      <span className="font-semibold">{store.orderNoteLabel}:</span>
                      <p className="text-slate-600 mt-0.5 italic">1. Less spicy please</p>
                    </div>
                  )}

                  {/* ── UPI QR ── */}
                  {store.showUPIQR && (
                    <div className="py-2 text-center border-b border-dashed border-slate-300">
                      <div className="w-16 h-16 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center rounded-sm mb-1">
                        <div className="grid grid-cols-3 gap-0.5">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 ${
                                [0, 1, 2, 3, 5, 6, 8].includes(i) ? 'bg-slate-900' : 'bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-500">Scan & Pay via UPI</p>
                      <p className="text-[8px] font-mono text-slate-400">{upiId}</p>
                    </div>
                  )}

                  {/* ── Footer ── */}
                  <div className="text-center pt-2 space-y-0.5">
                    {store.showFooterMessage && (
                      <p
                        className="text-slate-600"
                        style={{
                          fontSize: store.footerMessageSize * 0.7,
                          fontWeight: store.footerMessageBold ? 700 : 400,
                        }}
                      >
                        {store.thankYouText}
                      </p>
                    )}
                    {store.showPoweredBy && (
                      <p className="text-[8px] text-slate-400">Powered by PetBharke POS</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : store.activeTab === 'kot' ? (
        /* ════ KOT Template Settings ════ */
        <div className="flex-1 flex overflow-hidden">
          {/* ──── LEFT: KOT Header Settings ──── */}
          <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            {/* ── KOT Template Style Selector ── */}
            <SectionHeader icon="🎨" title="KOT Template Style" />
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {KOT_TEMPLATES.map((tmpl) => {
                  const isSelected = store.kotTemplateStyle === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => store.setField('kotTemplateStyle', tmpl.id)}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-red-600 bg-white shadow-sm ring-2 ring-red-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl mb-1">{tmpl.icon}</span>
                      <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                        {tmpl.name}
                      </span>
                      <span
                        className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tmpl.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                {KOT_TEMPLATES.find((t) => t.id === store.kotTemplateStyle)?.desc}
              </p>
            </div>

            <SectionHeader icon="🎫" title="KOT Header" />

            {/* KOT Title */}
            <ToggleRow
              label="KOT Title"
              enabled={store.kotShowTitle}
              onToggle={() => store.toggleField('kotShowTitle')}
            >
              <BoldButton
                active={store.kotTitleBold}
                onClick={() => store.toggleField('kotTitleBold')}
              />
              <FontSizeSelect
                value={store.kotTitleSize}
                onChange={(v) => store.setField('kotTitleSize', v)}
              />
              <input
                type="text"
                value={store.kotTitle}
                onChange={(e) => store.setField('kotTitle', e.target.value)}
                className="w-16 text-[11px] border border-slate-300 rounded px-2 py-1 bg-white font-bold text-center uppercase focus:outline-none focus:border-red-500"
              />
            </ToggleRow>

            <ToggleRow
              label="Restaurant Name"
              enabled={store.kotShowRestaurantName}
              onToggle={() => store.toggleField('kotShowRestaurantName')}
            />

            <ToggleRow
              label="KOT Number"
              enabled={store.kotShowKotNumber}
              onToggle={() => store.toggleField('kotShowKotNumber')}
            />

            <ToggleRow
              label="Date"
              enabled={store.kotShowDate}
              onToggle={() => store.toggleField('kotShowDate')}
            />

            {store.kotShowDate && (
              <div className="pl-10 pr-4 py-1.5 border-b border-slate-100 flex items-center space-x-2">
                <ToggleSwitch
                  enabled={store.kotShowTime}
                  onChange={() => store.toggleField('kotShowTime')}
                  size="sm"
                />
                <span className="text-[11px] text-slate-500 font-semibold">Show Time</span>
              </div>
            )}

            <ToggleRow
              label="Order Type"
              enabled={store.kotShowOrderType}
              onToggle={() => store.toggleField('kotShowOrderType')}
            />

            <ToggleRow
              label="Table No."
              enabled={store.kotShowTableNo}
              onToggle={() => store.toggleField('kotShowTableNo')}
            />

            <ToggleRow
              label="Token No."
              enabled={store.kotShowTokenNo}
              onToggle={() => store.toggleField('kotShowTokenNo')}
            />

            <ToggleRow
              label="Waiter / Biller Name"
              enabled={store.kotShowWaiterName}
              onToggle={() => store.toggleField('kotShowWaiterName')}
            />

            <ToggleRow
              label="Kitchen Section / Station"
              enabled={store.kotShowSection}
              onToggle={() => store.toggleField('kotShowSection')}
              badge="e.g. Kitchen, Bar"
            />

            {/* Header Row Style */}
            <ToggleRow label="Header Row Style" enabled={true} onToggle={() => {}}>
              <BoldButton
                active={store.kotHeaderBold}
                onClick={() => store.toggleField('kotHeaderBold')}
              />
              <FontSizeSelect
                value={store.kotHeaderSize}
                onChange={(v) => store.setField('kotHeaderSize', v)}
              />
            </ToggleRow>

            {/* ── KOT Footer ── */}
            <SectionHeader icon="🔻" title="KOT Footer" />

            <ToggleRow
              label="Total Item Quantity"
              enabled={store.kotShowTotalQty}
              onToggle={() => store.toggleField('kotShowTotalQty')}
            />

            <ToggleRow
              label="Order Note"
              enabled={store.kotShowOrderNote}
              onToggle={() => store.toggleField('kotShowOrderNote')}
            >
              <BoldButton
                active={store.kotOrderNoteBold}
                onClick={() => store.toggleField('kotOrderNoteBold')}
              />
              <FontSizeSelect
                value={store.kotOrderNoteSize}
                onChange={(v) => store.setField('kotOrderNoteSize', v)}
              />
            </ToggleRow>

            <ToggleRow
              label="Priority Badge"
              enabled={store.kotShowPriority}
              onToggle={() => store.toggleField('kotShowPriority')}
              badge="Rush / Normal"
            />

            <ToggleRow
              label="Created At Timestamp"
              enabled={store.kotShowCreatedAt}
              onToggle={() => store.toggleField('kotShowCreatedAt')}
            />

            <ToggleRow
              label="Footer Message"
              enabled={store.kotShowFooterMessage}
              onToggle={() => store.toggleField('kotShowFooterMessage')}
            />
            {store.kotShowFooterMessage && (
              <div className="px-4 py-1.5 border-b border-slate-100">
                <input
                  type="text"
                  value={store.kotFooterText}
                  onChange={(e) => store.setField('kotFooterText', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500 text-center font-semibold"
                  placeholder="Custom footer text..."
                />
              </div>
            )}

            <ToggleRow
              label="Powered By PetBharke"
              enabled={store.kotShowPoweredBy}
              onToggle={() => store.toggleField('kotShowPoweredBy')}
            />

            <div className="h-8 shrink-0" />
          </div>

          {/* ──── CENTER: KOT Items Formatting ──── */}
          <div className="w-96 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            <SectionHeader icon="🍽️" title="KOT Items Formatting" />

            <ToggleRow label="Item Names" enabled={true} onToggle={() => {}}>
              <BoldButton
                active={store.kotItemNameBold}
                onClick={() => store.toggleField('kotItemNameBold')}
              />
              <FontSizeSelect
                value={store.kotItemNameSize}
                onChange={(v) => store.setField('kotItemNameSize', v)}
              />
              <UppercaseButton
                active={store.kotItemNameUppercase}
                onClick={() => store.toggleField('kotItemNameUppercase')}
              />
            </ToggleRow>

            <ToggleRow
              label="Item Quantity"
              enabled={store.kotShowItemQty}
              onToggle={() => store.toggleField('kotShowItemQty')}
            />

            <ToggleRow
              label="Size / Variant"
              enabled={store.kotShowItemVariant}
              onToggle={() => store.toggleField('kotShowItemVariant')}
            />

            <ToggleRow
              label="Item Add-ons"
              enabled={store.kotShowItemAddons}
              onToggle={() => store.toggleField('kotShowItemAddons')}
            />

            <ToggleRow
              label="Special Instructions"
              enabled={store.kotShowItemInstructions}
              onToggle={() => store.toggleField('kotShowItemInstructions')}
            >
              <BoldButton
                active={store.kotInstructionsBold}
                onClick={() => store.toggleField('kotInstructionsBold')}
              />
              <FontSizeSelect
                value={store.kotInstructionsSize}
                onChange={(v) => store.setField('kotInstructionsSize', v)}
              />
            </ToggleRow>

            <ToggleRow
              label="Item Price on KOT"
              enabled={store.kotShowItemPrice}
              onToggle={() => store.toggleField('kotShowItemPrice')}
              badge="Usually OFF"
            />

            <div className="h-8 shrink-0" />
          </div>

          {/* ──── RIGHT: KOT Live Preview ──── */}
          <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto">
            {/* Width & Style Selector */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Width</span>
                <div className="flex items-center space-x-1">
                  {WIDTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => store.setField('kotPreviewWidth', opt.value)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold touch-btn transition-all ${
                        store.kotPreviewWidth === opt.value
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Template Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                {KOT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => store.setField('kotTemplateStyle', tmpl.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all ${
                      store.kotTemplateStyle === tmpl.id
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Label */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold text-slate-700 uppercase">KOT Live Preview</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {store.kotPreviewWidth}MM
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">
                  {store.kotTemplateStyle} Style
                </span>
              </div>
            </div>

            {/* ═══ KOT Receipt Preview ═══ */}
            <div className="px-4 pb-8 flex justify-center">
              {/* ── TEMPLATE 1: BOLD CHEF DISPLAY ── */}
              {store.kotTemplateStyle === 'bold' ? (
                <div
                  className="bg-white border-4 border-slate-900 shadow-xl font-sans text-slate-900 transition-all duration-300"
                  style={{ width: widthToPx(store.kotPreviewWidth), minHeight: 300, padding: '14px 12px' }}
                >
                  {/* Giant Inverted Table Banner */}
                  <div className="bg-slate-900 text-white p-2.5 rounded text-center mb-2 shadow-xs">
                    <div className="flex justify-between items-center text-[10px] font-bold text-amber-300 pb-1 border-b border-slate-700">
                      <span>{store.kotShowKotNumber ? 'KOT #104' : store.kotTitle}</span>
                      {store.kotShowSection && (
                        <span className="bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-black text-[9px]">
                          🍳 KITCHEN
                        </span>
                      )}
                      {store.kotShowTime && <span>17:05</span>}
                    </div>

                    <div className="text-2xl font-black tracking-wider py-1.5 text-white leading-tight">
                      {store.kotShowTableNo ? 'TABLE: T-8' : store.kotTitle}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-300 pt-0.5 border-t border-slate-800">
                      {store.kotShowOrderType && <span>DINE-IN</span>}
                      {store.kotShowTokenNo && <span>TOKEN #3</span>}
                      {store.kotShowWaiterName && <span>WAITER: Cashier</span>}
                    </div>
                  </div>

                  {store.kotShowRestaurantName && (
                    <div className="text-center pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {outletName}
                    </div>
                  )}

                  {/* Priority Alert Banner */}
                  {store.kotShowPriority && (
                    <div className="bg-red-600 text-white text-center py-1 rounded font-black text-xs uppercase tracking-wider my-1.5 shadow-xs animate-pulse">
                      🔥 RUSH ORDER - PRIORITY 1 🔥
                    </div>
                  )}

                  {/* High Visibility Item Rows */}
                  <div className="space-y-2 py-1 border-t-2 border-b-2 border-slate-900 my-1">
                    {SAMPLE_ITEMS.map((item, idx) => (
                      <div key={idx} className="border-b border-slate-200 pb-2 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 flex-1">
                            {store.kotShowItemQty && (
                              <span className="bg-slate-900 text-white font-black text-sm px-2.5 py-1 rounded shadow-xs shrink-0">
                                {item.qty}
                              </span>
                            )}
                            <span
                              className="font-black text-slate-900 text-xs leading-tight"
                              style={{
                                fontSize: store.kotItemNameSize * 0.75,
                                textTransform: store.kotItemNameUppercase ? 'uppercase' : 'none',
                              }}
                            >
                              {item.name}
                              {store.kotShowItemVariant && item.variant && (
                                <span className="block text-[10px] text-slate-500 font-bold">{item.variant}</span>
                              )}
                            </span>
                          </div>
                          {store.kotShowItemPrice && (
                            <span className="text-xs font-bold text-slate-500 shrink-0">
                              {curr}{item.total.toFixed(0)}
                            </span>
                          )}
                        </div>

                        {store.kotShowItemAddons && item.addons && (
                          <p className="text-[10px] font-bold text-slate-600 pl-9 mt-0.5">+ {item.addons}</p>
                        )}

                        {store.kotShowItemInstructions && item.note && (
                          <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 px-2.5 py-1 rounded text-[10px] font-black mt-1 ml-9 shadow-xs">
                            ⚠ CHEF NOTE: {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* High-visibility Footer */}
                  <div className="pt-1.5 text-[10px] space-y-1">
                    {store.kotShowTotalQty && (
                      <div className="flex justify-between font-black text-slate-900">
                        <span>TOTAL ITEMS: 3</span>
                        <span>TOTAL QTY: 4</span>
                      </div>
                    )}
                    {store.kotShowOrderNote && (
                      <div className="bg-slate-100 border border-slate-300 p-1.5 rounded text-slate-800 font-bold text-[9px]">
                        Order Note: Less spicy please, extra raita
                      </div>
                    )}
                    {store.kotShowCreatedAt && (
                      <div className="text-[9px] text-slate-400 text-center font-mono">
                        08/09/26 17:05:32
                      </div>
                    )}
                    {store.kotShowFooterMessage && store.kotFooterText && (
                      <div className="text-[9px] text-center font-bold text-slate-600">
                        {store.kotFooterText}
                      </div>
                    )}
                    {store.kotShowPoweredBy && (
                      <p className="text-[8px] text-slate-400 text-center">Powered by PetBharke POS</p>
                    )}
                  </div>
                </div>
              ) : store.kotTemplateStyle === 'compact' ? (
                /* ── TEMPLATE 2: COMPACT EXPRESS ── */
                <div
                  className="bg-white border border-slate-400 shadow-sm font-mono text-slate-900 transition-all duration-300"
                  style={{ width: widthToPx(store.kotPreviewWidth), minHeight: 220, padding: '10px 8px' }}
                >
                  {/* Compact Header */}
                  <div className="pb-1 border-b border-dashed border-slate-400 flex justify-between items-center text-[10px] font-black">
                    <span>
                      {store.kotShowKotNumber && 'KOT #104 • '}
                      {store.kotShowTableNo && 'T-8'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600">
                      {store.kotShowOrderType && 'Dine-In • '}17:05
                    </span>
                  </div>

                  {store.kotShowPriority && (
                    <div className="bg-red-600 text-white text-center py-0.5 text-[9px] font-black uppercase my-1">
                      ! RUSH !
                    </div>
                  )}

                  {/* Compact Multi-item list */}
                  <div className="py-1 border-b border-dashed border-slate-400 space-y-1">
                    {SAMPLE_ITEMS.map((item, idx) => (
                      <div key={idx} className="text-[9px]">
                        <div className="flex justify-between items-baseline">
                          <span className="truncate pr-1">
                            <strong className="font-black text-slate-900">{item.qty}×</strong>{' '}
                            {store.kotItemNameUppercase ? item.name.toUpperCase() : item.name}
                            {store.kotShowItemVariant && item.variant && ` ${item.variant}`}
                          </span>
                          {store.kotShowItemPrice && (
                            <span className="font-bold text-slate-600 shrink-0">{curr}{item.total.toFixed(0)}</span>
                          )}
                        </div>
                        {store.kotShowItemInstructions && item.note && (
                          <p className="text-red-600 text-[8px] pl-3 italic">* {item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Compact Footer */}
                  <div className="pt-1 text-[8px] flex justify-between text-slate-600">
                    {store.kotShowTotalQty && <span>Items: 3 (Qty: 4)</span>}
                    {store.kotShowWaiterName && <span>Waiter: Cashier</span>}
                  </div>
                </div>
              ) : (
                /* ── TEMPLATE 3: STANDARD KOT ── */
                <div
                  className="bg-white border-2 border-dashed border-amber-400 shadow-md font-mono text-slate-800 transition-all duration-300"
                  style={{ width: widthToPx(store.kotPreviewWidth), minHeight: 300, padding: '14px 10px' }}
                >
                  {/* KOT Title */}
                  {store.kotShowTitle && (
                    <div className="text-center pb-1.5 border-b-2 border-slate-900">
                      <span
                        className="uppercase tracking-widest text-slate-900"
                        style={{
                          fontSize: store.kotTitleSize * 0.85,
                          fontWeight: store.kotTitleBold ? 900 : 600,
                        }}
                      >
                        ★ {store.kotTitle} ★
                      </span>
                    </div>
                  )}

                  {/* Restaurant Name */}
                  {store.kotShowRestaurantName && (
                    <div className="text-center py-1 border-b border-dashed border-slate-300">
                      <span className="text-[9px] font-bold text-slate-700 uppercase">{outletName}</span>
                    </div>
                  )}

                  {/* KOT Header Details */}
                  <div
                    className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5"
                    style={{
                      fontSize: store.kotHeaderSize * 0.7,
                      fontWeight: store.kotHeaderBold ? 700 : 400,
                    }}
                  >
                    {store.kotShowKotNumber && (
                      <div className="flex justify-between">
                        <span className="font-bold">KOT #: 104</span>
                        {store.kotShowTokenNo && <span>Token: 3</span>}
                      </div>
                    )}
                    {store.kotShowDate && (
                      <div className="flex justify-between">
                        <span>Date: 08/09/26</span>
                        {store.kotShowTime && <span>Time: 17:05</span>}
                      </div>
                    )}
                    {store.kotShowOrderType && (
                      <div className="flex justify-between">
                        <span>Type: <strong>Dine-In</strong></span>
                        {store.kotShowTableNo && <span>Table: <strong>T-8</strong></span>}
                      </div>
                    )}
                    {store.kotShowWaiterName && (
                      <div>Waiter: Cashier</div>
                    )}
                    {store.kotShowSection && (
                      <div className="mt-1 text-center">
                        <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-0.5 rounded uppercase tracking-wider">
                          🍳 KITCHEN
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority Badge */}
                  {store.kotShowPriority && (
                    <div className="text-center py-1 border-b border-dashed border-slate-300">
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-0.5 rounded uppercase">
                        🔥 RUSH ORDER
                      </span>
                    </div>
                  )}

                  {/* ── KOT Items ── */}
                  <div className="py-1.5 border-b border-dashed border-slate-300">
                    {/* Header row */}
                    <div className="flex justify-between font-bold text-[9px] pb-1 border-b border-slate-200">
                      <span>ITEM</span>
                      {store.kotShowItemQty && <span>QTY</span>}
                      {store.kotShowItemPrice && <span>PRICE</span>}
                    </div>

                    <div className="pt-1 space-y-2">
                      {SAMPLE_ITEMS.map((item, idx) => (
                        <div key={idx} className="border-b border-dotted border-slate-200 pb-1.5 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <span
                              className="font-sans leading-tight flex-1"
                              style={{
                                fontWeight: store.kotItemNameBold ? 700 : 500,
                                fontSize: store.kotItemNameSize * 0.7,
                                textTransform: store.kotItemNameUppercase ? 'uppercase' : 'none',
                              }}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center space-x-3 shrink-0">
                              {store.kotShowItemQty && (
                                <span className="font-black text-slate-900" style={{ fontSize: store.kotItemNameSize * 0.75 }}>
                                  x{item.qty}
                                </span>
                              )}
                              {store.kotShowItemPrice && (
                                <span className="text-[9px] text-slate-500">{curr}{item.total.toFixed(0)}</span>
                              )}
                            </div>
                          </div>

                          {store.kotShowItemVariant && item.variant && (
                            <p className="text-[9px] text-slate-500 pl-1">{item.variant}</p>
                          )}
                          {store.kotShowItemAddons && item.addons && (
                            <p className="text-[9px] text-slate-500 pl-1">+ {item.addons}</p>
                          )}
                          {store.kotShowItemInstructions && item.note && (
                            <p
                              className="text-red-600 pl-1 mt-0.5"
                              style={{
                                fontSize: store.kotInstructionsSize * 0.65,
                                fontWeight: store.kotInstructionsBold ? 700 : 400,
                              }}
                            >
                              ⚠ {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KOT Footer */}
                  <div className="py-1.5 space-y-1">
                    {store.kotShowTotalQty && (
                      <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-slate-300 pb-1">
                        <span>Total Items: 3</span>
                        <span>Total Qty: 4</span>
                      </div>
                    )}

                    {store.kotShowOrderNote && (
                      <div
                        className="border-b border-dashed border-slate-300 pb-1"
                        style={{
                          fontSize: store.kotOrderNoteSize * 0.7,
                          fontWeight: store.kotOrderNoteBold ? 700 : 400,
                        }}
                      >
                        <span className="font-semibold">Note:</span>
                        <p className="text-red-600 italic mt-0.5">Less spicy please, extra raita</p>
                      </div>
                    )}

                    {store.kotShowCreatedAt && (
                      <div className="text-[9px] text-slate-500 text-center">
                        Created: 08/09/26 17:05:32
                      </div>
                    )}

                    {store.kotShowFooterMessage && store.kotFooterText && (
                      <div className="text-[9px] text-center font-semibold text-slate-600">
                        {store.kotFooterText}
                      </div>
                    )}

                    {store.kotShowPoweredBy && (
                      <p className="text-[8px] text-slate-400 text-center">Powered by PetBharke POS</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      ) : store.activeTab === 'cancelKot' ? (
        /* ════ Cancel KOT Template Settings ════ */
        <div className="flex-1 flex overflow-hidden">
          {/* ──── LEFT: Cancel KOT Settings ──── */}
          <div className="w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            <SectionHeader icon="❌" title="Cancel KOT Header" />

            <ToggleRow
              label="Cancel KOT Title"
              enabled={store.cancelKotShowTitle}
              onToggle={() => store.toggleField('cancelKotShowTitle')}
            >
              <BoldButton
                active={store.cancelKotTitleBold}
                onClick={() => store.toggleField('cancelKotTitleBold')}
              />
              <FontSizeSelect
                value={store.cancelKotTitleSize}
                onChange={(v) => store.setField('cancelKotTitleSize', v)}
              />
              <input
                type="text"
                value={store.cancelKotTitle}
                onChange={(e) => store.setField('cancelKotTitle', e.target.value)}
                className="w-28 text-[11px] border border-slate-300 rounded px-2 py-1 bg-white font-bold text-center uppercase focus:outline-none focus:border-red-500"
              />
            </ToggleRow>

            <ToggleRow
              label="KOT Number"
              enabled={store.cancelKotShowKotNumber}
              onToggle={() => store.toggleField('cancelKotShowKotNumber')}
            />

            <ToggleRow
              label="Date"
              enabled={store.cancelKotShowDate}
              onToggle={() => store.toggleField('cancelKotShowDate')}
            />

            {store.cancelKotShowDate && (
              <div className="pl-10 pr-4 py-1.5 border-b border-slate-100 flex items-center space-x-2">
                <ToggleSwitch
                  enabled={store.cancelKotShowTime}
                  onChange={() => store.toggleField('cancelKotShowTime')}
                  size="sm"
                />
                <span className="text-[11px] text-slate-500 font-semibold">Show Time</span>
              </div>
            )}

            <ToggleRow
              label="Table No."
              enabled={store.cancelKotShowTableNo}
              onToggle={() => store.toggleField('cancelKotShowTableNo')}
            />

            <ToggleRow
              label="Order Type"
              enabled={store.cancelKotShowOrderType}
              onToggle={() => store.toggleField('cancelKotShowOrderType')}
            />

            <ToggleRow
              label="Waiter / Biller Name"
              enabled={store.cancelKotShowWaiterName}
              onToggle={() => store.toggleField('cancelKotShowWaiterName')}
            />

            <SectionHeader icon="🍽️" title="Cancelled Items" />

            <ToggleRow
              label="Show Cancelled Items"
              enabled={store.cancelKotShowItems}
              onToggle={() => store.toggleField('cancelKotShowItems')}
            />

            {store.cancelKotShowItems && (
              <>
                <ToggleRow
                  label="Item Name Bold"
                  enabled={store.cancelKotItemBold}
                  onToggle={() => store.toggleField('cancelKotItemBold')}
                />
                <ToggleRow
                  label="Item Quantity"
                  enabled={store.cancelKotShowItemQty}
                  onToggle={() => store.toggleField('cancelKotShowItemQty')}
                />
              </>
            )}

            <ToggleRow
              label="Cancellation Reason"
              enabled={store.cancelKotShowReason}
              onToggle={() => store.toggleField('cancelKotShowReason')}
            />

            <SectionHeader icon="🔻" title="Cancel KOT Footer" />

            <ToggleRow
              label="Footer Message"
              enabled={store.cancelKotShowFooterMessage}
              onToggle={() => store.toggleField('cancelKotShowFooterMessage')}
            />
            {store.cancelKotShowFooterMessage && (
              <div className="px-4 py-1.5 border-b border-slate-100">
                <input
                  type="text"
                  value={store.cancelKotFooterText}
                  onChange={(e) => store.setField('cancelKotFooterText', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-red-500 text-center font-semibold"
                />
              </div>
            )}

            <ToggleRow
              label="Powered By PetBharke"
              enabled={store.cancelKotShowPoweredBy}
              onToggle={() => store.toggleField('cancelKotShowPoweredBy')}
            />

            <div className="h-8 shrink-0" />
          </div>

          {/* ──── RIGHT: Cancel KOT Live Preview ──── */}
          <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto">
            {/* Width Selector */}
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Preview Width</span>
                <div className="flex items-center space-x-1">
                  {WIDTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => store.setField('cancelKotPreviewWidth', opt.value)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold touch-btn transition-all ${
                        store.cancelKotPreviewWidth === opt.value
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-700">{store.cancelKotPreviewWidth} mm</span>
            </div>

            <div className="px-4 pt-4 pb-2 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-extrabold text-slate-700 uppercase">Cancel KOT Preview</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                {store.cancelKotPreviewWidth}MM
              </span>
            </div>

            {/* ═══ Cancel KOT Preview ═══ */}
            <div className="px-4 pb-8 flex justify-center">
              <div
                className="bg-white border-2 border-dashed border-rose-400 shadow-md font-mono text-slate-800 transition-all duration-300"
                style={{ width: widthToPx(store.cancelKotPreviewWidth), minHeight: 250, padding: '14px 10px' }}
              >
                {/* Title */}
                {store.cancelKotShowTitle && (
                  <div className="text-center pb-1.5 border-b-2 border-rose-600 bg-rose-50 -mx-[10px] -mt-[14px] px-[10px] pt-[14px] mb-2">
                    <span
                      className="uppercase tracking-widest text-rose-700"
                      style={{
                        fontSize: store.cancelKotTitleSize * 0.85,
                        fontWeight: store.cancelKotTitleBold ? 900 : 600,
                      }}
                    >
                      ✕ {store.cancelKotTitle} ✕
                    </span>
                  </div>
                )}

                {/* Cancel KOT Info */}
                <div className="py-1.5 border-b border-dashed border-slate-300 space-y-0.5 text-[9px]">
                  {store.cancelKotShowKotNumber && (
                    <div className="flex justify-between font-bold">
                      <span>Original KOT #: 104</span>
                    </div>
                  )}
                  {store.cancelKotShowDate && (
                    <div className="flex justify-between">
                      <span>Date: 08/09/26</span>
                      {store.cancelKotShowTime && <span>Time: 17:12</span>}
                    </div>
                  )}
                  {store.cancelKotShowOrderType && (
                    <div className="flex justify-between">
                      <span>Type: Dine-In</span>
                      {store.cancelKotShowTableNo && <span>Table: T-8</span>}
                    </div>
                  )}
                  {store.cancelKotShowWaiterName && (
                    <div>Cancelled By: Cashier</div>
                  )}
                </div>

                {/* Cancelled Items */}
                {store.cancelKotShowItems && (
                  <div className="py-1.5 border-b border-dashed border-slate-300">
                    <div className="text-[9px] font-bold pb-1 border-b border-slate-200 text-rose-700 uppercase">
                      Cancelled Items
                    </div>
                    <div className="pt-1 space-y-1">
                      {SAMPLE_ITEMS.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span
                            className="font-sans text-slate-800 line-through decoration-rose-500"
                            style={{
                              fontSize: 9,
                              fontWeight: store.cancelKotItemBold ? 700 : 400,
                            }}
                          >
                            {item.name} {item.variant || ''}
                          </span>
                          {store.cancelKotShowItemQty && (
                            <span className="font-bold text-rose-600 text-[10px]">x{item.qty}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason */}
                {store.cancelKotShowReason && (
                  <div className="py-1.5 border-b border-dashed border-slate-300">
                    <span className="text-[9px] font-bold text-slate-700">Reason:</span>
                    <p className="text-[9px] text-rose-600 font-semibold italic mt-0.5">
                      Customer changed order / Item out of stock
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-2 space-y-0.5">
                  {store.cancelKotShowFooterMessage && (
                    <p className="text-[9px] font-bold text-rose-600">{store.cancelKotFooterText}</p>
                  )}
                  {store.cancelKotShowPoweredBy && (
                    <p className="text-[8px] text-slate-400">Powered by PetBharke POSS</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ════ Printer Settings Placeholder ════ */
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Printer className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-700">Printer Settings</h3>
            <p className="text-sm text-slate-500 mt-1">
              Configure your thermal printer connections and preferences
            </p>
            <span className="inline-block mt-4 text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-bold">
              🚧 Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
