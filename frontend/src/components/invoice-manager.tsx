"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FileText, CreditCard, Lock, CheckCircle2, ArrowRight,
  ExternalLink, Download, Printer, ShieldCheck, RefreshCw,
  AlertCircle, Upload, Building, Sparkles, Check, Wallet, Clock
} from "lucide-react";
import { api, Invoice, Project } from "@/lib/api";
import { PayPalPayoutModal } from "@/components/paypal-payout-modal";

interface InvoiceManagerProps {
  projectId: string;
  project: Project;
  userRole?: string;
  userId?: string;
  onInvoiceUpdated?: () => void;
  onOpenPayPalModal?: (amount: number, invoiceTitle: string) => void;
}

export function InvoiceManager({
  projectId,
  project,
  userRole = "client",
  userId,
  onInvoiceUpdated,
  onOpenPayPalModal
}: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [contractorLogoUrl, setContractorLogoUrl] = useState("");
  const [savingLogos, setSavingLogos] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // PayPal Payout Modal state
  const [payoutInvoice, setPayoutInvoice] = useState<Invoice | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [projectId, project.budget, project.advance_amount, project.milestones?.length]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getProjectInvoices(projectId);
      setInvoices(data);
      if (data.length > 0) {
        setClientLogoUrl(data[0].client_logo_url || "");
        setContractorLogoUrl(data[0].contractor_logo_url || "");
      }
    } catch (e) {
      console.error("Failed to load invoices:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (inv: Invoice) => {
    if (onOpenPayPalModal) {
      onOpenPayPalModal(inv.amount, `Escrow Deposit: ${inv.title}`);
      return;
    }
    try {
      setActionLoadingId(inv.id);
      await api.depositInvoice(inv.id, userId || project.client_id);
      setNotification(`Invoice ${inv.invoice_number} funds successfully authorized via PayPal and held in site escrow.`);
      await loadInvoices();
      if (onInvoiceUpdated) onInvoiceUpdated();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert("Deposit failed: " + (err.message || "Unknown error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenPayout = (inv: Invoice) => {
    setPayoutInvoice(inv);
    setIsPayoutModalOpen(true);
  };

  const handleSaveLogos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoices.length === 0) return;
    try {
      setSavingLogos(true);
      await api.updateInvoiceLogos(invoices[0].id, {
        client_logo_url: clientLogoUrl.trim() || undefined,
        contractor_logo_url: contractorLogoUrl.trim() || undefined
      });
      setIsLogoModalOpen(false);
      setNotification("Invoice branding & logos updated successfully.");
      await loadInvoices();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert("Failed to update branding: " + err.message);
    } finally {
      setSavingLogos(false);
    }
  };

  const totalInEscrow = invoices
    .filter(i => i.status === "HELD_IN_ESCROW")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalReleased = invoices
    .filter(i => i.status === "RELEASED")
    .reduce((sum, i) => sum + i.amount, 0);

  // Detect if previous milestone released and next is pending deposit
  const pendingNextInvoice = invoices.find(i => i.status === "PENDING_DEPOSIT");
  const hasAnyReleased = invoices.some(i => i.status === "RELEASED");

  const contractorEmail = project.freelancer?.paypal_email || project.freelancer?.email || "elena@devcraft.io";
  const clientEmail = project.client?.paypal_email || project.client?.email || "alex@acmestudio.io";

  // Clean repetitive "Milestone X: Milestone X:" titles from AI/database
  const formatDisplayTitle = (title: string, orderIndex?: number, isAdvance?: boolean) => {
    if (isAdvance) return "Upfront Kickoff Advance Deposit";
    let clean = (title || "").trim();
    clean = clean.replace(/^(Milestone\s*\d+\s*:\s*)+/gi, "").trim();
    if (orderIndex !== undefined && orderIndex !== null) {
      return `Milestone ${orderIndex}: ${clean || "Deliverable"}`;
    }
    return clean || "Milestone Deliverable";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Branding Customizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black text-white">
              PayPal Settlement Cadence
            </span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="text-[11px] font-bold text-slate-700">Autonomous Escrow Protocol</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-black flex items-center justify-center shrink-0 border border-slate-300 shadow-2xs">
              <FileText className="h-4 w-4 text-black" />
            </div>
            <span>Milestone Invoicing &amp; Sequential PayPal Escrow</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 max-w-2xl leading-relaxed">
            Sequential deposit cadence: Client authorizes escrow funds per milestone; automated AI &amp; test suites verify deliverables before autonomous release to contractor.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLogoModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer hover:border-slate-400"
          >
            <Building className="h-4 w-4 text-slate-500" />
            <span>Customize Logos</span>
          </button>
          <button
            type="button"
            onClick={loadInvoices}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs cursor-pointer hover:text-slate-900"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0070ba]" : ""}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-white border-2 border-black text-black text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Connected PayPal Accounts Status Bar */}
      <div className="p-4 rounded-xl bg-white text-black border-2 border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center p-2 shrink-0">
            <img src="/paypal.png" alt="PayPal" className="h-5 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-black">PayPal Escrow Ledger</span>
              <span className="text-[10px] font-black uppercase text-black bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                Sandbox Active
              </span>
            </div>
            <div className="text-slate-600 text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
              <span>Payer: <strong className="font-mono text-black font-black">{clientEmail}</strong></span>
              <span className="text-slate-400">→</span>
              <span>Payout Wallet: <strong className="font-mono text-black font-black">{contractorEmail}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-black font-bold bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg shrink-0 self-start md:self-auto">
          <ShieldCheck className="h-4 w-4 text-black shrink-0" />
          <span>PayPal Orders v2 &amp; Payouts v1 Protected</span>
        </div>
      </div>

      {/* Sequential Escrow Next Step Alert */}
      {hasAnyReleased && pendingNextInvoice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="text-xs font-black text-black flex items-center gap-2 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-black" />
              <span>Sequential Escrow Next Action Required</span>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed font-semibold">
              Prior deliverable has been released to contractor! Please deposit <strong>{formatDisplayTitle(pendingNextInvoice.title, pendingNextInvoice.order_index, pendingNextInvoice.invoice_type === "ADVANCE")}</strong> (${pendingNextInvoice.amount.toLocaleString()} {project.currency}) to fund the next stage.
            </div>
          </div>
          {userRole === "client" && (
            <button
              type="button"
              onClick={() => handleDeposit(pendingNextInvoice)}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2.5 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <img src="/paypal.png" alt="PayPal" className="h-5 sm:h-5.5 w-auto object-contain brightness-0 invert" />
              <span>Deposit ${pendingNextInvoice.amount.toLocaleString()} via PayPal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Sequential Escrow Status Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Scope */}
        <div className="payflow-card p-5 relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Contract Scope</span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-950 tracking-tight">
            ${project.budget.toLocaleString()} <span className="text-xs font-semibold text-slate-400 font-sans">{project.currency}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{invoices.length} Sequential Milestone Invoices</span>
          </div>
        </div>

        {/* Card 2: Held in Escrow */}
        <div className="payflow-card p-5 relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <span>Held In Site Escrow</span>
            </span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 text-black flex items-center justify-center">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-black tracking-tight">
            ${totalInEscrow.toLocaleString()} <span className="text-xs font-semibold text-slate-500 font-sans">{project.currency}</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>Secured pending automated test verification</span>
          </div>
        </div>

        {/* Card 3: Released */}
        <div className="payflow-card p-5 relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <span>Released to Contractor</span>
            </span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 text-black flex items-center justify-center">
              <Check className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-black tracking-tight">
            ${totalReleased.toLocaleString()} <span className="text-xs font-semibold text-slate-500 font-sans">{project.currency}</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>Disbursed via PayPal Payouts v1</span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0070ba]" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Sequential Milestone Invoices ({invoices.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
            Deposit to Escrow &rarr; Automated Verification &rarr; PayPal Payout &rarr; Next Deposit
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-[#0070ba]" />
            <span className="font-medium">Loading synchronized invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <p className="font-medium">No invoices generated yet for this agreement.</p>
            <button
              onClick={() => api.forceGenerateInvoices(projectId).then(loadInvoices)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Generate Invoices Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const isAdvance = inv.invoice_type === "ADVANCE";
              const isPendingDeposit = inv.status === "PENDING_DEPOSIT";
              const isHeldInEscrow = inv.status === "HELD_IN_ESCROW";
              const isReleased = inv.status === "RELEASED";
              const isDisputed = inv.status === "FROZEN_IN_DISPUTE" || inv.status === "DISPUTED";
              const isActing = actionLoadingId === inv.id;
              const displayTitle = formatDisplayTitle(inv.title, inv.order_index, isAdvance);

              return (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border-l-4 border-l-slate-900 bg-white hover:bg-slate-50/70"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-300">
                        {inv.invoice_number}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${isAdvance
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900 border border-slate-300"
                        }`}>
                        {isAdvance ? "Kickoff Advance" : `Milestone ${inv.order_index}`}
                      </span>

                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-900 border border-slate-300">
                        {inv.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="font-black text-base text-black tracking-tight">{displayTitle}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        <strong>Deadline:</strong> {inv.due_date || "Upon Deliverable"}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>
                        {isAdvance ? "Required prior to development commencement." : "Releasable upon passing automated test criteria."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount</div>
                      <div className="text-xl font-extrabold text-black tracking-tight">
                        ${inv.amount.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">{inv.currency}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* CLIENT ACTIONS */}
                      {userRole === "client" && (
                        <>
                          {/* Action 1: Client Deposits into Escrow */}
                          {isPendingDeposit && (
                            <button
                              type="button"
                              onClick={() => handleDeposit(inv)}
                              disabled={isActing}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <img src="/paypal.png" alt="PayPal" className="h-4.5 w-auto object-contain brightness-0 invert" />
                              <span>Deposit Escrow</span>
                            </button>
                          )}

                          {/* Action 2: Client Releases to Contractor via PayPal Payouts */}
                          {isHeldInEscrow && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayout(inv)}
                              disabled={isActing}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <img src="/paypal.png" alt="PayPal" className="h-4.5 w-auto object-contain brightness-0 invert" />
                              <span>Release via PayPal Payouts</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* FREELANCER STATUS (Contractor receives payments, never deposits or self-releases) */}
                      {userRole === "freelancer" && (
                        <>
                          {isPendingDeposit && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-700" />
                              <span>Awaiting Client Deposit</span>
                            </span>
                          )}

                          {isHeldInEscrow && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-slate-700" />
                              <span>Secured in Escrow</span>
                            </span>
                          )}

                          {inv.status === "RELEASED" && (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 text-slate-700" />
                              <span>Paid to Wallet</span>
                            </span>
                          )}
                        </>
                      )}

                      {/* DISPUTE STATUS (Both Client & Freelancer) */}
                      {isDisputed && (
                        <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-700" />
                          <span>Escrow Frozen (Disputed)</span>
                        </span>
                      )}

                      {/* Action 3: View Official Invoice (Available to All) */}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3.5 py-2 rounded-xl border border-slate-300/90 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:border-slate-400"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Customize Invoice Branding & Dual Logos */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-[#0070ba]" />
                <span>Customize Invoice Branding (Dual Logos)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure custom logos for the contractor studio and client company. Both logos appear alongside the official Veylora Platform Escrow seal.
              </p>
            </div>

            <form onSubmit={handleSaveLogos} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contractor / Agency Studio Logo URL:
                </label>
                <input
                  type="url"
                  value={contractorLogoUrl}
                  onChange={(e) => setContractorLogoUrl(e.target.value)}
                  placeholder="https://example.com/contractor-logo.png"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                />
                <span className="text-[10px] text-slate-400">Displayed on the top-left (Issuer / Contractor) section.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Company Logo URL:
                </label>
                <input
                  type="url"
                  value={clientLogoUrl}
                  onChange={(e) => setClientLogoUrl(e.target.value)}
                  placeholder="https://example.com/client-logo.png"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                />
                <span className="text-[10px] text-slate-400">Displayed on the top-right (Bill To / Client) section.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLogos}
                  className="px-4 py-2 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {savingLogos ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Branding...</span>
                    </>
                  ) : (
                    <span>Save Invoice Branding</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Professional Corporate Invoice Document */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white border border-slate-300 rounded-xl max-w-3xl w-full p-8 space-y-6 shadow-2xl relative my-8 print:p-0 print:border-none print:shadow-none">
            {/* Action Bar (Print & Close) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official Milestone Escrow Invoice
                </span>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {selectedInvoice.invoice_number}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* 1. Header with Dual Branding & Platform Seal */}
            <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
              {/* Left: Contractor / Issuer Details */}
              <div className="space-y-1 max-w-[240px]">
                {selectedInvoice.contractor_logo_url ? (
                  <img src={selectedInvoice.contractor_logo_url} alt="Contractor Logo" className="h-10 w-auto object-contain mb-2" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center mb-1">
                    DEV
                  </div>
                )}
                <div className="font-extrabold text-sm text-slate-900">{project.freelancer?.name || "Elena Rostova"}</div>
                <div className="text-xs text-slate-500">{project.freelancer?.email || "contractor@craftdev.io"}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  PayPal Wallet: <span className="text-[#0070ba] font-bold">{contractorEmail}</span>
                </div>
              </div>

              {/* Center: Veylora Platform Escrow Stamp */}
              <div className="text-center shrink-0">
                <Image
                  src="/veylora-logo.png"
                  alt="Veylora Bridge AI"
                  width={140}
                  height={48}
                  className="h-8 w-auto object-contain mx-auto"
                />
                <div className="text-[9px] font-extrabold text-[#0070ba] uppercase tracking-wider mt-1">
                  PayPal Escrow Protection Layer
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Orders v2 &bull; Payouts v1
                </div>
              </div>

              {/* Right: Client / Billed To Details */}
              <div className="text-right space-y-1 max-w-[240px]">
                {selectedInvoice.client_logo_url ? (
                  <img src={selectedInvoice.client_logo_url} alt="Client Logo" className="h-10 w-auto object-contain ml-auto mb-2" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0070ba] font-black text-sm flex items-center justify-center ml-auto mb-1 border border-blue-200">
                    ACME
                  </div>
                )}
                <div className="font-extrabold text-sm text-slate-900">{project.client?.name || "Alex Rivera"}</div>
                <div className="text-xs text-slate-500">{project.client?.email || "alex@acmestudio.io"}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  PayPal Payer: <span className="text-slate-800 font-bold">{clientEmail}</span>
                </div>
              </div>
            </div>

            {/* 2. Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Invoice Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedInvoice.invoice_number}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date of Issue</span>
                <span className="font-semibold text-slate-800">{new Date(selectedInvoice.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Terms</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.due_date || "Upon Verification"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-[10px] uppercase mt-0.5 ${selectedInvoice.status === "RELEASED"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedInvoice.status === "HELD_IN_ESCROW"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                  {selectedInvoice.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* 3. Itemized Deliverables Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Itemized Milestone Deliverables
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Deliverable Description</th>
                      <th className="p-3 w-36">Verification Protocol</th>
                      <th className="p-3 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.line_items_json && selectedInvoice.line_items_json.length > 0 ? (
                      selectedInvoice.line_items_json.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{item.description}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{selectedInvoice.description}</div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {item.type || "Playwright Suite"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 tabular-nums">
                            ${item.amount.toFixed(2)} USD
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">{formatDisplayTitle(selectedInvoice.title, selectedInvoice.order_index, selectedInvoice.invoice_type === "ADVANCE")}</td>
                        <td className="p-3 text-slate-500 font-mono text-[10px]">{selectedInvoice.invoice_type}</td>
                        <td className="p-3 text-right font-bold text-slate-900 tabular-nums">
                          ${selectedInvoice.amount.toFixed(2)} USD
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Financial Reconciliation Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Project Scope Value:</span>
                <span className="font-bold text-slate-900 tabular-nums">${project.budget.toFixed(2)} USD</span>
              </div>
              {project.advance_amount > 0 && selectedInvoice.invoice_type !== "ADVANCE" && (
                <div className="flex justify-between text-slate-600">
                  <span>Less Upfront Kickoff Advance (Captured):</span>
                  <span className="font-semibold text-slate-700 tabular-nums">-${project.advance_amount.toFixed(2)} USD</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Current Invoice Due:</span>
                <span className="text-[#0070ba] text-base tabular-nums">${selectedInvoice.amount.toFixed(2)} USD</span>
              </div>
            </div>

            {/* 5. PayPal Audit Trail & Escrow Security Guarantee */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs space-y-1.5 font-sans">
              <div className="font-black text-black flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-black" />
                <span>PayPal Orders v2 &bull; Cryptographic Escrow Guarantee</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px] font-medium">
                Funds are held in neutral escrow until deliverable endpoints satisfy all acceptance criteria via the Playwright automated verification engine.
                Disbursement executes directly to contractor&apos;s connected PayPal wallet via PayPal Payouts v1.
              </p>
              {selectedInvoice.paypal_capture_id && (
                <div className="font-mono text-[10px] text-slate-700 pt-1 flex items-center gap-1.5">
                  <span className="font-bold">PayPal Transaction Ref:</span>
                  <strong className="text-black bg-white border border-slate-300 px-1.5 py-0.5 rounded font-black">
                    {selectedInvoice.paypal_capture_id}
                  </strong>
                </div>
              )}
            </div>

            {/* Invoice Action CTAs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 print:hidden">
              <span className="text-[11px] text-slate-500 font-bold">
                Veylora Bridge AI &bull; PayPal International Hackathon 2026 &bull; Verified Ledger
              </span>

              <div className="flex items-center gap-2">
                {/* Client-Only Actions in Modal */}
                {userRole === "client" && selectedInvoice.status === "PENDING_DEPOSIT" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(null);
                      handleDeposit(selectedInvoice);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <img src="/paypal.png" alt="PayPal" className="h-4.5 w-auto object-contain brightness-0 invert" />
                    <span>Deposit ${selectedInvoice.amount.toFixed(2)} via PayPal</span>
                  </button>
                )}

                {userRole === "client" && selectedInvoice.status === "HELD_IN_ESCROW" && (
                  <button
                    type="button"
                    onClick={() => {
                      const inv = selectedInvoice;
                      setSelectedInvoice(null);
                      handleOpenPayout(inv);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <img src="/paypal.png" alt="PayPal" className="h-4.5 w-auto object-contain brightness-0 invert" />
                    <span>Release ${selectedInvoice.amount.toFixed(2)} via PayPal Payouts</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official PayPal Payouts Modal */}
      {payoutInvoice && (
        <PayPalPayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false);
            setPayoutInvoice(null);
          }}
          invoiceId={payoutInvoice.id}
          milestoneId={payoutInvoice.milestone_id || undefined}
          milestoneTitle={payoutInvoice.title}
          amount={payoutInvoice.amount}
          currency={payoutInvoice.currency}
          contractorName={project.freelancer?.name || "Elena Rostova"}
          contractorPayPalEmail={contractorEmail}
          clientId={userId || project.client_id}
          onPayoutSuccess={() => {
            loadInvoices();
            if (onInvoiceUpdated) onInvoiceUpdated();
          }}
          onDepositNextMilestone={(nextInvId, nextAmt) => {
            const nextInv = invoices.find(i => i.id === nextInvId);
            if (nextInv) {
              handleDeposit(nextInv);
            }
          }}
        />
      )}
    </div>
  );
}
