"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, Lock, 
  Clock, FileCode2, CreditCard, Terminal
} from "lucide-react";
import { api, AuditEvent } from "@/lib/api";

function TimelineContent() {
  const params = useParams();
  const projectId = params?.id as string;

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [integrity, setIntegrity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [projectId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [eventsData, integrityData] = await Promise.all([
        api.getTimeline(projectId),
        api.verifyLedger(projectId)
      ]);
      setEvents(eventsData);
      setIntegrity(integrityData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("PAYMENT")) return CreditCard;
    if (action.includes("CONTRACT")) return FileCode2;
    if (action.includes("VERIFICATION") || action.includes("WORK")) return Terminal;
    return ShieldCheck;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Project
        </Link>
        <button
          onClick={loadTimeline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
        >
          <RefreshCw className="h-3 w-3" />
          Recheck Ledger
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Project Audit Timeline</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          Tamper-evident activity history chained with SHA-256 cryptographic hashes.
        </p>
      </div>

      {/* Ledger Integrity Card */}
      {integrity && (
        <div className="clean-card p-4 mb-6 bg-white border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Ledger Hash Continuity</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    VERIFIED
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">{integrity.message}</p>
              </div>
            </div>

            {integrity.latest_hash && (
              <div className="text-right font-mono text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                <div className="text-[9px] uppercase text-slate-400">Latest Block Hash</div>
                <div className="text-slate-700 font-semibold">{integrity.latest_hash.slice(0, 18)}...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Events List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading audit events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">No audit events recorded yet.</div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-5">
          {events.map((ev, idx) => {
            const Icon = getActionIcon(ev.action);
            return (
              <div key={ev.id} className="relative">
                <div className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-white border-2 border-blue-600 text-blue-600 flex items-center justify-center shadow-xs">
                  <Icon className="h-2.5 w-2.5" />
                </div>

                <div className="clean-card p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ev.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {ev.actor_role}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ev.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {ev.details_json && (
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono my-2 space-y-0.5">
                      {Object.entries(ev.details_json).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-900 font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <div>Prev: {ev.prev_hash ? `${ev.prev_hash.slice(0, 12)}...` : "GENESIS"}</div>
                    <div>Hash: {ev.current_hash.slice(0, 12)}...</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-slate-500 text-xs">Loading Timeline...</div>}>
      <TimelineContent />
    </Suspense>
  );
}
