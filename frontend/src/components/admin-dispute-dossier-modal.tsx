"use client";

import React, { useState, useEffect } from "react";
import { 
  Scale, ShieldAlert, CheckCircle2, ArrowRight, X, 
  RefreshCw, Lock, AlertTriangle, FileText, MessageSquare, Terminal
} from "lucide-react";
import { api, DisputeAIDossier } from "@/lib/api";

interface AdminDisputeDossierModalProps {
  disputeId: string;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (decision: string) => void;
}

export function AdminDisputeDossierModal({
  disputeId,
  isOpen,
  onClose,
  onResolved
}: AdminDisputeDossierModalProps) {
  const [dossier, setDossier] = useState<DisputeAIDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (isOpen && disputeId) {
      loadDossier();
    }
  }, [isOpen, disputeId]);

  const loadDossier = async () => {
    try {
      setLoading(true);
      const data = await api.getDisputeDossier(disputeId);
      setDossier(data);
    } catch (err) {
      console.error("Failed to load dispute dossier:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleResolve = async (decision: "RELEASE_TO_FREELANCER" | "REFUND_TO_CLIENT") => {
    try {
      setResolving(true);
      await api.resolveDispute(disputeId, decision, adminNotes || undefined);
      onResolved(decision);
      onClose();
    } catch (err: any) {
      alert("Error resolving dispute: " + (err.message || "Unknown error"));
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-300 rounded-lg max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Dispute Department Dossier &amp; AI Arbitration Summary
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-50 text-rose-700 border border-rose-200">
                  Escalated to Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI Agent synthesis of contract terms, negotiation comments, and Playwright verification evidence.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#0070ba]" />
            <span>AI Agent reading agreement, conversation logs, and test evidence...</span>
          </div>
        ) : !dossier ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Unable to load dispute dossier. Please try again.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* 1. Frozen Escrow Alert Banner */}
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-rose-700 shrink-0" />
                <div>
                  <div className="font-bold text-rose-900">
                    Escrow Funds Frozen in Dispute Custody: ${dossier.disputed_amount.toLocaleString()} USD
                  </div>
                  <div className="text-rose-700 text-[11px]">
                    Project: <strong>{dossier.project_title}</strong> • Milestone: <strong>{dossier.milestone_title}</strong>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-rose-800 border border-rose-200 self-start sm:self-auto">
                Severity: {dossier.ai_severity}
              </span>
            </div>

            {/* 2. AI Impartial Ruling & Justification */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#0070ba]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    AI Impartial Analysis &amp; Recommended Verdict
                  </span>
                </div>
                <span className="text-xs font-bold text-[#0070ba]">
                  Recommendation: {dossier.ai_recommendation?.split(".")[0]}
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed font-normal">
                {dossier.ai_neutral_verdict}
              </div>

              <div className="p-3 rounded bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900">Suggested Resolution Action:</div>
                <p className="text-slate-600">{dossier.ai_recommendation}</p>
              </div>
            </div>

            {/* 3. Claims Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Client Claim ({dossier.client_name})
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {dossier.client_argument || dossier.reason}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Contractor Rebuttal ({dossier.freelancer_name})
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {dossier.freelancer_argument || "No formal rebuttal submitted."}
                </p>
              </div>
            </div>

            {/* 4. Signed Acceptance Criteria Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Locked Contract Criteria (Signed Baseline)</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {dossier.signed_criteria.map((crit, i) => (
                  <li key={i}>{crit}</li>
                ))}
              </ul>
            </div>

            {/* 5. Playwright Technical Proof of Work Evidence */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                <span>Playwright Automated Verification Evidence</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
                {dossier.verification_evidence_summary}
              </div>
            </div>

            {/* 6. Admin Decision Controls */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compliance Officer Notes (Optional):
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Ruled based on signed milestone criteria and headless test run traces."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve("REFUND_TO_CLIENT")}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {resolving ? "Executing..." : `Refund $${dossier.disputed_amount} to Client`}
                </button>

                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve("RELEASE_TO_FREELANCER")}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {resolving ? "Executing..." : `Disburse $${dossier.disputed_amount} to Contractor`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

