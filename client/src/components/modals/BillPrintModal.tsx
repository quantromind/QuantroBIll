import React from 'react';
import { Printer, X, MessageSquare } from 'lucide-react';
import type { OrderItem, OrderType, PaymentMode } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useReceiptSettingsStore } from '../../store/receiptSettingsStore';

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType: OrderType;
  items: OrderItem[];
  subTotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  packagingCharge?: number;
  billNumber?: string;
  kotNumber?: string;
  tableNumber?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  orderType,
  items,
  subTotal,
  cgst,
  sgst,
  grandTotal,
  packagingCharge = 0,
  billNumber = 'BILL-74',
  kotNumber = 'KOT-104',
  tableNumber,
  customerPhone,
  paymentMode,
}) => {
  const { activeOutlet, tenant, user } = useAuthStore();
  const rs = useReceiptSettingsStore();
  const [printStatus, setPrintStatus] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).desktopApi?.isElectron);

  const outletName = activeOutlet?.name || tenant?.businessName || 'The Magic Bottle';
  const address = rs.addressLine1 || activeOutlet?.address || 'Wakad, Pune, Maharashtra 411057';
  const phone = rs.contactNumber || activeOutlet?.phone || '07969 223344';
  const gstin = rs.gstinNumber || '27AABCU9603R1ZM';
  const fssai = rs.fssaiNumber || '11521034000123';
  const email = rs.emailAddress || '';

  const handlePrint = async () => {
    if ((window as any).desktopApi?.printEscPosRaw) {
      try {
        setPrintStatus('Spooling ESC/POS Thermal Receipt & Kicking Cash Drawer...');
        const sep = '--------------------------------\n';
        let rawReceipt = `${outletName.toUpperCase()}\n${address}\nPh: ${phone}\nGSTIN: ${gstin}\n`;
        rawReceipt += sep;
        rawReceipt += `Bill No: ${billNumber}  | KOT: ${kotNumber}\n`;
        rawReceipt += `Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
        const typeLabel =
          orderType === 'TakeAway'
            ? 'TAKE AWAY'
            : orderType === 'Parcel'
            ? 'PARCEL'
            : orderType === 'DineIn'
            ? 'DINE-IN'
            : orderType === 'Delivery'
            ? 'DELIVERY'
            : orderType;
        rawReceipt += `Type: ${typeLabel} ${tableNumber ? `| Table: ${tableNumber}` : ''}\n`;
        rawReceipt += `Biller: ${user?.fullName || 'Cashier'}\n`;
        rawReceipt += sep;
        let headerRow = '';
        if (rs.showItemSerialNo) headerRow += '#  ';
        headerRow += 'ITEM              ';
        if (rs.showItemQty) headerRow += ' QTY';
        if (rs.showItemRate) headerRow += '  RATE';
        if (rs.showItemAmount) headerRow += '   AMT';
        rawReceipt += `${headerRow}\n`;
        rawReceipt += sep;
        items.forEach((item, idx) => {
          let row = '';
          if (rs.showItemSerialNo) row += `${(idx + 1).toString().padEnd(3, ' ')}`;
          row += item.name.substring(0, 16).padEnd(16, ' ');
          if (rs.showItemQty) row += ` ${item.quantity.toString().padStart(4, ' ')}`;
          if (rs.showItemRate) row += ` ${item.unitPrice.toString().padStart(6, ' ')}`;
          if (rs.showItemAmount) row += ` ${item.totalPrice.toString().padStart(6, ' ')}`;
          rawReceipt += `${row}\n`;
        });
        rawReceipt += sep;
        rawReceipt += `Sub Total:            ₹${subTotal.toFixed(2)}\n`;
        if (packagingCharge > 0) {
          rawReceipt += `Packaging Fee:        ₹${packagingCharge.toFixed(2)}\n`;
        }
        rawReceipt += `CGST (2.5%):          ₹${cgst.toFixed(2)}\n`;
        rawReceipt += `SGST (2.5%):          ₹${sgst.toFixed(2)}\n`;
        rawReceipt += `GRAND TOTAL:          ₹${grandTotal.toFixed(2)}\n`;
        rawReceipt += `Payment: ${paymentMode} (PAID)\n`;
        rawReceipt += sep;

        const res = await (window as any).desktopApi.printEscPosRaw({ content: rawReceipt });
        await (window as any).desktopApi.openCashDrawer();
        
        if (res?.success) {
          setPrintStatus('✓ ESC/POS Spooled to Spooler & Drawer Kicked!');
          setTimeout(() => setPrintStatus(null), 4000);
        } else {
          setPrintStatus('Printed via system fallback');
          window.print();
        }
      } catch (err) {
        console.error('Desktop print error:', err);
        window.print();
      }
    } else {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    alert(`E-Bill receipt link dispatched via WhatsApp to ${customerPhone || 'Customer'}!`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">Thermal Bill & Receipt Preview</span>
                {isDesktop && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">
                    ESC/POS Hardware
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 touch-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {printStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <span>🖨️ {printStatus}</span>
          </div>
        )}

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          <div className="bg-white border border-slate-300 shadow-xs p-5 w-80 font-mono text-[11px] leading-relaxed text-slate-800">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              {rs.showRestaurantName && (
                <h2
                  className="uppercase tracking-wider text-slate-900"
                  style={{
                    fontSize: rs.restaurantNameSize * 0.9,
                    fontWeight: rs.restaurantNameBold ? 900 : 700,
                  }}
                >
                  {outletName}
                </h2>
              )}
              {rs.showAddress && (
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{address}</p>
              )}
              {rs.showContactNumber && (
                <p className="text-[10px] text-slate-500">Ph: {phone}</p>
              )}
              {rs.showEmail && email && (
                <p className="text-[10px] text-slate-500">{email}</p>
              )}
              {rs.showGSTIN && (
                <p className="text-[10px] font-bold text-slate-700 mt-1">GSTIN: {gstin}</p>
              )}
              {rs.showFSSAI && (
                <p className="text-[10px] text-slate-500">FSSAI: {fssai}</p>
              )}
            </div>

            {/* Invoice Title */}
            {rs.showInvoiceTitle && (
              <div className="text-center py-1 border-b border-dashed border-slate-300">
                <span
                  className="uppercase tracking-widest text-slate-900"
                  style={{
                    fontSize: rs.invoiceTitleSize,
                    fontWeight: rs.invoiceTitleBold ? 900 : 600,
                  }}
                >
                  {rs.invoiceTitle}
                </span>
              </div>
            )}

            {/* Bill Details */}
            <div
              className="py-2 border-b border-dashed border-slate-300 space-y-0.5"
              style={{
                fontSize: rs.infoRowSize * 0.8,
                fontWeight: rs.infoRowBold ? 700 : 400,
              }}
            >
              {rs.showBillNo && (
                <div className="flex justify-between">
                  <span>Bill No: <strong>{billNumber}</strong></span>
                  <span>KOT: <strong>{kotNumber}</strong></span>
                </div>
              )}
              {rs.showDate && (
                <div className="flex justify-between">
                  <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                  {rs.showTime && (
                    <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              )}
              {rs.showOrderType && (
                <div className="flex justify-between">
                  <span>
                    Type:{' '}
                    <strong>
                      {orderType === 'TakeAway'
                        ? 'TAKE AWAY'
                        : orderType === 'Parcel'
                        ? 'PARCEL'
                        : orderType === 'DineIn'
                        ? 'DINE-IN'
                        : orderType === 'Delivery'
                        ? 'DELIVERY'
                        : orderType}
                    </strong>
                  </span>
                  {rs.showTableNo && tableNumber && <span>Table: <strong>{tableNumber}</strong></span>}
                </div>
              )}
              {rs.showTokenNo && (
                <div className="flex justify-between">
                  <span>Token No: {kotNumber}</span>
                </div>
              )}
              {rs.showOrderBy && <div>Biller: {user?.fullName || 'Cashier'}</div>}
              {rs.showCustomerPhone && customerPhone && <div>Cust: {customerPhone}</div>}
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <table className="w-full text-left border-collapse" style={{ fontSize: rs.itemFontSize * 0.85 }}>
                <thead>
                  <tr className="font-bold border-b border-slate-200">
                    {rs.showItemSerialNo && <th className="py-0.5 text-left w-5">#</th>}
                    {rs.showItemCode && <th className="py-0.5 text-left w-10">CODE</th>}
                    <th className="py-0.5 text-left">ITEM</th>
                    {rs.showItemQty && <th className="py-0.5 text-center w-7">QTY</th>}
                    {rs.showItemRate && <th className="py-0.5 text-right w-12">RATE</th>}
                    {rs.showItemAmount && <th className="py-0.5 text-right w-12">AMT</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-dashed border-slate-100 last:border-b-0">
                      {rs.showItemSerialNo && (
                        <td className="py-0.5 text-left align-top font-bold text-slate-400 text-[9px]">{idx + 1}</td>
                      )}
                      {rs.showItemCode && (
                        <td className="py-0.5 text-left align-top font-mono text-slate-500 text-[9px]">
                          {(item as any).code || (item as any).itemCode || `ITM-${idx + 1}`}
                        </td>
                      )}
                      <td className="py-0.5 align-top">
                        <span
                          className="font-sans font-medium block"
                          style={{
                            fontWeight: rs.itemNameBold ? 700 : 500,
                            fontSize: rs.itemNameSize * 0.85,
                            textTransform: rs.itemNameUppercase ? 'uppercase' : 'none',
                          }}
                        >
                          {item.name}
                        </span>
                        {rs.showItemVariant && item.variantName && (
                          <span className="block text-[9px] text-slate-500">({item.variantName})</span>
                        )}
                        {rs.showItemAddons && item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <p className="text-[9px] text-slate-500 pl-0.5">Addons: {item.selectedAddOns.join(', ')}</p>
                        )}
                        {rs.showItemNote && item.itemNote && (
                          <p className="text-[9px] text-slate-400 pl-0.5 italic">* {item.itemNote}</p>
                        )}
                      </td>
                      {rs.showItemQty && (
                        <td className="py-0.5 text-center align-top font-bold">{item.quantity}</td>
                      )}
                      {rs.showItemRate && (
                        <td className="py-0.5 text-right align-top text-slate-500">₹{item.unitPrice}</td>
                      )}
                      {rs.showItemAmount && (
                        <td className="py-0.5 text-right align-top font-bold">₹{item.totalPrice}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Taxes */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              {rs.showSubTotal && (
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
              )}
              {rs.showTaxBreakdown && (
                <>
                  <div className="flex justify-between">
                    <span>CGST (2.5%):</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (2.5%):</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {packagingCharge > 0 && (
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Packaging Fee (Parcel):</span>
                  <span>₹{packagingCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200 text-slate-900">
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                <span>Payment Mode:</span>
                <span>{paymentMode} (Paid)</span>
              </div>
            </div>

            {/* Order Note */}
            {rs.showOrderNote && (
              <div
                className="py-2 border-b border-dashed border-slate-300"
                style={{ fontSize: rs.orderNoteSize, fontWeight: rs.orderNoteBold ? 700 : 400 }}
              >
                <span className="font-semibold">{rs.orderNoteLabel}:</span>
              </div>
            )}

            {/* UPI QR Code */}
            {rs.showUPIQR && (
              <div className="py-3 text-center border-b border-dashed border-slate-300">
                <div className="w-20 h-20 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center rounded-sm mb-1">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="w-4 h-4 bg-slate-900"></div>
                    <div className="w-4 h-4 bg-slate-900"></div>
                    <div className="w-4 h-4 bg-slate-900"></div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500">Scan & Pay with any UPI App</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              {rs.showFooterMessage && (
                <p className="font-bold">{rs.thankYouText}</p>
              )}
              {rs.showPoweredBy && (
                <p className="text-[9px]">Powered by QuantroBill POS</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-white border-t border-slate-200 grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 touch-btn shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send E-Bill</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-3 rounded-lg text-xs touch-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
