import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReceiptSettings {
  // ─── Store Info Section ───
  showLogo: boolean;
  logoWidth: number;
  logoHeight: number;
  logoDataUrl: string;  // base64 uploaded logo
  showRestaurantName: boolean;
  restaurantNameSize: number;
  restaurantNameBold: boolean;
  customRestaurantName: string; // user editable restaurant name
  showAddress: boolean;
  addressLine1: string;
  addressLine2: string;
  showGSTIN: boolean;
  gstinNumber: string;
  showFSSAI: boolean;
  fssaiNumber: string;
  showContactNumber: boolean;
  contactNumber: string;
  showEmail: boolean;
  emailAddress: string;
  showWebsiteLink: boolean;
  websiteUrl: string;

  // ─── Invoice Details Header ───
  showInvoiceTitle: boolean;
  invoiceTitle: string;
  invoiceTitleSize: number;
  invoiceTitleBold: boolean;
  showBillNo: boolean;
  showTokenNo: boolean;
  showDate: boolean;
  showTime: boolean;
  dateFormat: string;
  showOrderType: boolean;
  showTableNo: boolean;
  showOrderBy: boolean;
  infoRowSize: number;
  infoRowBold: boolean;

  // ─── Customer Info Section ───
  showOrderNote: boolean;
  orderNoteLabel: string;
  orderNoteSize: number;
  orderNoteBold: boolean;
  showCustomerName: boolean;
  showCustomerPhone: boolean;
  showCustomerAddress: boolean;

  // ─── Items Table Formatting ───
  itemNameBold: boolean;
  itemNameSize: number;
  itemNameUppercase: boolean;
  showItemVariant: boolean;
  showItemAddons: boolean;
  showItemNote: boolean;
  itemNoteBold: boolean;
  itemNoteSize: number;
  showItemPrice: boolean;
  itemFontSize: number;

  // ─── Summary & Tax Totals ───
  taxCalculationMode: 'inclusive' | 'exclusive';
  showSubTotal: boolean;
  showTaxBreakdown: boolean;
  showDiscountRow: boolean;
  showRoundOff: boolean;
  showTotalQuantity: boolean;
  showMemberCount: boolean;

  // ─── Footer, Font & Margins ───
  showFooterMessage: boolean;
  footerMessageBold: boolean;
  footerMessageSize: number;
  thankYouText: string;
  showUPIQR: boolean;
  upiId: string;
  currencySymbol: string;
  showPoweredBy: boolean;

  // ─── Preview ───
  previewWidth: 48 | 58 | 75 | 78 | 80;

  // ─── Template Style ───
  invoiceTemplateStyle: 'classic' | 'modern' | 'minimal';
  kotTemplateStyle: 'standard' | 'bold' | 'compact';

  // ─── Active Template Tab ───
  activeTab: 'printer' | 'kot' | 'invoice' | 'cancelKot';

  // ═══ KOT Template Settings ═══
  // ─── KOT Header ───
  kotShowTitle: boolean;
  kotTitle: string;
  kotTitleSize: number;
  kotTitleBold: boolean;
  kotShowRestaurantName: boolean;
  kotShowKotNumber: boolean;
  kotShowDate: boolean;
  kotShowTime: boolean;
  kotShowOrderType: boolean;
  kotShowTableNo: boolean;
  kotShowTokenNo: boolean;
  kotShowWaiterName: boolean;
  kotShowSection: boolean;
  kotHeaderSize: number;
  kotHeaderBold: boolean;

  // ─── KOT Items ───
  kotItemNameBold: boolean;
  kotItemNameSize: number;
  kotItemNameUppercase: boolean;
  kotShowItemQty: boolean;
  kotShowItemVariant: boolean;
  kotShowItemAddons: boolean;
  kotShowItemInstructions: boolean;
  kotInstructionsBold: boolean;
  kotInstructionsSize: number;
  kotShowItemPrice: boolean;

  // ─── KOT Footer ───
  kotShowTotalQty: boolean;
  kotShowOrderNote: boolean;
  kotOrderNoteBold: boolean;
  kotOrderNoteSize: number;
  kotShowPriority: boolean;
  kotShowFooterMessage: boolean;
  kotFooterText: string;
  kotShowCreatedAt: boolean;
  kotShowPoweredBy: boolean;
  kotPreviewWidth: 48 | 58 | 75 | 78 | 80;

  // ═══ Cancel KOT Template Settings ═══
  cancelKotShowTitle: boolean;
  cancelKotTitle: string;
  cancelKotTitleSize: number;
  cancelKotTitleBold: boolean;
  cancelKotShowKotNumber: boolean;
  cancelKotShowDate: boolean;
  cancelKotShowTime: boolean;
  cancelKotShowTableNo: boolean;
  cancelKotShowOrderType: boolean;
  cancelKotShowWaiterName: boolean;
  cancelKotShowReason: boolean;
  cancelKotShowItems: boolean;
  cancelKotItemBold: boolean;
  cancelKotShowItemQty: boolean;
  cancelKotShowFooterMessage: boolean;
  cancelKotFooterText: string;
  cancelKotShowPoweredBy: boolean;
  cancelKotPreviewWidth: 48 | 58 | 75 | 78 | 80;
}

