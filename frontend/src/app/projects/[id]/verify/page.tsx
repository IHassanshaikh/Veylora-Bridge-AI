"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Play, CheckCircle2, AlertCircle, XCircle, Terminal, 
  RefreshCw, ShieldCheck, ArrowRight, Clock, Eye, AlertTriangle
} from "lucide-react";
import { api, Milestone, VerificationRun } from "@/lib/api";

function VerificationContent() {
  const params = useParams();
  const projectId = params?.id as string;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<VerificationRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo store bug state
  const [bugActive, setBugActive] = useState<boolean>(true);
  const [togglingBug, setTogglingBug] = useState(false);

  useEffect(() => {
    loadMilestones();
    checkBugStatus();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      let data: Milestone[] = [];
      try {
        data = await api.getMilestones(projectId);
      } catch (err) {
        const all = await api.getProjects();
        if (all.length > 0) {
          const target = all.find(p => p.id === projectId) || all[0];
          data = target.milestones || [];
        }
      }
      setMilestones(data);
      if (data.length > 0) {
        const m2 = data.find(m => m.id === "m2-cart-checkout") || data[1] || data[0];
        setSelectedMilestoneId(m2.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkBugStatus = async () => {
    try {
      const status = await api.getDemoStoreStatus();
      setBugActive(status.checkout_bug_active);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBug = async () => {
    try {
      setTogglingBug(true);
      const nextBugState = !bugActive;
      await api.toggleDemoStoreBug(nextBugState);
      setBugActive(nextBugState);
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingBug(false);
    }
  };

  const handleStartVerification = async () => {
    if (!selectedMilestoneId) return;
    setRunning(true);
    setError(null);
    try {
      const run = await api.startVerification(selectedMilestoneId);
      setCurrentRun(run);
      await loadMilestones();
    } catch (err: any) {
      setError(err.message || "Verification run failed");
    } finally {
      setRunning(false);
    }
  };

  const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Proof of Work Engine</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Playwright Automated Testing</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Work Verification Console</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Tests real web deliverables using browser automation, HTTP status probes, and mobile viewport checks.
          </p>
        </div>

        {/* Demo Bug Toggle Card */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="text-xs font-bold text-slate-800">
              Target Checkout Bug Switch
            </div>
            <div className="text-[11px] text-slate-500">
              Simulate bug catch vs clean pass:
            </div>
          </div>

          <button
            onClick={handleToggleBug}
            disabled={togglingBug}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              bugActive
                ? "bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
            }`}
          >
            <span>Target:</span>
            <span className="underline">
              {bugActive ? "Broken (Will Fail)" : "Fixed (Will Pass)"}
            </span>
          </button>
        </div>
      </div>

      {/* Milestone Selection Bar */}
      <div className="clean-card p-4 mb-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Select Milestone:</span>
          <select
            value={selectedMilestoneId}
            onChange={(e) => setSelectedMilestoneId(e.target.value)}
            className="clean-input text-xs py-1.5"
          >
            {milestones.map((m, idx) => (
              <option key={m.id} value={m.id}>
                Milestone {idx + 1}: {m.title} (${m.amount} USD) - [{m.status}]
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleStartVerification}
          disabled={running}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          {running ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Running Playwright Tests...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              Run Automated Proof of Work
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Verification Dashboard */}
      {currentRun ? (
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="clean-card p-5 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-slate-500 mb-0.5">RUN #{currentRun.id.slice(0, 8).toUpperCase()} • {selectedMilestone?.title}</div>
                <h2 className="text-lg font-bold text-slate-900">Verification Report</h2>
              </div>

              {/* Status Counts */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {currentRun.passed_count} Passed
                </span>

                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-xs font-semibold">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  {currentRun.failed_count} Failed
                </span>

                {currentRun.review_count > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    {currentRun.review_count} Review
                  </span>
                )}
              </div>
            </div>

            {/* AI Work Inspector Box */}
            <div className="mt-4 p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 mb-0.5">
                  Work Inspector Finding (Evidence-Backed)
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentRun.ai_analysis || currentRun.summary}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                {currentRun.failed_count > 0 ? (
                  <span className="text-rose-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Payment held. Fix the failing requirement and re-run verification.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    All criteria passed! Client can approve and authorize PayPal payout.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentRun.failed_count > 0 && (
                  <Link
                    href={`/projects/${projectId}/disputes`}
                    className="px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                  >
                    Open Scope Dispute
                  </Link>
                )}

                <Link
                  href={`/projects/${projectId}`}
                  className={`px-4 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1 shadow-xs ${
                    currentRun.failed_count === 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {currentRun.failed_count === 0 ? "Authorize PayPal Payment" : "Return to Project"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Criteria Cards */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm">Individual Acceptance Criteria</h3>

            {currentRun.results.map((res, idx) => (
              <div
                key={res.id || idx}
                className={`clean-card p-4 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  res.outcome === "PASS"
                    ? "border-emerald-200"
                    : res.outcome === "FAIL"
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-amber-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {res.outcome === "PASS" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : res.outcome === "FAIL" ? (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 text-xs">Criterion #{idx + 1}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          res.outcome === "PASS"
                            ? "bg-emerald-100 text-emerald-800"
                            : res.outcome === "FAIL"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {res.outcome}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{res.execution_time_ms}ms</span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed max-w-xl">{res.details}</p>
                    
                    {res.evidence && (
                      <div className="mt-1 text-[10px] font-mono text-slate-400">
                        SHA-256: <code>{res.evidence.sha256_hash.slice(0, 20)}...</code>
                      </div>
                    )}
                  </div>
                </div>

                {res.evidence && (
                  <div className="shrink-0">
                    <a
                      href={api.getEvidenceImageUrl(res.evidence.file_name)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Screenshot
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="clean-card p-12 text-center bg-white">
          <Terminal className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Ready for Proof of Work Run</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-5">
            Click &quot;Run Automated Proof of Work&quot; to test deliverables against contract acceptance criteria.
          </p>
          <button
            onClick={handleStartVerification}
            disabled={running}
            className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
          >
            Start Verification Run
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-500 text-xs">Loading Console...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
