"use client";

import React, { useState } from "react";
import { Edit3, Check, X, RefreshCw, FileText, AlertCircle, Eye, Sparkles, DollarSign, ArrowRight } from "lucide-react";
import { api, Contract, ContractAIEditResult } from "@/lib/api";
import { FormattedMarkdown } from "@/components/formatted-markdown";

interface ContractEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  userId?: string;
  userRole?: string;
  initialInstruction?: string;
  onSaved: (updatedContract: Contract) => void;
}

export function ContractEditorModal({
  isOpen,
  onClose,
  contract,
  userId,
  userRole = "freelancer",
  initialInstruction,
  onSaved
}: ContractEditorModalProps) {
  const [contentMarkdown, setContentMarkdown] = useState(contract.content_markdown || "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Revision Assistant state
  const [aiInstruction, setAiInstruction] = useState(initialInstruction || contract.hold_reason || "");
  const [isAiRevising, setIsAiRevising] = useState(false);
  const [aiResult, setAiResult] = useState<ContractAIEditResult | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setContentMarkdown(contract.content_markdown || "");
      if (initialInstruction) {
        setAiInstruction(initialInstruction);
      } else if (contract.hold_reason) {
        setAiInstruction(contract.hold_reason);
      }
      setError(null);
      setAiResult(null);
    }
  }, [isOpen, contract, initialInstruction]);

  if (!isOpen) return null;

  const handleAiRevise = async (customInstruction?: string) => {
    const instruction = customInstruction || aiInstruction;
    if (!instruction.trim()) {
      setError("Please enter a revision instruction or counterparty comment.");
      return;
    }

    try {
      setIsAiRevising(true);
      setError(null);
      const res = await api.aiEditContract(contract.id, instruction, userId, userRole);
      setContentMarkdown(res.revised_markdown);
      setAiResult(res);
      setAiInstruction("");

      // Immediately notify parent so the project workspace updates in real-time
      if (onSaved) {
        onSaved({
          ...contract,
          version: (contract.version || 1) + 1,
          content_markdown: res.revised_markdown,
          is_on_hold: false,
          hold_reason: undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to revise agreement with AI");
    } finally {
      setIsAiRevising(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentMarkdown.trim()) {
      setError("Contract content cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateContract(
        contract.id,
        { content_markdown: contentMarkdown },
        userId,
        userRole
      );
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save contract edits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Edit Agreement (Version {contract.version} &rarr; {contract.version + 1})
              </h3>
              <p className="text-slate-500 text-xs">
                Revise milestones, budget terms, and acceptance criteria. All numbers synchronize across the platform.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Revision Assistant & Comment Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0070ba]" />
              <span className="text-xs font-bold text-slate-900">AI Revision Assistant &amp; Comment Negotiator</span>
            </div>
            <span className="text-[11px] text-slate-500">Auto-recalculates budget, milestones &amp; invoices</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAiRevise();
                }
              }}
              placeholder="e.g. 'Client said budget must be 1000 instead of 1500', or 'Change milestone 1 to $300'..."
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
              disabled={isAiRevising}
            />
            <button
              type="button"
              onClick={() => handleAiRevise()}
              disabled={isAiRevising || !aiInstruction.trim()}
              className="px-4 py-2 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isAiRevising ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Revising...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Revise with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Preset quick test pills */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-0.5">
            <span className="font-medium text-slate-600">Quick suggestions:</span>
            {contract.hold_reason && (
              <button
                type="button"
                onClick={() => {
                  setAiInstruction(contract.hold_reason || "");
                  handleAiRevise(contract.hold_reason);
                }}
                disabled={isAiRevising}
                className="px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Apply Client Hold Request: &ldquo;{contract.hold_reason.slice(0, 45)}...&rdquo;</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const text = "Client requested to increase days for testing and review";
                setAiInstruction(text);
                handleAiRevise(text);
              }}
              disabled={isAiRevising}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              &ldquo;Increase delivery timeline by 14 days&rdquo;
            </button>
            <button
              type="button"
              onClick={() => {
                const text = "Adjust budget breakdown to 20% kickoff advance and 80% escrow";
                setAiInstruction(text);
                handleAiRevise(text);
              }}
              disabled={isAiRevising}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              &ldquo;20% Advance / 80% Escrow&rdquo;
            </button>
            <button
              type="button"
              onClick={() => handleAiRevise("Reduce total budget to $1,000 USD")}
              disabled={isAiRevising}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              &ldquo;Reduce budget to $1,000 USD&rdquo;
            </button>
          </div>

          {/* AI Extracted Financials Notification */}
          {aiResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-black text-emerald-950">AI Revision Applied &amp; Synchronized!</div>
                  <div className="text-[11px] text-emerald-800">
                    Budget ${aiResult.extracted_budget.toLocaleString()} USD • Advance ${aiResult.extracted_advance.toLocaleString()} USD • Escrow ${aiResult.extracted_held_balance.toLocaleString()} USD.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Done / View Updated Workspace →
              </button>
            </div>
          )}
        </div>

        {/* Editor & Preview Area */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Agreement Markdown (Edit or Preview):
              </label>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    mode === "edit"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Edit Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    mode === "preview"
                      ? "bg-white text-[#0070ba] font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Formatted Preview</span>
                </button>
              </div>
            </div>

            {mode === "edit" ? (
              <textarea
                required
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Write your contract terms in markdown..."
                className="flex-1 w-full p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0070ba] resize-none min-h-[300px]"
              />
            ) : (
              <div className="flex-1 w-full p-4 rounded-lg border border-slate-200 bg-white overflow-y-auto min-h-[300px] max-h-[380px]">
                <FormattedMarkdown content={contentMarkdown} />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              Saving automatically synchronizes budget, milestones, escrow, and invoices everywhere.
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Synchronizing &amp; Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Save &amp; Synchronize Everywhere</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
