"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, PauseCircle, CheckCircle2, RefreshCw, User, ShieldCheck } from "lucide-react";
import { api, ContractComment } from "@/lib/api";

interface ContractCommentsPanelProps {
  contractId: string;
  projectId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  isOnHold?: boolean;
  holdReason?: string;
  onRequestHold?: (reason: string) => void;
  onResumeReview?: () => void;
  onCommentsUpdated?: () => void;
}

export function ContractCommentsPanel({
  contractId,
  projectId,
  userId,
  userName = "Collaborator",
  userRole = "client",
  isOnHold = false,
  holdReason,
  onRequestHold,
  onResumeReview,
  onCommentsUpdated
}: ContractCommentsPanelProps) {
  const [comments, setComments] = useState<ContractComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contractId) {
      loadComments();
    }
  }, [contractId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await api.getContractComments(contractId);
      setComments(data);
    } catch (err) {
      console.error("Error loading contract comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.addContractComment(
        contractId,
        { message: newMessage.trim(), comment_type: "COMMENT" },
        userId,
        userRole
      );
      setNewMessage("");
      await loadComments();
      if (onCommentsUpdated) onCommentsUpdated();
    } catch (err: any) {
      alert("Failed to send comment: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#0070ba]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Agreement Negotiation &amp; Revision Thread
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {comments.length} Messages
        </span>
      </div>

      {/* On-Hold Status Notice */}
      {isOnHold && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <PauseCircle className="h-4 w-4 text-amber-600" />
            <span>Agreement Currently On Hold</span>
          </div>
          <p className="text-amber-800">
            <strong>Requested Changes:</strong> {holdReason || "Revisions requested by counterparty."}
          </p>
          {userRole === "freelancer" && onResumeReview && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onResumeReview}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors"
              >
                Mark Revisions Complete &amp; Lift Hold
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0070ba]" />
            <span>Loading negotiation thread...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No revision requests or comments yet. You can suggest edits or ask questions below.
          </div>
        ) : (
          comments.map((cm) => {
            const isHold = cm.comment_type === "HOLD_NOTICE";
            const isRevision = cm.comment_type === "REVISION_REQUEST";

            return (
              <div
                key={cm.id}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  isHold
                    ? "bg-amber-50/70 border-amber-200"
                    : isRevision
                    ? "bg-blue-50/70 border-blue-200"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>{cm.author_name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-200/70">
                      {cm.author_role}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(cm.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">{cm.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Suggest an edit, ask about milestones, or comment..."
            className="w-full pl-3 pr-20 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
          />
          <button
            type="submit"
            disabled={submitting || !newMessage.trim()}
            className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {submitting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
