"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Calendar, BarChart3, Lock, Clock, Award,
  ArrowRight, ChevronRight, CreditCard,
  Check, RefreshCw, ShieldCheck, AlertTriangle,
  FileCheck2, CheckCircle2, UserCheck, Scale, FileText,
  AlertCircle, ExternalLink, X
} from "lucide-react";
import { api, Project, AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AdminDisputeDossierModal } from "@/components/admin-dispute-dossier-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const role = mounted && user?.role ? user.role : (user?.role || "client");
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminDisputes, setAdminDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeMessage, setDisputeMessage] = useState<string | null>(null);
  const [dossierDisputeId, setDossierDisputeId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadDashboardData(role);
  }, [role, user?.id]);

  const loadDashboardData = async (currentRole: "client" | "freelancer" | "admin") => {
    try {
      setLoading(true);
      const projData = await api.getProjects();
      setProjects(projData);

      if (currentRole === "admin") {
        const [stats, disputes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminDisputes()
        ]);
        setAdminStats(stats);
        setAdminDisputes(disputes);
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, decision: "RELEASE_TO_FREELANCER" | "REFUND_TO_CLIENT") => {
    try {
      setResolvingDisputeId(disputeId);
      await api.resolveDispute(disputeId, decision);
      setDisputeMessage(
        decision === "RELEASE_TO_FREELANCER"
          ? "Dispute resolved successfully: Funds released to contractor."
          : "Dispute resolved successfully: Escrow refunded to client."
      );
      // Reload updated disputes and projects
      const [disputes, projData, stats] = await Promise.all([
        api.getAdminDisputes(),
        api.getProjects(),
        api.getAdminStats()
      ]);
      setAdminDisputes(disputes);
      setProjects(projData);
      setAdminStats(stats);
      setTimeout(() => setDisputeMessage(null), 5000);
    } catch (err: any) {
      alert("Error resolving dispute: " + (err.message || "Unknown error"));
    } finally {
      setResolvingDisputeId(null);
    }
  };

  // Metrics for Freelancer & Client
  const allMilestones = projects.flatMap(p => p.milestones || []);
  const totalMilestonesCount = allMilestones.length;

  const totalRevenue = allMilestones
    .filter(m => m.status === "PAID")
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  const inEscrow = projects
    .filter(p => p.status === "IN_PROGRESS" || p.status === "CONTRACT_PENDING")
    .reduce((sum, p) => sum + (p.held_balance || 0), 0);

  const pendingSubmissions = allMilestones.filter(m => m.status === "SUBMITTED" || m.status === "VERIFYING");

  const paidCount = allMilestones.filter(m => m.status === "PAID").length;
  const completionRate = totalMilestonesCount > 0
    ? ((paidCount / totalMilestonesCount) * 100).toFixed(1)
    : "0.0";

  if (!mounted) {
    return (
      <div className="w-full space-y-5 font-sans animate-pulse py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 font-sans">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {role === "admin" ? "Platform Administration" : (role === "client" ? "Client Project Manager" : "Overview")}
            </h1>
            <span suppressHydrationWarning className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
              {role} View
            </span>
          </div>
          <p suppressHydrationWarning className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {role === "admin"
              ? "All projects, active disputes triage, and escrow disbursement resolution."
              : (role === "client"
                ? "Track contractor deliverables, authorize advance kickoff, and release milestone funds."
                : "Monitor your performance, active escrow streams, and verified milestones.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role !== "admin" && (
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Agreement</span>
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROLE 1: ADMINISTRATOR DASHBOARD VIEW                     */}
      {/* (Only Shows: All Projects, All Disputes & Dispute Resolution) */}
      {/* ========================================================= */}
      {role === "admin" && (
        <div className="space-y-6">
          {/* Status Message Notification */}
          {disputeMessage && (
            <div className="p-4 rounded-xl bg-white border-2 border-black text-black text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                <span>{disputeMessage}</span>
              </div>
              <button onClick={() => setDisputeMessage(null)} className="text-slate-500 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Global
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Projects</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                {projects.length}
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Active platform contracts</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Secured
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Escrow Balance</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                ${(adminStats?.total_escrow_secured ?? 0).toLocaleString()} <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Secured in PayPal escrow</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Scale className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                  Audit
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Disputes</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1 tabular-nums">
                {adminDisputes.length}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>Reported issues</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Action
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Disputes</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1 tabular-nums">
                {adminDisputes.filter(d => d.status === "OPEN").length}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Requires admin resolution</span>
              </div>
            </div>
          </div>

          {/* Section 1: All Disputes & Resolution Action */}
          <div id="disputes" className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Scale className="h-5 w-5 text-slate-900" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">All Disputes &amp; Resolution</h3>
                  <p className="text-slate-500 text-xs">Review open issues and authorize resolution disbursements or refunds.</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {adminDisputes.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span>Loading disputes registry...</span>
              </div>
            ) : adminDisputes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No disputes on the platform. All milestone streams are operating smoothly.
              </div>
            ) : (
              <div className="space-y-4">
                {adminDisputes.map((dispute) => {
                  const isOpen = dispute.status === "OPEN";
                  const isResolving = resolvingDisputeId === dispute.dispute_id;

                  return (
                    <div
                      key={dispute.dispute_id}
                      className={`p-5 rounded-xl border transition-all ${isOpen
                          ? "bg-amber-50/30 border-amber-200"
                          : "bg-slate-50/70 border-slate-200"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{dispute.project_title}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs text-slate-600 font-semibold">{dispute.milestone_title}</span>
                            {dispute.amount && (
                              <span className="text-xs font-black text-slate-950">(${dispute.amount} USD)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Initiated by: <strong>{dispute.initiated_by}</strong> • {new Date(dispute.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          {dispute.ai_severity && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${dispute.ai_severity === "CRITICAL" || dispute.ai_severity === "HIGH"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}>
                              {dispute.ai_severity}
                            </span>
                          )}
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${isOpen
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}>
                            {dispute.status}
                          </span>
                        </div>
                      </div>

                      {/* Dispute Details */}
                      <div className="py-3 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700">Dispute Reason: </span>
                          <span className="text-slate-800 font-medium">{dispute.reason}</span>
                        </div>
                        {dispute.ai_neutral_analysis && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                            <strong className="text-slate-800">Neutral Scope Assessment: </strong>
                            {dispute.ai_neutral_analysis}
                          </div>
                        )}
                      </div>

                      {/* Resolution Actions */}
                      <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 font-medium">
                          {isOpen
                            ? "Administrator action required to unblock milestone escrow."
                            : `Resolved on ${dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleDateString() : "Record"}`}
                        </div>

                        {isOpen ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            <button
                              type="button"
                              onClick={() => setDossierDisputeId(dispute.dispute_id)}
                              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <FileText className="h-4 w-4 text-[#0070ba]" />
                              <span>Review AI Dossier</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResolveDispute(dispute.dispute_id, "RELEASE_TO_FREELANCER")}
                              disabled={isResolving}
                              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Release to Freelancer</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResolveDispute(dispute.dispute_id, "REFUND_TO_CLIENT")}
                              disabled={isResolving}
                              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              <AlertCircle className="h-4 w-4" />
                              <span>Refund to Client</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDossierDisputeId(dispute.dispute_id)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              <span>View Dossier Record</span>
                            </button>
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Resolved by Administrator</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispute Department AI Dossier Modal */}
          {dossierDisputeId && (
            <AdminDisputeDossierModal
              disputeId={dossierDisputeId}
              isOpen={!!dossierDisputeId}
              onClose={() => setDossierDisputeId(null)}
              onResolved={(decision) => {
                setDossierDisputeId(null);
                setDisputeMessage(`Dispute successfully resolved: ${decision === "RELEASE_TO_FREELANCER" ? "Funds released to contractor" : "Escrow refunded to client"}.`);
                api.getAdminDisputes().then(setAdminDisputes);
              }}
            />
          )}

          {/* Section 2: All Projects Registry */}
          <div id="projects" className="payflow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">All Projects</h3>
                  <p className="text-slate-500 text-xs">Registry of all agreements, counter-parties, and held escrow.</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {projects.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span>Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No projects found.</div>
            ) : (
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{proj.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {proj.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {proj.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Client: <strong className="text-slate-800">{proj.client?.name || "Client"}</strong> •
                        Contractor: <strong className="text-slate-800">{proj.freelancer?.name || "Freelancer"}</strong>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{proj.description}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="text-left sm:text-right text-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Budget</div>
                        <div className="text-base font-black text-slate-900">${proj.budget.toLocaleString()} USD</div>
                        <div className="text-[10px] text-slate-600 font-bold">${proj.held_balance} in escrow</div>
                      </div>

                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Open Workspace
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE 2: CLIENT DASHBOARD VIEW                             */}
      {/* ========================================================= */}
      {role === "client" && (
        <div className="space-y-6">
          {/* Client Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Committed
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Committed</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                ${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()} <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Across {projects.length} agreements</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Secured
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Funds in Escrow</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                ${inEscrow.toLocaleString()} <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Secured in site escrow</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Review
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Review Queue</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                {pendingSubmissions.length} <span className="text-sm font-semibold text-slate-400">Tasks</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Submissions awaiting sign-off</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                  Disbursed
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestones Released</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1 tabular-nums">
                ${totalRevenue.toLocaleString()} <span className="text-sm font-semibold text-slate-400">USD</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>Approved &amp; disbursed via PayPal</span>
              </div>
            </div>
          </div>

          {/* Pending Kickoff Advance Payment Alerts (Clean Enterprise Action Card) */}
          {projects.some(p => p.advance_status === "PENDING") && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Kickoff Advance Payments Pending
                    </h4>
                    <p className="text-slate-500 text-xs">
                      Fund the initial advance deposit to activate development on these projects.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 self-start sm:self-auto">
                  {projects.filter(p => p.advance_status === "PENDING").length} Action Required
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {projects.filter(p => p.advance_status === "PENDING").map(p => (
                  <div key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-500">
                        Contractor: <span className="font-medium text-slate-700">{p.freelancer?.name || "Contractor"}</span> • Deposit Required: <span className="font-semibold text-slate-900">${p.advance_amount.toLocaleString()} USD</span>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${p.id}?tab=payments`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <span>Pay Advance (${p.advance_amount})</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE 3: FREELANCER DASHBOARD VIEW                        */}
      {/* ========================================================= */}
      {role === "freelancer" && (
        <>
          {/* Top 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Earned
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Revenue</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                ${totalRevenue > 0 ? totalRevenue.toLocaleString() : "0"} <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Disbursed via PayPal Payouts</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Secured
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">In Escrow</div>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1 tabular-nums">
                ${inEscrow.toLocaleString()} <span className="text-sm font-bold text-slate-500">USD</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span>Secured in active contracts</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  Pending
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                {pendingSubmissions.length} <span className="text-sm font-semibold text-slate-400">Tasks</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Awaiting client verification</span>
              </div>
            </div>

            <div className="payflow-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                  Rate
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1 tabular-nums">
                {completionRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{paidCount} of {totalMilestonesCount} released</span>
              </div>
            </div>
          </div>

          {/* Clean Quick Actions Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/projects/new"
              className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-slate-700">New Agreement</div>
                <div className="text-[11px] text-slate-400">Create milestone contract</div>
              </div>
            </Link>

            <Link
              href={projects.length > 0 ? `/projects/${projects[0].id}?tab=verification` : "/projects/new"}
              className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-slate-700">Proof Engine</div>
                <div className="text-[11px] text-slate-400">Automated Playwright tests</div>
              </div>
            </Link>

            <Link
              href={projects.length > 0 ? `/projects/${projects[0].id}?tab=payments` : "/projects/new"}
              className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-slate-700">PayPal Payments</div>
                <div className="text-[11px] text-slate-400">Advance &amp; Escrow payouts</div>
              </div>
            </Link>

            <Link
              href="/demo-store"
              className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-400 transition-colors flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-slate-800">Target Storefront</div>
                <div className="text-[11px] text-slate-400">Live QA environment</div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* CLIENT & FREELANCER: ACTIVE PROJECT STREAMS               */}
      {/* ========================================================= */}
      {role !== "admin" && (
        <div className="payflow-card p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Active Project Streams
              </h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Real-time status of {projects.length} agreements
              </div>
            </div>

            {projects.length > 0 && (
              <Link
                href={`/projects/${projects[0].id}`}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              Loading live project streams...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900">No active agreements yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first project agreement with custom milestones, automated Playwright criteria, and PayPal escrow protection.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Agreement</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((proj) => (
                <div key={proj.id} className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{proj.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                          {proj.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {proj.status}
                        </span>
                        {proj.advance_status === "PAID" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                            Advance Paid (${proj.advance_amount})
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-2">{proj.description}</p>

                      {proj.invitation_token && (
                        <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-2">
                          <span className="font-semibold text-slate-400">Invite Link:</span>
                          <Link
                            href={`/invite/${proj.invitation_token}`}
                            className="font-mono text-slate-900 font-bold hover:underline bg-white px-2 py-0.5 rounded-md border border-slate-300"
                          >
                            /invite/{proj.invitation_token.slice(0, 16)}...
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Budget</div>
                        <div className="text-base font-black text-slate-900">${proj.budget.toLocaleString()} USD</div>
                        <div className="text-[10px] text-slate-700 font-bold">${proj.held_balance} in escrow</div>
                      </div>

                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Open Workspace
                      </Link>
                    </div>
                  </div>

                  {/* Milestones Dynamic Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {proj.milestones?.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-slate-300 bg-white flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-xs text-black truncate">
                            {m.title}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5 font-semibold">
                            ${m.amount} USD &bull; {m.status}
                          </div>
                        </div>

                        {m.status === "PAID" ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            PAID
                          </span>
                        ) : m.status === "SUBMITTED" ? (
                          <Link
                            href={`/projects/${proj.id}?tab=verification`}
                            className="text-[10px] font-black px-2.5 py-1 rounded-md bg-black text-white hover:bg-slate-800"
                          >
                            VERIFY
                          </Link>
                        ) : m.status === "DISPUTED" ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black text-white">
                            DISPUTED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">PENDING</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
