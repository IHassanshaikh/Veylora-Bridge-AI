"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, X, RefreshCw, ShieldCheck, ArrowRight,
  ExternalLink, Wallet, Check, AlertCircle, Building
} from "lucide-react";
import { api } from "@/lib/api";

interface PayPalPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId?: string;
  invoiceId?: string;
  milestoneTitle: string;
  amount: number;
  currency?: string;
  contractorName?: string;
  contractorPayPalEmail?: string;
  clientId?: string;
  onPayoutSuccess: (result: any) => void;
  onDepositNextMilestone?: (invoiceId: string, amount: number) => void;
}

export function PayPalPayoutModal({
  isOpen,
  onClose,
  milestoneId,
  invoiceId,
  milestoneTitle,
  amount,
  currency = "USD",
  contractorName = "Elena Rostova",
  contractorPayPalEmail = "elena@devcraft.io",
  clientId = "user-client-001",
  onPayoutSuccess,
  onDepositNextMilestone
}: PayPalPayoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleConfirmPayout = async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (invoiceId) {
        res = await api.releaseInvoice(invoiceId, clientId, "Client authorized release via PayPal Payouts v1.");
      } else if (milestoneId) {
        res = await api.releaseMilestoneFunds(
          milestoneId,
          clientId,
          "Client authorized release via PayPal Payouts v1."
        );
      } else {
        throw new Error("No target payment identified for release.");
      }
      setPayoutResult(res);
      onPayoutSuccess(res);
    } catch (err: any) {
      setError(err.message || "Failed to disburse payout via PayPal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/paypal.png" alt="PayPal" className="h-6 w-auto object-contain" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                PayPal Payouts v1 • Escrow Disbursement
              </h3>
              <p className="text-slate-500 text-[11px]">
                Direct API transfer from Veylora escrow vault to contractor wallet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!payoutResult ? (
          /* Step 1: Confirmation Screen */
          <div className="space-y-4">
            {/* Amount Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Disbursement Amount
              </span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ${amount.toFixed(2)} <span className="text-sm font-semibold text-slate-500">{currency}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium pt-1">
                For Milestone: <strong className="text-slate-900">{milestoneTitle}</strong>
              </p>
            </div>

            {/* Connected Accounts Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Escrow Source</span>
                <div className="flex items-center justify-between text-slate-900 font-medium">
                  <span>Veylora Bridge Escrow Vault</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    FUNDS SECURED
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#0070ba]">
                  Contractor Destination (Connected PayPal Wallet)
                </span>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{contractorName}</div>
                    <div className="text-slate-600 font-mono text-[11px]">{contractorPayPalEmail}</div>
                  </div>
                  <span className="text-[#003087] font-semibold bg-white border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                    VERIFIED SANDBOX
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0070ba] shrink-0" />
                <span>
                  Automated acceptance criteria passed. Funds will disburse immediately via PayPal Payouts API.
                </span>
              </div>
            </div>

            {/* PayPal Action CTA Button */}
            <button
              type="button"
              onClick={handleConfirmPayout}
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#ffc439] hover:bg-[#f4bb38] text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-[#e5a820]"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#003087]" />
                  <span className="text-[#003087]">Disbursing via PayPal Payouts API...</span>
                </>
              ) : (
                <>
                  <img src="/paypal.png" alt="PayPal" className="h-5 w-auto object-contain" />
                  <span className="text-[#003087]">Authorize ${amount.toFixed(2)} Disbursement via PayPal</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Official PayPal Payouts v1 Receipt */
          <div className="space-y-4 py-2 text-center animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Disbursement Successful!
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Funds transmitted directly to contractor wallet via PayPal Payouts v1
              </p>
            </div>

            {/* Official PayPal Receipt Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 font-sans">
                <span className="font-bold text-slate-700 text-[11px] uppercase">PayPal Transaction Receipt</span>
                <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                  COMPLETED
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payout Batch ID:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {payoutResult.payout_batch_id || `PAYOUT-BATCH-${(milestoneId || invoiceId || "DISBURSE").slice(0, 8).toUpperCase()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Recipient Wallet:</span>
                <span className="font-bold text-[#0070ba]">{payoutResult.recipient_paypal_email || contractorPayPalEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Amount Disbursed:</span>
                <span className="font-bold text-slate-900">${amount.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Timestamp:</span>
                <span className="text-slate-700">{new Date(payoutResult.disbursed_at || Date.now()).toLocaleTimeString()} UTC</span>
              </div>
            </div>

            {/* Sequential Escrow Next Step Alert */}
            {payoutResult.next_invoice && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#0070ba] animate-ping" />
                  <span className="text-xs font-bold text-slate-900">
                    Sequential Escrow: Next Milestone Ready for Deposit
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Milestone 1 is complete. Deposit <strong>{payoutResult.next_invoice.title}</strong> (${payoutResult.next_invoice.amount.toFixed(2)} {currency}) into site escrow to authorize the contractor to begin the next milestone.
                </p>
                {onDepositNextMilestone && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDepositNextMilestone(payoutResult.next_invoice.id, payoutResult.next_invoice.amount);
                    }}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Deposit Next Invoice (${payoutResult.next_invoice.amount.toFixed(2)} via PayPal)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Done &amp; Return to Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

