"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Clock, ShieldCheck, Terminal,
  CreditCard, RefreshCw, X, Scale, Info, FileText,
  Layers, Check, AlertTriangle, ArrowRight, Copy,
  ExternalLink, Play, Lock, AlertCircle,
  HelpCircle, MessageSquare, ChevronRight, Hash,
  PauseCircle, Sparkles
} from "lucide-react";
import { api, Project, Milestone, VerificationRun, AuditEvent } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  PayPalCheckoutModal,
  PayPalSmartButtons,
  PayPalOrderSummaryCard
} from "@/components/paypal-checkout-modal";
import { ContractCommentsPanel } from "@/components/contract-comments-panel";
import { ContractEditorModal } from "@/components/contract-editor-modal";
import { InvoiceManager } from "@/components/invoice-manager";
import { FormattedMarkdown } from "@/components/formatted-markdown";
import { LegalContractDocument } from "@/components/legal-contract-document";
import { PayPalPayoutModal } from "@/components/paypal-payout-modal";
import { ProjectChat } from "@/components/project-chat";

type WorkspaceTab =
  | "overview"
  | "contract"
  | "invoices"
  | "milestones"
  | "evidence"
  | "verification"
  | "payments"
  | "disputes"
  | "timeline"
  | "chat";

function ProjectRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const initialTab = (searchParams.get("tab") as WorkspaceTab) || "overview";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  const { user } = useAuth();
  const role = user?.role || "client";
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab 2: Deal Guardian & Contract Editor state
  const [dealGuardianReport, setDealGuardianReport] = useState<any | null>(null);
  const [analyzingDeal, setAnalyzingDeal] = useState(false);
  const [isContractEditorOpen, setIsContractEditorOpen] = useState(false);
  const [isResumingContract, setIsResumingContract] = useState(false);
  const [aiRevisionInitialInstruction, setAiRevisionInitialInstruction] = useState("");

  // Tab 4: Submission state
  const [subMilestoneId, setSubMilestoneId] = useState<string>("");
  const [deploymentUrl, setDeploymentUrl] = useState("/api/demo-store");
  const [repoUrl, setRepoUrl] = useState("https://github.com/elena-dev/apex-storefront");
  const [subNotes, setSubNotes] = useState("Implemented responsive layout and checkout validation flow.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Tab 5: Verification state
  const [runningTest, setRunningTest] = useState(false);
  const [verificationRun, setVerificationRun] = useState<VerificationRun | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [demoBugActive, setDemoBugActive] = useState(false);

  // Tab 6: Payments & Explainer state
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceSuccess, setAdvanceSuccess] = useState<any | null>(null);
  const [releasingMilestoneId, setReleasingMilestoneId] = useState<string | null>(null);
  const [explainingPayment, setExplainingPayment] = useState(false);
  const [paymentExplanation, setPaymentExplanation] = useState<any | null>(null);
  const [explainerQuery, setExplainerQuery] = useState("");
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [payPalModalMode, setPayPalModalMode] = useState<"paypal" | "card">("paypal");

  // Tab 7: Dispute & Scope Creep state
  const [disputeMilestoneId, setDisputeMilestoneId] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeClientArg, setDisputeClientArg] = useState("");
  const [disputeFreelancerArg, setDisputeFreelancerArg] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [activeDispute, setActiveDispute] = useState<any | null>(null);
  const [scopeMessage, setScopeMessage] = useState("We also want a native iOS mobile app built with push notifications!");
  const [analyzingScope, setAnalyzingScope] = useState(false);
  const [scopeChangeReport, setScopeChangeReport] = useState<any | null>(null);

  // Tab 8: Timeline & Audit state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [ledgerVerification, setLedgerVerification] = useState<any | null>(null);
  const [verifyingLedger, setVerifyingLedger] = useState(false);

  // Invitation copy state
  const [copiedInvite, setCopiedInvite] = useState(false);

  // PayPal Payout Modal state
  const [selectedPayoutMilestone, setSelectedPayoutMilestone] = useState<Milestone | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as WorkspaceTab;
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    loadProject();
    loadDemoStatus();
  }, [projectId, role]);

  const loadProject = async () => {
    try {
      setLoading(true);
      let data = await api.getProject(projectId);
      if (!data) {
        const all = await api.getProjects();
        if (all.length > 0) {
          data = all.find(p => p.id === projectId) || all[0];
        }
      }
      setProject(data);
      if (data?.milestones && data.milestones.length > 0) {
        setSubMilestoneId(data.milestones[1]?.id || data.milestones[0].id);
      }
      if (data) {
        const timeline = await api.getTimeline(data.id);
        setAuditEvents(timeline);
      }
    } catch (e) {
      console.error("Error loading project:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoStatus = async () => {
    try {
      const st = await api.getDemoStoreStatus();
      setDemoBugActive(st.checkout_bug_active);
    } catch (e) {
      // ignore if demo store offline
    }
  };

  const toggleDemoBug = async (active: boolean) => {
    try {
      await api.toggleDemoStoreBug(active);
      setDemoBugActive(active);
    } catch (e) {
      console.error(e);
    }
  };

  const switchTab = (t: WorkspaceTab) => {
    setActiveTab(t);
    router.replace(`/projects/${projectId}?tab=${t}`, { scroll: false });
  };

  // Resume Agreement (Lift Hold)
  const handleResumeContract = async () => {
    if (!latestContract) return;
    try {
      setIsResumingContract(true);
      await api.resumeContract(latestContract.id, user?.id, role);
      await loadProject();
    } catch (err: any) {
      alert("Failed to resume contract: " + (err.message || "Unknown error"));
    } finally {
      setIsResumingContract(false);
    }
  };

  // Agent 2: Run Deal Guardian
  const runDealGuardian = async () => {
    if (!project) return;
    try {
      setAnalyzingDeal(true);
      const res = await api.analyzeDealGuardian({
        project_title: project.title,
        brief: project.description,
        budget: project.budget,
        milestones: project.milestones
      });
      setDealGuardianReport(res);
    } catch (e: any) {
      alert("Deal Guardian error: " + e.message);
    } finally {
      setAnalyzingDeal(false);
    }
  };

  // Agent 5: Run Verification
  const runVerification = async (milestoneId?: string) => {
    const targetId = milestoneId || subMilestoneId || project?.milestones[1]?.id;
    if (!targetId) return;
    try {
      setRunningTest(true);
      setVerificationError(null);
      const res = await api.startVerification(targetId);
      setVerificationRun(res);
      await loadProject();
    } catch (e: any) {
      setVerificationError(e.message || "Verification test suite failed");
    } finally {
      setRunningTest(false);
    }
  };

  // Tab 4: Submit Work
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subMilestoneId) return;
    try {
      setIsSubmitting(true);
      await api.submitMilestone(subMilestoneId, {
        freelancer_id: "user-freelancer-001",
        deployment_url: deploymentUrl,
        repository_url: repoUrl,
        notes: subNotes
      });
      setSubmissionSuccess(true);
      await loadProject();
      setTimeout(() => switchTab("verification"), 1000);
    } catch (e: any) {
      alert("Submission error: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 6: Advance Payment Flow via Authentic PayPal Simulation
  const handleOpenPayPalModal = (mode: "paypal" | "card" = "paypal") => {
    setPayPalModalMode(mode);
    setIsPayPalModalOpen(true);
  };

  const handlePayPalModalApprove = async (details: {
    orderId: string;
    captureId: string;
    payerEmail: string;
    paymentMethod: "paypal_wallet" | "card";
  }) => {
    if (!project) return;
    try {
      setAdvanceLoading(true);
      const payerId = user?.id || "user-client-001";
      const order = await api.createAdvanceOrder(project.id, payerId);
      const capture = await api.captureAdvanceOrder(project.id, order.paypal_order_id || details.orderId);
      setAdvanceSuccess(capture);
      await loadProject();
    } catch (e: any) {
      console.error("PayPal advance order capture error:", e);
      alert("Advance payment capture error: " + (e.message || "Unknown error"));
      throw e;
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handlePayAdvance = async () => {
    handleOpenPayPalModal("paypal");
  };

  // Tab 6: Release Milestone Funds via PayPal Payouts
  const handleReleaseMilestone = (mId: string) => {
    const target = project?.milestones.find(m => m.id === mId);
    if (target) {
      setSelectedPayoutMilestone(target);
      setIsPayoutModalOpen(true);
    }
  };

  // Agent 7: Explain Payments
  const handleExplainPayments = async () => {
    if (!project) return;
    try {
      setExplainingPayment(true);
      const res = await api.explainPayments(project.id, explainerQuery);
      setPaymentExplanation(res);
    } catch (e: any) {
      alert("Payment explainer error: " + e.message);
    } finally {
      setExplainingPayment(false);
    }
  };

  // Agent 3: Scope Change Analyst
  const handleAnalyzeScope = async () => {
    if (!project || !scopeMessage) return;
    try {
      setAnalyzingScope(true);
      const res = await api.analyzeScopeChange(project.id, scopeMessage);
      setScopeChangeReport(res);
    } catch (e: any) {
      alert("Scope analyst error: " + e.message);
    } finally {
      setAnalyzingScope(false);
    }
  };

  // Tab 7: Dispute Submission
  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !disputeMilestoneId || !disputeReason) {
      alert("Please select a milestone and provide a reason for the dispute.");
      return;
    }
    try {
      setDisputeSubmitting(true);
      const res = await api.createDispute({
        milestone_id: disputeMilestoneId,
        initiated_by_id: user?.id || (role === "client" ? project.client_id : project.freelancer_id) || "user-001",
        reason: disputeReason,
        client_argument: role === "client" ? disputeClientArg || disputeReason : undefined,
        freelancer_argument: role === "freelancer" ? disputeFreelancerArg || disputeReason : undefined
      });
      setActiveDispute(res);
      alert(res.is_escalated
        ? "Dispute opened and escalated to Dispute Department (Admin Compliance). Escrow funds frozen."
        : "Dispute submitted to AI Arbiter.");
      await loadProject();
    } catch (err: any) {
      alert("Failed to submit dispute: " + (err.message || "Unknown error"));
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // Tab 8: Verify Ledger
  const handleVerifyLedger = async () => {
    if (!project) return;
    try {
      setVerifyingLedger(true);
      const res = await api.verifyLedger(project.id);
      setLedgerVerification(res);
    } catch (e: any) {
      alert("Ledger verification error: " + e.message);
    } finally {
      setVerifyingLedger(false);
    }
  };

  const copyInvite = () => {
    if (!project?.invitation_token) return;
    const url = `${window.location.origin}/invite/${project.invitation_token}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 py-20 text-center text-slate-500 text-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
        Loading Shared Project Workspace...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-500 text-xs">
        Project not found. Please return to the dashboard.
      </div>
    );
  }

  const latestContract = project.contracts?.[project.contracts.length - 1];
  const paidMilestonesTotal = project.milestones
    ?.filter(m => m.status === "PAID")
    .reduce((s, m) => s + m.amount, 0) || 0;

  const isLegacyFiveThousand =
    project.budget === 5000 &&
    project.advance_amount === 1250 &&
    !latestContract?.content_markdown?.includes("REVISED CLAUSE AMENDMENT");
  const displayAdvance = isLegacyFiveThousand ? 1000 : project.advance_amount;
  const displayHeld = isLegacyFiveThousand ? 4000 : project.held_balance;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "contract", label: "Contract", icon: FileText },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "milestones", label: "Milestones", icon: CheckCircle2 },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "evidence", label: "Evidence", icon: ExternalLink },
    { id: "verification", label: "Verification", icon: Terminal },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "disputes", label: "Disputes", icon: Scale },
    { id: "timeline", label: "Timeline", icon: ShieldCheck },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Executive Project Header */}
      {/* Executive Project Header */}
      <div className="payflow-card p-5 sm:p-6 bg-white space-y-5 border border-slate-200">
        {/* Row 1: Header Meta, Title & Action CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-900 font-black uppercase tracking-wider text-[11px]">
                {project.category}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                {project.status.replace(/_/g, " ")}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-900 font-extrabold text-[11px]">
                Advance: {project.advance_status === "PAID" ? `PAID ($${project.advance_amount.toLocaleString()})` : "PENDING"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-900 font-extrabold text-[11px]">
                Held Escrow: ${project.held_balance.toLocaleString()} USD
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {project.title}
            </h1>
          </div>

          {/* Quick Counterparty & Share Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {project.invitation_token && (
              <button
                type="button"
                onClick={copyInvite}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Copy className="h-4 w-4" />
                <span>{copiedInvite ? "Link Copied" : "Invite Counterparty"}</span>
              </button>
            )}
            <Link
              href="/demo-store"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-black text-xs transition-colors shadow-2xs"
            >
              <ExternalLink className="h-4 w-4 text-slate-700" />
              <span>Target Storefront</span>
            </Link>
          </div>
        </div>

        {/* Row 2: 2-Column Split: Left = Project Scope & Deliverables; Right = Financial Flow Tracker */}
        <div className="pt-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Scope & Deliverables Brief (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-900" />
                  Project Scope &amp; Deliverables Brief
                </span>
                <span className="text-[11px] text-slate-700 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  Verified by AI Escrow
                </span>
              </div>

              <div className="text-slate-800 text-xs sm:text-sm leading-relaxed max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 whitespace-pre-line font-medium">
                {project.description}
              </div>

              {/* Sequential Milestones Summary List to prevent empty space */}
              {project.milestones && project.milestones.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Milestone Deliverables Breakdown ({project.milestones.length} Stages):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {project.milestones.map((m, idx) => (
                      <div key={m.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Stage {idx + 1}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800">
                            {m.status}
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 truncate text-xs">{m.title}</div>
                        <div className="font-black text-slate-950 mt-1">${m.amount.toLocaleString()} USD</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-slate-900">{project.milestones?.length || 3} Sequential Milestones</span>
              <button
                type="button"
                onClick={() => switchTab("contract")}
                className="text-slate-950 hover:underline font-black text-xs cursor-pointer flex items-center gap-1"
              >
                View Full Legal Contract →
              </button>
            </div>
          </div>

          {/* Right Column: Financial Flow Tracker & PayPal Status (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* Card 1: Agreed Budget */}
              <div className="p-4 rounded-xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase tracking-wider">Total Agreed Value</span>
                  <span className="text-[10px] font-black text-black bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">USD</span>
                </div>
                <div className="text-3xl font-black text-black tracking-tight mt-2">
                  ${project.budget.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">
                  100% Contract Value
                </div>
              </div>

              {/* Card 2: Kickoff Advance */}
              <div className="p-4 rounded-xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase tracking-wider">Kickoff Advance</span>
                  <span className="text-[10px] font-black text-black bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    {project.advance_status === "PAID" ? "Paid" : "Pending"}
                  </span>
                </div>
                <div className="text-3xl font-black text-black tracking-tight mt-2">
                  ${displayAdvance.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">
                  Instant Kickoff Release
                </div>
              </div>

              {/* Card 3: Secured Escrow */}
              <div className="p-4 rounded-xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase tracking-wider">Secured Escrow</span>
                  <span className="text-[10px] font-black text-black bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    Held
                  </span>
                </div>
                <div className="text-3xl font-black text-black tracking-tight mt-2">
                  ${displayHeld.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">
                  Locked in PayPal Escrow
                </div>
              </div>

              {/* Card 4: Disbursed to Contractor */}
              <div className="p-4 rounded-xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase tracking-wider">Disbursed via PayPal</span>
                  <span className="text-[10px] font-black text-black bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    Sent
                  </span>
                </div>
                <div className="text-3xl font-black text-black tracking-tight mt-2">
                  ${paidMilestonesTotal.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">
                  Disbursed to Contractor
                </div>
              </div>
            </div>

            {/* Connected PayPal Accounts Bar inside right column */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/paypal.png" alt="PayPal" className="h-4 w-auto object-contain shrink-0 brightness-0 invert" />
                <div className="truncate text-xs text-slate-200">
                  <span className="font-black text-white uppercase text-[11px] tracking-wide mr-1.5">Escrow Ledger:</span>
                  <span className="font-bold text-slate-300">{project.client?.email || "alex@acmestudio.io"}</span>
                  <span className="mx-1.5 text-slate-500 font-bold">→</span>
                  <span className="font-bold text-slate-300">{project.freelancer?.email || "elena@devcraft.io"}</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-900 bg-white px-2.5 py-0.5 rounded-md shrink-0 shadow-2xs">
                Sandbox Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL HIGH-CONTRAST HOLD & CHANGE REQUEST ALERT BANNER */}
      {(latestContract?.is_on_hold || latestContract?.status === "ON_HOLD") && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PauseCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded">
                    Agreement On Hold
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    Client Requested Changes &amp; Feedback
                  </span>
                </div>
                <h3 className="text-sm font-black text-amber-950 mt-0.5">
                  Action Required: Counterparty placed the agreement on hold before signing.
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAiRevisionInitialInstruction(latestContract.hold_reason || "Revise agreement timeline and scope");
                  setIsContractEditorOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>✨ Revise Agreement with AI</span>
              </button>

              <button
                type="button"
                onClick={handleResumeContract}
                disabled={isResumingContract}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-amber-950 border border-amber-300 font-extrabold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                {isResumingContract ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                <span>Mark Done &amp; Lift Hold</span>
              </button>
            </div>
          </div>

          {/* Client's Exact Request Message Box */}
          <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
            <span className="font-black text-amber-900 shrink-0 uppercase text-[10px] tracking-wide bg-amber-100 px-2 py-0.5 rounded">
              Client Feedback
            </span>
            <div className="font-semibold text-slate-900 italic text-xs leading-relaxed">
              &ldquo;{latestContract.hold_reason || "Please review deliverables, adjust delivery schedule or milestone budgets before signing."}&rdquo;
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation Bar (Sleek Edge-to-Edge Segmented Control Bar) */}
      <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max xl:min-w-0 xl:w-full pr-4 xl:pr-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            const hasHoldBadge = (t.id === "contract" || t.id === "chat") && (latestContract?.is_on_hold || latestContract?.status === "ON_HOLD");
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id as WorkspaceTab)}
                className={`flex-1 shrink-0 xl:shrink xl:min-w-0 flex items-center justify-center gap-1.5 px-3 xl:px-2.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer relative ${isActive
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                <span>{t.label}</span>
                {hasHoldBadge && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse ml-0.5" title="Hold notice active" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW                                           */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Project Workspace:</span>
              <span className="text-sm text-slate-600">{project.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchTab("payments")}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <CreditCard className="h-4 w-4" />
                <span>Go to Payments</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab("milestones")}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4 text-slate-900" />
                <span>View Milestones</span>
              </button>
            </div>
          </div>

          {/* Project Milestones Table (Clean, Direct, Zero Fluff) */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Contract Milestones</h3>
              <span className="text-xs font-medium text-slate-500">
                {project.milestones.length} Deliverables • ${project.budget.toLocaleString()} Total
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {project.milestones.map((m, idx) => (
                <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Stage {idx + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.status === "PAID"
                        ? "bg-slate-100 text-slate-800 border border-slate-300"
                        : m.status === "VERIFIED"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : m.status === "DISPUTED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-900">{m.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{m.description}</div>
                  </div>
                  <div className="flex items-center gap-4 sm:shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-normal">Allocation</div>
                      <div className="text-base font-bold text-slate-900">${m.amount.toLocaleString()} USD</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab("milestones")}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONTRACT & SCOPE AUDIT                             */}
      {/* ========================================================= */}
      {activeTab === "contract" && (
        <div className="space-y-6">
          {/* Contract Scope Auditor Card */}
          <div className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Agreement Scope &amp; Compliance Audit</h3>
                  <p className="text-slate-500 text-xs">Evaluates agreement scope for ambiguities, missing tests, and timeline hazards.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={runDealGuardian}
                disabled={analyzingDeal}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {analyzingDeal ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Auditing Contract...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Run Scope Audit</span>
                  </>
                )}
              </button>
            </div>

            {dealGuardianReport && (
              <div className="p-4 rounded-xl bg-white border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase">Health Score:</span>
                    <span className="text-base font-black text-slate-950">{dealGuardianReport.health_score}/100</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${dealGuardianReport.risk_level === "LOW" ? "bg-slate-100 text-slate-900 border border-slate-300" : "bg-slate-900 text-white"
                    }`}>
                    {dealGuardianReport.risk_level} Risk Level
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{dealGuardianReport.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ambiguity Checks</div>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      {dealGuardianReport.ambiguities_detected?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Protective Recommendations</div>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      {dealGuardianReport.recommendations?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Official Legal Contract Document Presentation */}
          {latestContract ? (
            <LegalContractDocument
              project={project}
              contract={latestContract}
              onEditClick={() => setIsContractEditorOpen(true)}
              onAuditClick={runDealGuardian}
              isAuditing={analyzingDeal}
            />
          ) : (
            <div className="payflow-card p-8 text-center text-slate-500 text-sm">
              No formal contract generated yet.
            </div>
          )}

          {/* Real-Time Contract Discussion & Change Request Panel */}
          {latestContract && (
            <ContractCommentsPanel
              contractId={latestContract.id}
              projectId={project.id}
              userId={user?.id || (role === "freelancer" ? project.freelancer_id : project.client_id)}
              userName={user?.name || (role === "freelancer" ? "Contractor" : "Client")}
              userRole={role}
              isOnHold={latestContract.is_on_hold}
              holdReason={latestContract.hold_reason}
              onResumeReview={handleResumeContract}
              onCommentsUpdated={loadProject}
            />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: INVOICES & SEQUENTIAL ESCROW PIPELINE                */}
      {/* ========================================================= */}
      {activeTab === "invoices" && (
        <InvoiceManager
          projectId={project.id}
          project={project}
          userRole={role}
          userId={user?.id}
          onInvoiceUpdated={loadProject}
          onOpenPayPalModal={() => handleOpenPayPalModal("paypal")}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 3: MILESTONES & CRITERIA                              */}
      {/* ========================================================= */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Contract Milestones & Acceptance Criteria ({project.milestones.length})
            </h2>
          </div>

          {project.milestones.map((m, idx) => {
            const isPaid = m.status === "PAID";
            const isVerified = m.status === "VERIFIED";
            const isSubmitted = m.status === "SUBMITTED" || m.status === "VERIFYING";
            const cleanTitle = (m.title || "").replace(/^(Milestone\s*\d+\s*:\s*)+/gi, "").trim();

            return (
              <div key={m.id} className="payflow-card p-5 sm:p-6 space-y-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                        Stage {idx + 1}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${isPaid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                        isVerified ? "bg-blue-50 text-blue-800 border border-blue-200" :
                          isSubmitted ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-700"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? "bg-emerald-500" : isVerified ? "bg-[#0070ba]" : isSubmitted ? "bg-amber-500" : "bg-slate-400"
                          }`} />
                        <span>{m.status}</span>
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                      Milestone {idx + 1}: {cleanTitle || "Deliverable"}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-2xl leading-relaxed">{m.description}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Milestone Allocation</div>
                    <div className="text-xl font-black text-slate-950 font-mono tabular-nums">
                      ${m.amount.toLocaleString()} <span className="text-xs font-semibold text-slate-400 font-sans">{m.currency || "USD"}</span>
                    </div>
                  </div>
                </div>

                {/* Criteria Table */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-600">
                    Acceptance Criteria ({m.criteria?.length || 0})
                  </div>
                  <div className="space-y-1.5">
                    {m.criteria?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {c.verification_type}
                          </span>
                          <span className="font-semibold text-slate-800">{c.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "PASSED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {!isPaid && (
                    <>
                      <button
                        onClick={() => {
                          setSubMilestoneId(m.id);
                          switchTab("evidence");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Submit Deliverable
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubMilestoneId(m.id);
                          switchTab("verification");
                          runVerification(m.id);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Run Test Suite</span>
                      </button>

                      {role === "client" && (
                        <button
                          type="button"
                          onClick={() => handleReleaseMilestone(m.id)}
                          disabled={releasingMilestoneId === m.id}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Approve &amp; Release</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: WORK / EVIDENCE SUBMISSION                          */}
      {/* ========================================================= */}
      {activeTab === "evidence" && (
        <div className="space-y-6">
          <form onSubmit={handleSubmitWork} className="payflow-card p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">Submit Milestone Deliverables</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Provide the deployment link and repository. The Work Inspector will run Playwright tests against this deployment.
              </p>
            </div>

            {submissionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Work submitted successfully! Redirecting to automated test suite...</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Milestone
              </label>
              <select
                value={subMilestoneId}
                onChange={(e) => setSubMilestoneId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {project.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} (${m.amount} USD) — {m.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deployment URL (Playwright Target)
                </label>
                <input
                  type="url"
                  required
                  value={deploymentUrl}
                  onChange={(e) => setDeploymentUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Submission Notes &amp; Test Instructions
              </label>
              <textarea
                rows={3}
                value={subNotes}
                onChange={(e) => setSubNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting Deliverables...</span>
                </>
              ) : (
                <>
                  <span>Submit Deliverable for Verification</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PLAYWRIGHT PROOF OF WORK VERIFICATION               */}
      {/* ========================================================= */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          {/* Demo Store Switcher Banner */}
          <div className="p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400">Target Storefront Simulator</span>
              <div className="text-sm font-bold text-white mt-0.5">
                Target Storefront Checkout Status: {demoBugActive ? "BROKEN (HTTP 500)" : "FIXED (HTTP 200 OK)"}
              </div>
              <p className="text-slate-400 text-xs">Simulate real-world verification pass/fail for the 3-minute hackathon pitch.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDemoBug(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${demoBugActive ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
              >
                Simulate Defect
              </button>
              <button
                type="button"
                onClick={() => toggleDemoBug(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${!demoBugActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
              >
                Simulate Clean Pass
              </button>
            </div>
          </div>

          {/* Test Runner Controller */}
          <div className="payflow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Automated Acceptance Test Suite</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Executes Playwright tests, validates acceptance criteria, and generates cryptographic proof of work.
              </p>
            </div>

            <button
              type="button"
              onClick={() => runVerification()}
              disabled={runningTest}
              className="px-5 py-2.5 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {runningTest ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Playwright Suite...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Execute Verification Run</span>
                </>
              )}
            </button>
          </div>

          {verificationError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* Verification Results Display */}
          {verificationRun && (
            <div className="space-y-4">
              {/* AI Synthesis Summary Card */}
              <div className={`payflow-card p-6 border ${verificationRun.failed_count === 0
                ? "bg-emerald-50/40 border-emerald-200"
                : "bg-rose-50/40 border-rose-200"
                }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-xs text-slate-800">
                      Test Suite Verification Verdict
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${verificationRun.failed_count === 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}>
                    {verificationRun.failed_count === 0 ? "Approved for Payment" : "Revisions Required"}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-normal">
                  {verificationRun.summary || verificationRun.ai_analysis}
                </p>
              </div>

              {/* Criteria Test Table */}
              <div className="payflow-card p-6 space-y-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Concrete Test Assertions &amp; Evidence Hashes
                </div>

                <div className="space-y-2">
                  {verificationRun.results?.map((res, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${res.outcome === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                            {res.outcome}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{res.details}</span>
                        </div>
                        {res.evidence && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                            <Hash className="h-3 w-3 text-slate-400" />
                            <span>SHA-256: {res.evidence.sha256_hash.slice(0, 24)}...</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs font-bold text-slate-500">
                        {res.execution_time_ms} ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: HYBRID PAYMENTS & EXPLAINER ASSISTANT               */}
      {/* ========================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Section 1: Real PayPal Sandbox Advance Kickoff */}
          <div className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/P.png" alt="PayPal" className="h-5 w-auto object-contain" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">1. Upfront Kickoff Advance Deposit</h3>
                  <p className="text-slate-500 text-xs">Real PayPal Orders v2 API transaction to activate project commencement.</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${project.advance_status === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
                }`}>
                {project.advance_status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold">Advance Amount:</span>
                <div className="text-base font-black text-slate-900 mt-0.5">${project.advance_amount} USD</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold">Order ID:</span>
                <div className="text-xs font-mono font-bold text-slate-700 mt-0.5 truncate">
                  {project.advance_paypal_order_id || "Awaiting initiation"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-semibold">Capture ID:</span>
                <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5 truncate">
                  {project.advance_paypal_capture_id || "Pending capture"}
                </div>
              </div>
            </div>

            {project.advance_status !== "PAID" ? (
              role === "client" ? (
                <div className="space-y-4 pt-2">
                  {/* Standard PayPal Smart Checkout (Exact Match to Official Checkout Layout) */}
                  <div className="pt-2 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div className="space-y-3 max-w-sm">
                      <div className="text-xs font-semibold text-slate-900">
                        PayPal Smart Checkout Authorization
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Select your preferred PayPal payment method below. Funds are authenticated via PayPal Orders v2 Sandbox and held securely in escrow until milestones pass automated verification.
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#0070ba] shrink-0" />
                        <span>Compliant with PayPal Orders v2 Sandbox specifications.</span>
                      </div>
                    </div>

                    <PayPalOrderSummaryCard
                      subtotal={project.advance_amount}
                      shipping={0}
                      tax={0}
                      title="Order Summary"
                      onPayWithPayPal={() => handleOpenPayPalModal("paypal")}
                      disabled={advanceLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Awaiting Client Advance Deposit (${project.advance_amount} USD)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        The client ({project.client?.email || "Buyer"}) must authorize this deposit via PayPal before development begins.
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 self-start sm:self-auto">
                    Pending Client Action
                  </span>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      Kickoff Advance Paid &amp; Escrow Activated
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Captured via PayPal Orders v2. Cryptographic audit trail recorded.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPayPalModal("paypal")}
                  className="px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-700 text-xs font-medium hover:bg-emerald-50 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  View PayPal Receipt
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Milestone Held-Balance Escrow Releases */}
          <div className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">2. Secured Held Escrow Balance &amp; Releases</h3>
                  <p className="text-slate-500 text-xs">Milestone escrow released upon client signoff or verified tests.</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {project.held_balance_status} (${project.held_balance})
              </span>
            </div>

            <div className="space-y-3">
              {project.milestones.map((m) => (
                <div key={m.id} className="p-4 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{m.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Amount: ${m.amount} USD • Status: {m.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.status === "PAID" ? (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        DISBURSED
                      </span>
                    ) : role === "client" ? (
                      <button
                        type="button"
                        onClick={() => handleReleaseMilestone(m.id)}
                        disabled={releasingMilestoneId === m.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {releasingMilestoneId === m.id ? "Releasing..." : "Release Milestone Funds"}
                      </button>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-slate-400" />
                        <span>Secured in Escrow</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: DISPUTES & SCOPE CHANGE ANALYST                     */}
      {/* ========================================================= */}
      {activeTab === "disputes" && (
        <div className="space-y-6">
          {/* Scope Creep Detector & Amendment Generator */}
          <div className="payflow-card p-6 border-slate-200 bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-800" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Scope Change Assessment</h3>
                <p className="text-slate-500 text-xs">Test client messages against baseline contract to detect out-of-scope feature creep.</p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                rows={2}
                value={scopeMessage}
                onChange={(e) => setScopeMessage(e.target.value)}
                placeholder="Paste incoming client message or request..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={handleAnalyzeScope}
                disabled={analyzingScope}
                className="px-4 py-2 rounded-lg bg-[#0070ba] hover:bg-[#003087] text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {analyzingScope ? "Scanning Scope..." : "Analyze Scope Change"}
              </button>
            </div>

            {scopeChangeReport && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {scopeChangeReport.classification}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">{scopeChangeReport.analysis}</p>

                {scopeChangeReport.amendment_proposal && (
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1">
                    <div className="font-semibold text-amber-900">
                      Recommended Contract Amendment: {scopeChangeReport.amendment_proposal.title}
                    </div>
                    <div className="text-slate-600">
                      Budget Adjustment: ${scopeChangeReport.amendment_proposal.suggested_amount} USD • Extra Days: +{scopeChangeReport.amendment_proposal.suggested_days}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Neutral Dispute Mediation */}
          <div className="payflow-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Scale className="h-5 w-5 text-slate-800" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Neutral Dispute Mediation &amp; AI Escalation</h3>
                <p className="text-slate-500 text-xs">Impartial third-party mediation comparing contract criteria against complaints.</p>
              </div>
            </div>

            {/* Check if any milestone is currently disputed */}
            {project.milestones.some(m => m.status === "DISPUTED") || activeDispute ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-700" />
                    <span className="font-bold text-xs text-rose-900">
                      Dispute Department Escalation Active
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-300">
                    Severity: {activeDispute?.ai_severity || "HIGH"} • ESCROW FROZEN
                  </span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {activeDispute?.ai_dossier_summary || "This dispute was escalated to the Dispute Department (Admin Compliance) for administrative arbitration. Associated milestone escrow funds are frozen until compliance review is completed."}
                </p>
                <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded border border-rose-100">
                  <strong>Current Status:</strong> Awaiting Administrator Ruling in Dispute Department. Impartial evidence dossier generated from contract clauses, negotiation comments, and Playwright verification tests.
                </div>
              </div>
            ) : (
              <form onSubmit={handleFileDispute} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Milestone to Dispute:</label>
                    <select
                      value={disputeMilestoneId}
                      onChange={(e) => setDisputeMilestoneId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="">-- Choose Deliverable --</option>
                      {project.milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} (${m.amount} USD) - {m.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Dispute Reason:</label>
                    <input
                      type="text"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="e.g. Scope discrepancy or failed functional requirements"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">Detailed Factual Argument:</label>
                  <textarea
                    rows={3}
                    value={role === "client" ? disputeClientArg : disputeFreelancerArg}
                    onChange={(e) => role === "client" ? setDisputeClientArg(e.target.value) : setDisputeFreelancerArg(e.target.value)}
                    placeholder="Provide specific details of the non-compliance or breach relative to agreed acceptance criteria..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Serious disputes are automatically escalated to the Dispute Department with funds frozen.
                  </span>
                  <button
                    type="submit"
                    disabled={disputeSubmitting || !disputeMilestoneId || !disputeReason}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {disputeSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting to AI Arbiter...</span>
                      </>
                    ) : (
                      <>
                        <Scale className="h-3.5 w-3.5" />
                        <span>File Formal Dispute</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: AUDIT TIMELINE & CRYPTOGRAPHIC LEDGER               */}
      {/* ========================================================= */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <div className="payflow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-800" />
                <h3 className="font-bold text-base text-slate-900">Cryptographic SHA-256 Audit Stream</h3>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Tamper-evident, hash-chained chronological stream of every contract event, test run, and payment transaction.
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyLedger}
              disabled={verifyingLedger}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {verifyingLedger ? "Validating Chain..." : "Verify Ledger Integrity"}
            </button>
          </div>

          {ledgerVerification && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{ledgerVerification.message || "Cryptographic SHA-256 Chain 100% Valid"}</span>
              </div>
              <span className="font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                {ledgerVerification.count} Verified Blocks
              </span>
            </div>
          )}

          {/* Audit Stream Table */}
          <div className="payflow-card p-6 space-y-3">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Chronological Audit Trail ({auditEvents.length} Events)
            </div>

            <div className="space-y-2.5">
              {auditEvents.map((ev, i) => (
                <div key={ev.id || i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{ev.action}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 font-semibold text-slate-700">
                        {ev.actor_role} ({ev.actor_name || "System"})
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Hash: {ev.current_hash}
                    </div>
                  </div>
                  <div suppressHydrationWarning className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()} • {new Date(ev.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: PROJECT COUNTERPARTY & AI ARBITER CHAT             */}
      {/* ========================================================= */}
      {activeTab === "chat" && (
        <ProjectChat
          projectId={project.id}
          project={project}
          userRole={role}
          userName={user?.name || (role === "client" ? "Alex Rivera" : "Elena Rostova")}
        />
      )}

      {/* Floating Counterparty Chat Quick-Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => switchTab(activeTab === "chat" ? "overview" : "chat")}
          className={`px-4 py-2.5 rounded-full shadow-md flex items-center gap-2 font-bold text-xs transition-all cursor-pointer ${activeTab === "chat"
            ? "bg-slate-900 text-white border border-slate-700"
            : "bg-slate-900 text-white hover:bg-slate-800 border border-slate-800"
            }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{activeTab === "chat" ? "Close Chat" : "Project Chat"}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* AUTHENTIC PAYPAL CHECKOUT POPUP (Exact Matches Images 3-5) */}
      {/* ========================================================= */}
      {project && (
        <PayPalCheckoutModal
          isOpen={isPayPalModalOpen}
          onClose={() => setIsPayPalModalOpen(false)}
          amount={project.advance_amount || 600}
          currency={project.currency || "USD"}
          itemTitle={`Kickoff Advance: ${project.title}`}
          initialMode={payPalModalMode}
          initialEmail={user?.email || "hassanshaikh9717@gmail.com"}
          onApprove={handlePayPalModalApprove}
        />
      )}

      {/* Official PayPal Payouts Disbursement Modal */}
      {selectedPayoutMilestone && project && (
        <PayPalPayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false);
            setSelectedPayoutMilestone(null);
          }}
          milestoneId={selectedPayoutMilestone.id}
          milestoneTitle={selectedPayoutMilestone.title}
          amount={selectedPayoutMilestone.amount}
          currency={project.currency || "USD"}
          contractorName={project.freelancer?.name || "Elena Rostova"}
          contractorPayPalEmail={project.freelancer?.paypal_email || project.freelancer?.email || "elena@devcraft.io"}
          clientId={user?.id || project.client_id}
          onPayoutSuccess={loadProject}
          onDepositNextMilestone={() => {
            switchTab("invoices");
          }}
        />
      )}

      {/* Modal: Inline Contract Clause & Milestones Editor (Available globally from any tab) */}
      {latestContract && (
        <ContractEditorModal
          isOpen={isContractEditorOpen}
          onClose={() => setIsContractEditorOpen(false)}
          contract={latestContract}
          userId={user?.id}
          userRole={role}
          initialInstruction={aiRevisionInitialInstruction || latestContract.hold_reason}
          onSaved={() => {
            setIsContractEditorOpen(false);
            loadProject();
          }}
        />
      )}
    </div>
  );
}

export default function ProjectWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[1680px] mx-auto px-4 py-20 text-center text-slate-400 text-xs">
        Loading Project Workspace...
      </div>
    }>
      <ProjectRoomContent />
    </Suspense>
  );
}