interface ReceiptSettingsStore extends ReceiptSettings {
  setField: <K extends keyof ReceiptSettings>(key: K, value: ReceiptSettings[K]) => void;
  toggleField: (key: keyof ReceiptSettings) => void;
  resetToDefaults: () => void;
}

const defaultSettings: ReceiptSettings = {
  // Store Info
  showLogo: true,
  logoWidth: 160,
  logoHeight: 90,
  logoDataUrl: '',
  showRestaurantName: true,
  restaurantNameSize: 16,
  restaurantNameBold: true,
  customRestaurantName: '',
  showAddress: true,
  addressLine1: '',
  addressLine2: '',
  showGSTIN: true,
  gstinNumber: '',
  showFSSAI: true,
  fssaiNumber: '',
  showContactNumber: true,
  contactNumber: '',
  showEmail: false,
  emailAddress: '',
  showWebsiteLink: false,
  websiteUrl: '',

  // Template Style
  invoiceTemplateStyle: 'classic',
  kotTemplateStyle: 'standard',

  // Invoice Details
  showInvoiceTitle: true,
  invoiceTitle: 'INVOICE',
  invoiceTitleSize: 13,
  invoiceTitleBold: true,
  showBillNo: false,
  showTokenNo: true,
  showDate: true,
  showTime: true,
  dateFormat: 'DD/MM/YY',
  showOrderType: true,
  showTableNo: true,
  showOrderBy: true,
  infoRowSize: 13,
  infoRowBold: false,

  // Customer Info
  showOrderNote: true,
  orderNoteLabel: 'Order note',
  orderNoteSize: 11,
  orderNoteBold: false,
  showCustomerName: false,
  showCustomerPhone: false,
  showCustomerAddress: false,

  // Items Table Formatting
  itemNameBold: false,
  itemNameSize: 12,
  itemNameUppercase: false,
  showItemVariant: true,
  showItemAddons: true,
  showItemNote: true,
  itemNoteBold: false,
  itemNoteSize: 11,
  showItemPrice: true,
  itemFontSize: 12,

  // Summary & Tax Totals
  taxCalculationMode: 'inclusive',
  showSubTotal: true,
  showTaxBreakdown: true,
  showDiscountRow: true,
  showRoundOff: true,
  showTotalQuantity: false,
  showMemberCount: false,

  // Footer, Font & Margins
  showFooterMessage: true,
  footerMessageBold: false,
  footerMessageSize: 12,
  thankYouText: '*** Thank You! Visit Again ***',
  showUPIQR: true,
  upiId: 'petbharkhao@upi',
  currencySymbol: '₹',
  showPoweredBy: true,

  // Preview
  previewWidth: 78,

  // Tab
  activeTab: 'invoice',

  // ═══ KOT Template Defaults ═══
  kotShowTitle: true,
  kotTitle: 'KOT',
  kotTitleSize: 16,
  kotTitleBold: true,
  kotShowRestaurantName: true,
  kotShowKotNumber: true,
  kotShowDate: true,
  kotShowTime: true,
  kotShowOrderType: true,
  kotShowTableNo: true,
  kotShowTokenNo: true,
  kotShowWaiterName: true,
  kotShowSection: true,
  kotHeaderSize: 12,
  kotHeaderBold: false,

  kotItemNameBold: true,
  kotItemNameSize: 14,
  kotItemNameUppercase: false,
  kotShowItemQty: true,
  kotShowItemVariant: true,
  kotShowItemAddons: true,
  kotShowItemInstructions: true,
  kotInstructionsBold: true,
  kotInstructionsSize: 12,
  kotShowItemPrice: false,

  kotShowTotalQty: true,
  kotShowOrderNote: true,
  kotOrderNoteBold: true,
  kotOrderNoteSize: 12,
  kotShowPriority: true,
  kotShowFooterMessage: false,
  kotFooterText: '',
  kotShowCreatedAt: true,
  kotShowPoweredBy: false,
  kotPreviewWidth: 78,

  // ═══ Cancel KOT Template Defaults ═══
  cancelKotShowTitle: true,
  cancelKotTitle: 'CANCEL KOT',
  cancelKotTitleSize: 16,
  cancelKotTitleBold: true,
  cancelKotShowKotNumber: true,
  cancelKotShowDate: true,
  cancelKotShowTime: true,
  cancelKotShowTableNo: true,
  cancelKotShowOrderType: true,
  cancelKotShowWaiterName: true,
  cancelKotShowReason: true,
  cancelKotShowItems: true,
  cancelKotItemBold: true,
  cancelKotShowItemQty: true,
  cancelKotShowFooterMessage: true,
  cancelKotFooterText: 'This KOT has been CANCELLED',
  cancelKotShowPoweredBy: false,
  cancelKotPreviewWidth: 78,
};

export const useReceiptSettingsStore = create<ReceiptSettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setField: (key, value) => set({ [key]: value }),

      toggleField: (key) =>
        set((state) => {
          const current = state[key];
          if (typeof current === 'boolean') {
            return { [key]: !current };
          }
          return {};
        }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'petbharke-receipt-settings',
    }
  )
);
