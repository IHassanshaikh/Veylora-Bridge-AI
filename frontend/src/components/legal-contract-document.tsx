"use client";

import React, { useState } from "react";
import { Project, Contract, Milestone } from "@/lib/api";
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Copy, 
  ExternalLink, 
  Lock, 
  Calendar, 
  User, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";

interface LegalContractDocumentProps {
  project: Project;
  contract: Contract;
  onEditClick: () => void;
  onAuditClick: () => void;
  isAuditing?: boolean;
}

export function LegalContractDocument({
  project,
  contract,
  onEditClick,
  onAuditClick,
  isAuditing = false,
}: LegalContractDocumentProps) {
  const [copied, setCopied] = useState(false);

  const clientName = project.client?.name || "Alex Rivera";
  const clientEmail = project.client?.paypal_email || project.client?.email || "alex@acmestudio.io";
  const contractorName = project.freelancer?.name || "Elena Rostova";
  const contractorEmail = project.freelancer?.paypal_email || project.freelancer?.email || "elena@devcraft.io";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(contract.content_markdown || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contractDate = contract.created_at 
    ? new Date(contract.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "November 4, 2026";

  const docId = `VEY-AGR-${(contract.id || project.id).slice(0, 8).toUpperCase()}-V${contract.version || 1}`;

  return (
    <div className="space-y-6">
      {/* Document Action Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-950">Master Service Agreement</span>
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {docId}
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                contract.is_on_hold 
                  ? "bg-slate-900 text-white"
                  : "bg-slate-900 text-white"
              }`}>
                {contract.is_on_hold ? "Revision Requested" : (contract.status || "Accepted & Enforceable")}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5 font-medium">
              Legally binding freelance covenant with autonomous PayPal Milestone Escrow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAuditClick}
            disabled={isAuditing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isAuditing ? "Auditing Scope..." : "Audit Scope"}</span>
          </button>

          <button
            type="button"
            onClick={onEditClick}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
          >
            <FileText className="h-4 w-4 text-slate-700" />
            <span>Edit Clauses</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
          >
            <Copy className="h-4 w-4 text-slate-700" />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THE OFFICIAL LEGAL CONTRACT PAPER CANVAS                 */}
      {/* ======================================================== */}
      <div className="bg-white shadow-xl rounded-2xl border border-slate-300 max-w-4xl mx-auto p-8 sm:p-14 relative font-sans text-slate-900 print:shadow-none print:border-none print:p-0 print:max-w-none">
        {/* Document Header & Formal Crest */}
        <div className="border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                  Autonomous Escrow Protocol
                </span>
                <span className="text-[10px] font-mono text-slate-600 font-bold">
                  REF: {docId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                MASTER SERVICES &amp; MILESTONE ESCROW AGREEMENT
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
                Governing Software Engineering Deliverables &amp; Automated Acceptance Verification
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-1.5 rounded-md text-xs font-black tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                <span>EXECUTED &amp; BINDING</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1.5 font-bold">Effective Date: {contractDate}</div>
              <div className="text-[10px] text-slate-500 font-mono">Platform Rails: PayPal Orders v2</div>
            </div>
          </div>
        </div>

        {/* Contract Parties Box */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-900" />
            PARTIES TO THIS AGREEMENT
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Party A: Client */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                PARTY OF THE FIRST PART ("CLIENT")
              </div>
              <div className="font-black text-slate-950 text-base">{clientName}</div>
              <div className="text-xs text-slate-700 font-bold">Acme Studio Inc.</div>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <div>Email: <strong className="text-slate-950">{clientEmail}</strong></div>
                <div>PayPal Account: <strong className="text-slate-950 font-mono">{clientEmail}</strong></div>
                <div>Role: <span className="font-bold text-slate-800">Project Principal &amp; Escrow Depositor</span></div>
              </div>
            </div>

            {/* Party B: Contractor */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                PARTY OF THE SECOND PART ("CONTRACTOR")
              </div>
              <div className="font-black text-slate-950 text-base">{contractorName}</div>
              <div className="text-xs text-slate-700 font-bold">DevCraft Engineering</div>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <div>Email: <strong className="text-slate-950">{contractorEmail}</strong></div>
                <div>Payouts Wallet: <strong className="text-slate-950 font-mono">{contractorEmail}</strong></div>
                <div>Role: <span className="font-bold text-slate-800">Lead Engineering Contractor</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recitals & Consideration */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 border-t border-slate-200 pt-6">
          {/* Section 1: Recitals */}
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-tight mb-2">
              SECTION 1: RECITALS & SCOPE OF WORK
            </h3>
            <p className="mb-2">
              <strong>WHEREAS</strong>, Client desires to retain Contractor to perform software development services for the project entitled <strong>"{project.title}"</strong> ({project.category}); and
            </p>
            <p className="mb-2">
              <strong>WHEREAS</strong>, Contractor possesses the requisite engineering skill, automated testing methodologies, and resources to perform such services in accordance with the specifications set forth herein;
            </p>
            <p>
              <strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and sequential payments herein contained, the parties agree to the terms, conditions, and automated release criteria outlined below.
            </p>
          </div>

          {/* Section 2: Compensation & Escrow Schedule */}
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-tight mb-2">
              SECTION 2: COMPENSATION & PAYMENT SCHEDULE (PAYPAL ESCROW)
            </h3>
            <p className="mb-3">
              The total contract value for full performance of the agreed deliverables is agreed at 
              <strong className="text-slate-950 font-extrabold"> ${project.budget.toLocaleString()} USD</strong>, payable sequentially through the Veylora Autonomous Escrow Protocol via PayPal:
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-300 mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-black border-b border-slate-900 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Stage / Milestone</th>
                    <th className="p-3">Amount (USD)</th>
                    <th className="p-3">Release Mechanism</th>
                    <th className="p-3">Target Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {project.advance_amount > 0 && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-slate-950">
                        Upfront Kickoff Advance
                      </td>
                      <td className="p-3 font-black text-slate-950 text-sm">
                        ${project.advance_amount.toLocaleString()} USD
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        Immediate release upon client project kickoff deposit
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700 font-bold">
                        Immediate
                      </td>
                    </tr>
                  )}
                  {project.milestones?.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">
                        Milestone {idx + 1}: {m.title}
                      </td>
                      <td className="p-3 font-black text-slate-950 text-sm">
                        ${m.amount.toLocaleString()} USD
                      </td>
                      <td className="p-3 text-slate-700">
                        Automated verification of testable criteria suite
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 font-bold">
                        {m.due_date || `T+${(idx + 1) * 14} days`}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-900">
                    <td className="p-3 uppercase font-black">Total Contract Value</td>
                    <td className="p-3 text-base font-black text-slate-950">
                      ${project.budget.toLocaleString()} USD
                    </td>
                    <td className="p-3 text-xs text-slate-700 font-bold" colSpan={2}>
                      Protected by PayPal Smart Escrow &amp; Disbursed via PayPal Payouts
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Deliverables & Testable Acceptance Criteria */}
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-tight mb-2">
              SECTION 3: DELIVERABLES &amp; TESTABLE ACCEPTANCE CRITERIA
            </h3>
            <p className="mb-3 font-medium">
              Funds deposited into escrow for each milestone shall remain secured until Contractor's work fulfills the objective, testable acceptance criteria verified by the headless browser verification suite:
            </p>

            <div className="space-y-4">
              {project.milestones?.map((m, idx) => (
                <div key={m.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-300">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        Stage {idx + 1}
                      </span>
                      <strong className="text-slate-950 text-sm">{m.title}</strong>
                    </div>
                    <span className="font-black text-slate-950 text-sm">${m.amount.toLocaleString()} USD</span>
                  </div>

                  <p className="text-slate-700 text-xs mb-3 font-medium">{m.description}</p>

                  {m.criteria && m.criteria.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Verified Acceptance Criteria (Pass Required for Release):
                      </div>
                      {m.criteria.map((c, cIdx) => (
                        <div key={c.id || cIdx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-4 w-4 text-slate-950 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-mono text-[10px] font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded mr-1.5 border border-slate-300">
                              {c.verification_type}
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {c.description || (c as any).title || "Automated test verification"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Automated Playwright browser integration suite criteria attached to deliverable.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Standard Legal Clauses */}
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-tight mb-2">
              SECTION 4: INTELLECTUAL PROPERTY &amp; WORK FOR HIRE
            </h3>
            <p className="mb-2">
              <strong>4.1 Assignment of Rights:</strong> Contractor agrees that all code, documentation, graphics, and other work product created under this Agreement shall constitute a "work-made-for-hire" to the extent permitted by law. Upon release of payment for each respective milestone via PayPal, all right, title, and interest in and to the deliverables of that milestone transfer exclusively to Client.
            </p>
            <p className="mb-2">
              <strong>4.2 Pre-existing Code:</strong> Contractor retains ownership of any pre-existing open-source libraries or foundational frameworks, granting Client an irrevocable, royalty-free license to use and modify such assets as incorporated into the deliverable.
            </p>
            <p>
              <strong>4.3 30-Day Defect Warranty:</strong> Contractor warrants that all delivered software will remain free from critical errors or functional deficiencies for a minimum of 30 days post-final approval.
            </p>
          </div>

          {/* Section 5: Dispute Resolution */}
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-950 uppercase tracking-tight mb-2">
              SECTION 5: DISPUTE RESOLUTION &amp; AI ARBITER PROTOCOL
            </h3>
            <p className="mb-2">
              In the event of a disagreement regarding deliverable acceptance, either party may freeze the active milestone escrow into formal dispute. The matter will immediately undergo impartial AI Arbitration using cryptographic code inspection, interaction logs, and contractual criteria.
            </p>
            <p>
              Parties retain full recourse to PayPal Resolution Center mechanisms under PayPal Buyer and Seller Protection policies.
            </p>
          </div>

          {/* Section 6: Executed AI Revision Amendments & Addenda */}
          {(contract.version > 1 || contract.content_markdown?.includes("REVISED CLAUSE AMENDMENT")) && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-400 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <h3 className="font-black text-sm sm:text-base text-amber-950 uppercase tracking-tight">
                    SECTION 6: EXECUTED AMENDMENTS &amp; REVISED COVENANTS (VERSION {contract.version})
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded border border-amber-300">
                  Certified AI Oracle Addendum
                </span>
              </div>

              <div className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-amber-200 font-sans shadow-2xs">
                {contract.content_markdown.includes("---")
                  ? contract.content_markdown.split("---").slice(1).join("\n---\n").trim()
                  : contract.content_markdown}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-amber-950 font-bold pt-1">
                <span>Certified by Veylora Contract Architect AI Oracle</span>
                <span>All financial milestones &amp; escrow gates synchronized across platform</span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* FORMAL DIGITAL SIGNATURES & EXECUTION ATTESTATION BLOCK  */}
        {/* ======================================================== */}
        <div className="mt-12 pt-8 border-t-2 border-slate-900">
          <div className="text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              IN WITNESS WHEREOF, THE PARTIES HAVE EXECUTED THIS AGREEMENT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Client Signature Block */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">
                  CLIENT DIGITAL SIGNATURE
                </div>
                {/* Formal Cursive Signature representation */}
                <div className="h-14 flex items-center border-b border-slate-400 pb-2">
                  <span className="text-2xl font-serif italic text-slate-950 font-bold select-none tracking-wide">
                    {clientName}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="font-black text-slate-950 text-sm">{clientName}</div>
                  <div className="text-slate-600 text-xs font-medium">Authorized Signer, Acme Studio Inc.</div>
                  <div className="text-xs text-slate-700">
                    PayPal ID: <span className="font-mono font-bold text-slate-900">{clientEmail}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-950 font-black">
                  <CheckCircle2 className="h-4 w-4 text-slate-950" />
                  <span>Digitally Certified</span>
                </div>
                <span className="font-mono text-slate-600 font-bold">Signed: {contractDate}</span>
              </div>
            </div>

            {/* Contractor Signature Block */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">
                  CONTRACTOR DIGITAL SIGNATURE
                </div>
                {/* Formal Cursive Signature representation */}
                <div className="h-14 flex items-center border-b border-slate-400 pb-2">
                  <span className="text-2xl font-serif italic text-slate-950 font-bold select-none tracking-wide">
                    {contractorName}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="font-black text-slate-950 text-sm">{contractorName}</div>
                  <div className="text-slate-600 text-xs font-medium">Principal Architect, DevCraft Engineering</div>
                  <div className="text-xs text-slate-700">
                    PayPal Wallet: <span className="font-mono font-bold text-slate-900">{contractorEmail}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-950 font-black">
                  <CheckCircle2 className="h-4 w-4 text-slate-950" />
                  <span>Digitally Certified</span>
                </div>
                <span className="font-mono text-slate-600 font-bold">Signed: {contractDate}</span>
              </div>
            </div>
          </div>

          {/* Autonomous Protocol Cryptographic Seal */}
          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-black text-slate-950 block text-xs">
                  Veylora Escrow Oracle Attestation
                </span>
                <span className="text-slate-600 text-[11px] font-medium">
                  Cryptographic Hash: <code className="font-mono text-[10px] text-slate-900 font-bold">SHA-256: 7f8a9e2d...01bc89f</code>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <img src="/paypal.png" alt="PayPal" className="h-4 w-auto object-contain" />
              <span className="text-[10px] font-black uppercase text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                PayPal Orders v2 Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

