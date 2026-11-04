"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, CheckCircle2, ArrowRight, UserCheck, 
  CreditCard, Lock, Clock, AlertCircle, RefreshCw,
  MessageSquare, PauseCircle, PlayCircle, FileText, Check, DollarSign
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FormattedMarkdown } from "@/components/formatted-markdown";

function InviteContent() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { user, token: authToken, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Hold / Change Request state
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const [submittingHold, setSubmittingHold] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInvitation(token);
      setInvitation(data);
    } catch (err: any) {
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !invitation) return;
    try {
      setAccepting(true);
      const res = await api.acceptInvitation(token, {
        user_id: user?.id,
        email: user?.email || invitation?.invitee_email,
        name: user?.name || "Collaborator"
      });

      // Accept latest contract if present
      if (invitation.project?.latest_contract?.id && user?.id) {
        try {
          await api.acceptContract(invitation.project.latest_contract.id, user.id, invitation.role);
        } catch (e) {
          console.error("Contract acceptance sync:", e);
        }
      }

      // Route to project workspace
      router.push(`/projects/${res.project_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRequestMessage.trim() || !invitation?.project?.latest_contract?.id) return;
    try {
      setSubmittingHold(true);
      await api.holdContract(
        invitation.project.latest_contract.id,
        { reason: changeRequestMessage },
        user?.id,
        invitation.role
      );
      setIsHoldModalOpen(false);
      setChangeRequestMessage("");
      setActionSuccessMessage("Agreement placed ON HOLD. Your change request has been delivered to the contractor.");
      // Reload invitation state
      await loadInvitation();
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      alert("Error requesting changes: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingHold(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw className="h-7 w-7 animate-spin text-[#0070ba] mb-3" />
        <p className="text-xs font-semibold">Validating contract invitation credentials...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-white border border-slate-200 rounded-lg text-center space-y-4">
        <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Invalid or Expired Invitation</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || "This invitation link has expired or has already been completed."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const proj = invitation.project;
  const latestContract = proj?.latest_contract;
  const isOnHold = latestContract?.is_on_hold || proj?.status === "AGREEMENT_ON_HOLD";

  // If user is not logged in, prompt sign in or sign up with redirect
  if (!user && !authToken) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 space-y-6 font-sans">
        <div className="text-center">
          <Image
            src="/veylora-logo.png"
            alt="Veylora Bridge AI"
            width={160}
            height={56}
            className="h-9 w-auto object-contain mx-auto mb-3"
            priority
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5 text-center">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center mx-auto">
            <Lock className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">
              Sign In to Review Agreement
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              <strong className="text-slate-800">{invitation.inviter?.name || "Contractor"}</strong> invited you to review and collaborate on <strong className="text-slate-800">{proj.title}</strong>.
            </p>
          </div>

          {/* Quick Extracted Summary */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Project:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{proj.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Agreed Budget:</span>
              <span className="font-bold text-slate-900">${proj.budget} {proj.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kickoff Advance:</span>
              <span className="font-bold text-[#0070ba]">
                {proj.advance_amount > 0 ? `$${proj.advance_amount} ${proj.currency}` : "No Advance (0%)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invited Role:</span>
              <span className="font-semibold text-slate-900 uppercase">{invitation.role}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="w-full py-2.5 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Sign In to Accept Agreement</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/signup?redirect=/invite/${token}`}
              className="w-full py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
            >
              <span>Create New Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 font-sans">
      {/* Top Branding Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Image
          src="/veylora-logo.png"
          alt="Veylora Bridge AI"
          width={150}
          height={52}
          className="h-8 w-auto object-contain"
          priority
        />
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Signed in as <strong className="text-slate-900">{user?.name}</strong></span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
            {invitation.role}
          </span>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Agreement Review Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6">
        {/* Header & Status */}
        <div className="space-y-2 pb-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-[#0070ba] text-xs font-semibold border border-blue-200">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Contract Invitation for {invitation.role.toUpperCase()}</span>
            </span>

            {isOnHold ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold border border-amber-300">
                <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>AGREEMENT ON HOLD (CHANGES REQUESTED)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>READY FOR SIGNATURE</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {proj.title}
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            Prepared by <strong className="text-slate-800">{invitation.inviter?.name || "Contractor"}</strong>. Review deliverables, milestone financial extractions, and acceptance criteria below.
          </p>
        </div>

        {/* Hold Notification Banner (If Changes Requested) */}
        {isOnHold && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <PauseCircle className="h-4 w-4 text-amber-600" />
              <span>Agreement Revision in Progress</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              <strong>Requested Changes:</strong> {latestContract?.hold_reason || "Revisions requested by counterparty."}
            </p>
            <p className="text-amber-700 text-[11px] pt-1">
              The contractor has been notified to apply revisions. Once saved, the updated version will reflect here automatically for final approval.
            </p>
          </div>
        )}

        {/* AI-Extracted Financial Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Agreed Value</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">${proj.budget.toLocaleString()} {proj.currency}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fixed contract scope</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Kickoff Advance</div>
            <div className="text-lg font-bold text-[#0070ba] mt-0.5">
              {proj.advance_amount > 0 ? `$${proj.advance_amount.toLocaleString()} ${proj.currency}` : "None ($0)"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {proj.advance_amount > 0 ? "Deposit required before start" : "0% upfront advance"}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Held Milestone Escrow</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">${proj.held_balance.toLocaleString()} {proj.currency}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Secured pending proof</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Milestones</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{proj.milestones?.length || 0} Stages</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Sequential release cadence</div>
          </div>
        </div>

        {/* Structured Milestone Deliverables */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Agreed Milestone Deliverables &amp; Acceptance Criteria
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {proj.milestones?.map((m: any, idx: number) => (
              <div key={m.id || idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{m.title}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ${m.amount?.toLocaleString()} {m.currency}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pl-7">{m.description}</p>

                {m.criteria && m.criteria.length > 0 && (
                  <div className="pl-7 space-y-1 pt-1">
                    <div className="text-[11px] font-semibold text-slate-600">Verification Criteria:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                      {m.criteria.map((c: any, cIdx: number) => (
                        <li key={c.id || cIdx}>
                          <strong>{c.title}</strong>: {c.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contract Markdown Preview */}
        {latestContract?.content_markdown && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Agreement Terms (Version {latestContract.version})
              </h2>
            </div>
            <div className="p-5 rounded-lg bg-slate-50/70 border border-slate-200 max-h-72 overflow-y-auto">
              <FormattedMarkdown content={latestContract.content_markdown} />
            </div>
          </div>
        )}

        {/* Negotiation & Comments History */}
        {latestContract?.comments && latestContract.comments.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Negotiation &amp; Revision Log
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {latestContract.comments.map((cm: any) => (
                <div key={cm.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800">{cm.author_name} ({cm.author_role})</span>
                    <span>{new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-700">{cm.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsHoldModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-amber-600" />
            <span>Request Changes / Put On Hold</span>
          </button>

          <button
            type="button"
            disabled={accepting || isOnHold}
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {accepting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Signing Agreement...</span>
              </>
            ) : isOnHold ? (
              <span>Hold Active — Awaiting Revision</span>
            ) : (
              <>
                <span>Approve &amp; Sign Agreement</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal: Request Changes & Put Agreement on Hold */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-600" />
                <span>Request Agreement Changes</span>
              </h3>
              <p className="text-xs text-slate-500">
                Placing the agreement on hold notifies the contractor to update the scope, timeline, or advance percentage before you sign.
              </p>
            </div>

            <form onSubmit={handleRequestChanges} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Changes &amp; Feedback:
                </label>
                <textarea
                  required
                  rows={4}
                  value={changeRequestMessage}
                  onChange={(e) => setChangeRequestMessage(e.target.value)}
                  placeholder="e.g. Please adjust Milestone 1 budget to $400 and reduce timeline to 10 business days."
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0070ba]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHold}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {submittingHold ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending Hold Request...</span>
                    </>
                  ) : (
                    <span>Submit &amp; Put On Hold</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-400 text-xs">
        Loading invitation...
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
