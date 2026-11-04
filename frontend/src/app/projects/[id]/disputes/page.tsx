"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Scale, ArrowLeft, RefreshCw, AlertCircle, 
  CheckCircle2, MessageSquare
} from "lucide-react";
import { api } from "@/lib/api";

function DisputeCenterContent() {
  const params = useParams();
  const projectId = params?.id as string;

  const [milestoneId, setMilestoneId] = useState("m2-cart-checkout");
  const [reason, setReason] = useState("Checkout workflow throws exception on form submission");
  const [clientArgument, setClientArgument] = useState(
    "The checkout button results in a 500 error when placing an order. Furthermore, we also wanted a native iOS mobile application created under this milestone."
  );
  const [freelancerArgument, setFreelancerArgument] = useState(
    "The contract specifies a responsive web application (Milestone 2: Shopping Cart & Checkout Flow). A native iOS app was never in the signed acceptance criteria."
  );

  const [analyzing, setAnalyzing] = useState(false);
  const [disputeResult, setDisputeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.createDispute({
        milestone_id: milestoneId,
        initiated_by_id: "user-client-001",
        reason,
        client_argument: clientArgument,
        freelancer_argument: freelancerArgument
      });
      setDisputeResult(res);
    } catch (err: any) {
      setError(err.message || "Dispute analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Scope & Dispute Center</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          Compares agreed contract acceptance criteria with complaints to detect unagreed scope creep vs defects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <form onSubmit={handleRunAnalysis} className="clean-card p-6 bg-white space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-600" />
            Submit Disagreement for Scope Review
          </h2>

          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Disputed Milestone
            </label>
            <input
              type="text"
              value="Milestone 2: Shopping Cart & Checkout Flow ($600.00 USD)"
              disabled
              className="clean-input w-full bg-slate-50 text-slate-500 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Disagreement Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="clean-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Argument / Complaint
            </label>
            <textarea
              value={clientArgument}
              onChange={(e) => setClientArgument(e.target.value)}
              rows={3}
              required
              className="clean-input w-full text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Freelancer Argument / Rebuttal
            </label>
            <textarea
              value={freelancerArgument}
              onChange={(e) => setFreelancerArgument(e.target.value)}
              rows={3}
              required
              className="clean-input w-full text-xs leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="w-full py-2.5 px-4 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Analyzing Contract Criteria...
              </>
            ) : (
              <>
                <Scale className="h-3.5 w-3.5" />
                Analyze Scope & Disagreement
              </>
            )}
          </button>
        </form>

        {disputeResult && (
          <div className="clean-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Impartial Scope Finding</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Status: {disputeResult.status}
              </span>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1">
                Objective Finding
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {disputeResult.ai_neutral_analysis}
              </p>
            </div>

            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Recommended Resolution
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {disputeResult.recommended_action}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisputeCenterPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-500 text-xs">Loading Dispute Center...</div>}>
      <DisputeCenterContent />
    </Suspense>
  );
}
