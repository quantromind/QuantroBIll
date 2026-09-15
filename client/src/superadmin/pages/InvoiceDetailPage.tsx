import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { billingApi } from '../services/billingApi';
import type { PlatformInvoice } from '../types';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<PlatformInvoice | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      billingApi
        .getInvoiceById(id)
        .then((res) => {
          if (res.success && res.data) {
            setInvoice(res.data);
            setTenant(res.tenant);
          } else {
            setError('Invoice not found.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load invoice details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Generating invoice view...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">{error || 'Invoice record not found.'}</h3>
        <button
          onClick={() => navigate('/superadmin/billing')}
          className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 hover:underline"
        >
          Return to Billing List
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/superadmin/billing')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* INVOICE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">QuantroBill SaaS</h2>
              <p className="text-xs text-slate-400">Tax Invoice & Subscription Receipt</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span
              className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              Status: {invoice.status}
            </span>
            <p className="text-sm font-mono font-bold text-slate-900">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Billed From & Billed To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs leading-relaxed">
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Billed By</p>
            <p className="font-bold text-slate-900 text-sm">QuantroMind Technologies Private Limited</p>
            <p className="text-slate-500">Tower B, Cyber City Hub, Magarpatta</p>
            <p className="text-slate-500">Pune, Maharashtra 411028</p>
            <p className="text-slate-500">GSTIN: 27AAACQ1024B1Z5</p>
            <p className="text-slate-500">Email: billing@quantromind.com</p>
          </div>

          <div className="sm:text-right">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Billed To (Tenant)</p>
            <p className="font-bold text-slate-900 text-sm">{invoice.tenantName}</p>
            <p className="text-slate-500">Tenant ID: {invoice.tenantId}</p>
            {tenant?.ownerEmail && <p className="text-slate-500">{tenant.ownerEmail}</p>}
            {tenant?.ownerPhone && <p className="text-slate-500">{tenant.ownerPhone}</p>}
            {tenant?.gstin && <p className="text-slate-500">GSTIN: {tenant.gstin}</p>}
            {tenant?.city && (
              <p className="text-slate-500">
                {tenant.city}, {tenant.state}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden my-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4 text-right">GST (18%)</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-900">QuantroBill {invoice.planName} Tier</div>
                  <div className="text-[11px] text-slate-500">
                    SaaS Cloud Restaurant Billing, KDS, & Operations Management
                  </div>
                </td>
                <td className="py-4 px-4">{invoice.billingCycle}</td>
                <td className="py-4 px-4 text-right font-mono">₹{invoice.amount.toLocaleString('en-IN')}</td>
                <td className="py-4 px-4 text-right font-mono">₹{invoice.taxAmount.toLocaleString('en-IN')}</td>
                <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/50 border-t border-slate-200 text-xs font-bold text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-right">
                  Total Payable Amount ({invoice.currency}):
                </td>
                <td className="py-3 px-4 text-right text-base text-blue-600 font-mono">
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Transaction Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800">Payment Reference:</div>
          <div>Method: {invoice.paymentMethod || 'UPI/Online Gateway'}</div>
          {invoice.transactionRef && <div>Transaction Ref: {invoice.transactionRef}</div>}
          {invoice.paidAt && (
            <div>Paid On: {new Date(invoice.paidAt).toLocaleString('en-IN')}</div>
          )}
          {invoice.notes && <div className="text-slate-500 italic mt-2">Notes: {invoice.notes}</div>}
        </div>
      </div>
    </div>
  );
};
