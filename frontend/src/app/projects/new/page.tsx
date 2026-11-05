"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileCode2, ArrowRight, CheckCircle2, Mail, Copy,
  AlertCircle, RefreshCw, ShieldCheck, FileCheck2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FormattedMarkdown } from "@/components/formatted-markdown";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("Modern E-Commerce Storefront");
  const [category, setCategory] = useState("Web Development");
  const [budget, setBudget] = useState(1500);
  const [timelineDays, setTimelineDays] = useState(14);
  const [advancePercent, setAdvancePercent] = useState(30);
  const [inviteeEmail, setInviteeEmail] = useState("client.partner@acme.io");
  const [inviteRole, setInviteRole] = useState<"client" | "freelancer">("client");
  const [brief, setBrief] = useState(
    "Build a responsive e-commerce web storefront with product catalog, cart item increment, and form checkout validation."
  );

  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<any>(null);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const advanceAmount = Math.round((budget * advancePercent) / 100);
  const heldBalance = budget - advanceAmount;

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      // 1. Create Project with email invitation & hybrid payment breakdown
      const currentUserId = user?.id || "user-client-001";
      const isFreelancer = user?.role === "freelancer";
      const project = await api.createProject({
        client_id: isFreelancer ? "user-client-001" : currentUserId,
        freelancer_id: isFreelancer ? currentUserId : "user-freelancer-001",
        title,
        description: brief,
        budget: Number(budget),
        category
      });
      setCreatedProject(project);

      // 2. Generate structured contract with testable acceptance criteria
      const contract = await api.generateContract(project.id, {
        project_title: title,
        brief,
        budget: Number(budget),
        currency: "USD",
        target_timeline_days: Number(timelineDays)
      });
      setGeneratedContract(contract);

      // 3. Issue invitation link and email payload (always generate so user has a shareable link)
      try {
        const inv = await api.createInvitation({
          project_id: project.id,
          inviter_id: currentUserId,
          role: inviteRole,
          invitee_email: inviteeEmail || undefined
        });
        setInvitationData(inv);
      } catch (e) {
        console.warn("Could not create invitation, fallback to project token:", e);
        if (project.invitation_token) {
          setInvitationData({
            token: project.invitation_token,
            invite_url: `/invite/${project.invitation_token}`,
            delivery_status: "READY TO SHARE",
            email_preview: {
              to: inviteeEmail || "Counterparty",
              subject: `Invitation to collaborate on '${project.title}' on Veylora Bridge AI`
            }
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate contract");
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteLink = () => {
    const token = invitationData?.token || invitationData?.invite_url?.replace("/invite/", "") || createdProject?.invitation_token;
    const invitePath = invitationData?.invite_url || (token ? `/invite/${token}` : null);
    if (!invitePath) return;
    const fullUrl = `${window.location.origin}${invitePath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToProject = () => {
    if (createdProject) {
      router.push(`/projects/${createdProject.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Milestone Contract</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            AI converts your requirements into structured deliverables, automated tests, and email invitations.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Contract Architect</span>
        </div>
      </div>

      {!generatedContract ? (
        <form onSubmit={handleGenerateContract} className="payflow-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Next.js SaaS Web Application"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="API / Backend">API / Backend</option>
                <option value="Full-Stack Platform">Full-Stack Platform</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Budget (USD)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
                min={100}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Timeline (Days)
              </label>
              <input
                type="number"
                value={timelineDays}
                onChange={(e) => setTimelineDays(Number(e.target.value))}
                required
                min={1}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Hybrid Payment Breakdown Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hybrid Payment Allocation
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Kickoff Advance: {advancePercent}% (${advanceAmount}) • Held Escrow: {100 - advancePercent}% (${heldBalance})
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={advancePercent}
              onChange={(e) => setAdvancePercent(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">1. Upfront Advance (Kickoff)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">${advanceAmount} USD</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                  <img src="/P.png" alt="PayPal" className="h-3 w-auto object-contain shrink-0" />
                  <span>Paid immediately via PayPal to initiate work</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">2. Secured Held Escrow</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">${heldBalance} USD</div>
                <div className="text-[10px] text-slate-500">Disbursed across milestones after automated test verification</div>
              </div>
            </div>
          </div>

          {/* Email Invitation Field */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Invite Counterparty By Email
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <span>Role:</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-blue-700"
                >
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>
            </div>
            <input
              type="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              placeholder="client@acmestudio.io or freelancer@devcraft.io"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-[11px] text-slate-500">
              An expiring invitation link with project terms will be issued directly for this email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Requirements & Scope Description
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
              placeholder="Describe deliverables and features..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Agreement with Gemini AI...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  <span>Generate Contract & Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Contract Version {generatedContract.version} Generated Successfully</span>
            </div>
            <button
              onClick={handleGoToProject}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs"
            >
              <span>Open Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Invitation Link & Share Banner */}
          {(invitationData || createdProject?.invitation_token) && (
            <div className="payflow-card p-6 bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    {invitationData?.email_preview?.to && invitationData.email_preview.to !== "Counterparty"
                      ? `Invitation Sent to ${invitationData.email_preview.to}`
                      : "Counterparty Invitation Link"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {invitationData?.delivery_status || "READY TO SHARE"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-blue-200 flex items-center justify-between gap-3 overflow-x-auto border border-slate-800">
                <span className="truncate select-all text-xs text-slate-100 font-semibold tracking-wide">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${invitationData?.invite_url || `/invite/${invitationData?.token || createdProject?.invitation_token}`}`
                    : invitationData?.invite_url || `/invite/${invitationData?.token || createdProject?.invitation_token}`}
                </span>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Contract Content */}
          <div className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Version {generatedContract.version}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">Generated Technical Agreement</h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Value</div>
                <div className="text-base font-black text-slate-900">${budget.toLocaleString()} USD</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 max-h-72 overflow-y-auto">
              <FormattedMarkdown content={generatedContract.content_markdown} />
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setGeneratedContract(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
              >
                Edit Brief
              </button>
              <button
                onClick={handleGoToProject}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <span>Enter Project Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
