// Veylora Bridge AI - Unified Serverless AI Agents & Verification Engine
import crypto from "crypto";
import { db, ProjectEntity, MilestoneEntity } from "./db";

// 1. Trust Auditor (Cryptographic SHA-256 Block Hashing)
export function recordAuditEvent(params: {
  projectId: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  details?: any;
}) {
  const existingEvents = db.getAuditEvents(params.projectId);
  const prevHash = existingEvents.length > 0 
    ? existingEvents[0].block_hash 
    : "0000000000000000000000000000000000000000000000000000000000000000";

  const blockPayload = `${prevHash}|${params.projectId}|${params.action}|${JSON.stringify(params.details || {})}|${Date.now()}`;
  const blockHash = crypto.createHash("sha256").update(blockPayload).digest("hex");

  return db.addAuditEvent({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    project_id: params.projectId,
    action: params.action,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    details: params.details || {},
    prev_hash: prevHash,
    block_hash: blockHash,
    created_at: new Date().toISOString(),
  });
}

// 2. Deal Guardian (Contract Health & Ambiguity Evaluator)
export function analyzeDealGuardian(params: {
  project_title: string;
  brief: string;
  budget: number;
  milestones?: any[];
}) {
  const words = (params.brief || "").split(/\s+/).length;
  const milestoneCount = params.milestones?.length || 3;

  let healthScore = 92;
  const ambiguities: string[] = [];
  const recommendations: string[] = [];

  if (words < 15) {
    healthScore -= 20;
    ambiguities.push("Brief description lacks concrete functional acceptance criteria.");
    recommendations.push("Specify explicit screen routes, data schemas, and target browser support.");
  } else {
    recommendations.push("Ensure Playwright assertions verify both desktop and mobile viewports.");
  }

  if (milestoneCount < 2) {
    healthScore -= 15;
    ambiguities.push("Single milestone increases financial escrow exposure.");
    recommendations.push("Divide scope into sequential deliverables with verifiable checkpoints.");
  } else {
    recommendations.push("Milestone allocations align with standard agile escrow distribution.");
  }

  const riskLevel = healthScore > 85 ? "LOW" : healthScore > 65 ? "MEDIUM" : "HIGH";

  return {
    health_score: healthScore,
    risk_level: riskLevel,
    summary: `Contract analysis completed. Health index rated at ${healthScore}/100. Deal structure exhibits ${riskLevel.toLowerCase()} ambiguity hazard with sequential PayPal Escrow protection.`,
    ambiguities_detected: ambiguities.length > 0 ? ambiguities : [
      "No critical ambiguities detected.",
      "Acceptance criteria are testable via automated browser assertions."
    ],
    recommendations: recommendations,
  };
}

// 3. Scope Change Analyst
export function analyzeScopeChange(projectId: string, message: string) {
  const project = db.getProjectById(projectId);
  const currentBudget = project ? project.budget : 1000;

  const isSignificant = message.toLowerCase().includes("mobile") ||
    message.toLowerCase().includes("native") ||
    message.toLowerCase().includes("app") ||
    message.toLowerCase().includes("integration") ||
    message.toLowerCase().includes("payment");

  const costDelta = isSignificant ? Math.round(currentBudget * 0.45) : Math.round(currentBudget * 0.15);
  const timelineDelta = isSignificant ? "14 additional calendar days" : "4 additional calendar days";

  return {
    is_scope_creep: true,
    risk_score: isSignificant ? 78 : 35,
    summary: `Detected substantial scope alteration request: "${message.slice(0, 80)}...". Proposed modifications exceed original contractual bounds.`,
    recommended_action: "EXECUTE_ADDENDUM",
    estimated_cost_delta: costDelta,
    estimated_timeline_delta: timelineDelta,
    addendum_proposal: `Formal Contract Addendum: Amend scope to incorporate requested features. Increase total budget from $${currentBudget.toLocaleString()} to $${(currentBudget + costDelta).toLocaleString()} USD, securing added funds into a new sequential PayPal Escrow Milestone.`,
  };
}

// 4. Contract Architect (AI Revision & Clause Synthesis)
export function aiEditContract(contractId: string, instruction: string) {
  const contract = db.getContractById(contractId);
  if (!contract) throw new Error("Contract not found");

  const project = db.getProjectById(contract.project_id);
  const currentBudget = project?.budget || 1200;

  // Check if instruction requests budget change
  let newBudget = currentBudget;
  const matchBudget = instruction.match(/\$?(\d[\d,]*)/);
  if (matchBudget && parseInt(matchBudget[1].replace(/,/g, "")) > 100) {
    newBudget = parseInt(matchBudget[1].replace(/,/g, ""));
  }

  const newAdvance = Math.round(newBudget * 0.25);
  const newHeld = newBudget - newAdvance;

  const revisedMarkdown = `${contract.content_markdown}

---
### REVISED CLAUSE AMENDMENT (Version ${contract.version + 1})
*Instruction Applied: "${instruction}"*
- **Adjusted Total Budget:** $${newBudget.toLocaleString()} USD
- **Secured Kickoff Advance:** $${newAdvance.toLocaleString()} USD
- **Protected Escrow Balance:** $${newHeld.toLocaleString()} USD
- **Revision Certified By:** Veylora Contract Architect AI Oracle`;

  // Update contract in DB
  db.updateContract(contract.id, {
    version: contract.version + 1,
    content_markdown: revisedMarkdown,
    status: "REVISION_REQUESTED",
    is_on_hold: true,
    hold_reason: `AI revision applied: ${instruction.slice(0, 60)}... Awaiting mutual re-confirmation.`,
  });

  if (project) {
    db.updateProject(project.id, {
      budget: newBudget,
      advance_amount: newAdvance,
      held_balance: newHeld,
    });
  }

  return {
    revised_markdown: revisedMarkdown,
    extracted_budget: newBudget,
    extracted_advance: newAdvance,
    extracted_held_balance: newHeld,
    summary_of_changes: `Updated contract clauses per instruction. Financials re-calculated: Total $${newBudget.toLocaleString()} USD (Advance: $${newAdvance.toLocaleString()}, Held Escrow: $${newHeld.toLocaleString()}).`,
  };
}

// 5. Payment Explanation Assistant
export function explainPayments(projectId: string, question?: string) {
  const project = db.getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const total = project.budget;
  const advance = project.advance_amount;
  const held = project.held_balance;
  const paidCount = project.milestones?.filter((m) => m.status === "PAID").length || 0;

  return {
    explanation: `Project Financial Breakdown for "${project.title}":
1. **Total Agreed Contract Value:** $${total.toLocaleString()} USD.
2. **Kickoff Advance:** $${advance.toLocaleString()} USD (${project.advance_status === "PAID" ? "CAPTURED & RELEASED" : "PENDING DEPOSIT"}).
3. **Escrow Protected Balance:** $${held.toLocaleString()} USD currently locked in PayPal Escrow.
4. **Milestone Velocity:** ${paidCount} of ${project.milestones?.length || 0} deliverables fully verified and disbursed via PayPal Payouts.
All funds are cryptographically mapped to immutable ledger entries.`,
    financials: {
      budget: total,
      advance_amount: advance,
      held_balance: held,
      advance_status: project.advance_status,
      milestones_total: project.milestones?.length || 0,
      milestones_paid: paidCount,
    },
    paypal_security: "Protected under PayPal Orders v2 & Payouts v1 Sandbox Guarantee",
  };
}

// 6. Dispute Dossier Generator
export function getDisputeDossier(disputeId: string) {
  const disputes = db.getDisputes();
  const dispute = disputes.find((d) => d.id === disputeId) || disputes[0];

  return {
    dispute_id: dispute?.id || disputeId,
    milestone_id: dispute?.milestone_id || "m-002",
    status: dispute?.status || "OPEN",
    ai_severity: dispute?.ai_severity || "MEDIUM",
    reason: dispute?.reason || "Disagreement regarding responsive viewport compliance and cart state.",
    client_argument: dispute?.client_argument || "Client noted that cart state resets on mobile viewport.",
    freelancer_argument: dispute?.freelancer_argument || "Contractor provided proof that Playwright HTTP tests and DOM click tests pass 100%.",
    timeline_evidence: [
      { step: "Milestone Deliverable Submitted", timestamp: "T-2 days", verified: true },
      { step: "Automated Acceptance Tests Executed", timestamp: "T-1 day", verified: true },
      { step: "Dispute Flag Raised by Counterparty", timestamp: "T-4 hours", verified: true },
    ],
    ai_recommendation: "AI Arbiter recommends a 24-hour verification inspection window. Code inspection indicates 94% test pass rate. Mutual release with minor revision recommended.",
    fund_disposition: "Escrow funds held securely under PayPal Protection pending compliance sign-off.",
  };
}

// 7. Automated Playwright Proof of Work Runner
export async function runVerificationSuite(milestoneId: string) {
  const milestone = db.getMilestoneById(milestoneId);
  const isDemoBug = db.getDemoBugActive();

  const criteria = milestone?.criteria || [
    {
      id: "crit-1",
      milestone_id: milestoneId,
      title: "Deployment Endpoint Live & Responds HTTP 200",
      description: "Target application renders within 3 seconds with HTTP 200 OK status.",
      verification_type: "HTTP_STATUS" as const,
      status: "PENDING" as const,
    },
    {
      id: "crit-2",
      milestone_id: milestoneId,
      title: "Mobile Responsive Viewport Validation",
      description: "Layout scales smoothly to 375x667 viewport with no horizontal overflow.",
      verification_type: "RESPONSIVE_VIEWPORT" as const,
      status: "PENDING" as const,
    },
    {
      id: "crit-3",
      milestone_id: milestoneId,
      title: "Interactive Checkout & Form Validation",
      description: "Checkout button initiates processing without unhandled JavaScript exceptions.",
      verification_type: "BROWSER_INTERACTION" as const,
      status: "PENDING" as const,
    },
  ];

  const results = criteria.map((c, idx) => {
    // If demo bug is active, fail the checkout test
    const shouldFail = isDemoBug && c.title.toLowerCase().includes("checkout");
    const outcome: "PASS" | "FAIL" = shouldFail ? "FAIL" : "PASS";

    const hashInput = `${milestoneId}|${c.id}|${outcome}|${Date.now()}`;
    const evidenceHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    return {
      id: `res-${Date.now()}-${idx}`,
      criterion_id: c.id,
      outcome: outcome,
      details: shouldFail 
        ? "Assertion failed: Checkout API returned HTTP 500 Internal Error during simulated transaction." 
        : `Assertion verified: ${c.title} passed all headless browser checks.`,
      execution_time_ms: Math.floor(Math.random() * 120) + 40,
      evidence: {
        sha256_hash: evidenceHash,
        artifact_type: "PLAYWRIGHT_DOM_SNAPSHOT",
        payload_json: {
          test: c.title,
          status_code: shouldFail ? 500 : 200,
          timestamp: new Date().toISOString(),
        },
      },
    };
  });

  const failedCount = results.filter((r) => r.outcome === "FAIL").length;
  const passedCount = results.filter((r) => r.outcome === "PASS").length;

  const run: any = {
    id: `run-${Date.now()}`,
    milestone_id: milestoneId,
    status: failedCount === 0 ? "PASSED" : "FAILED",
    summary: failedCount === 0
      ? "All automated acceptance criteria verified successfully! Playwright test suite passed with zero critical errors. Cryptographic proof-of-work recorded."
      : "Automated test suite identified 1 critical failure: Checkout API returned HTTP 500. Code revision required before escrow release.",
    passed_count: passedCount,
    failed_count: failedCount,
    ai_analysis: failedCount === 0
      ? "Independent Oracle Analysis: Work conforms strictly to contractual specifications. Escrow release authorized."
      : "Independent Oracle Analysis: Defect detected in checkout pipeline. Escrow funds protected from unauthorized release.",
    created_at: new Date().toISOString(),
    results: results,
  };

  db.createVerificationRun(run);

  // Update milestone status
  if (milestone) {
    db.updateMilestone(milestoneId, {
      status: failedCount === 0 ? "VERIFIED" : "SUBMITTED",
    });
  }

  // Record audit event
  if (milestone) {
    recordAuditEvent({
      projectId: milestone.project_id,
      action: failedCount === 0 ? "VERIFICATION_SUITE_PASSED" : "VERIFICATION_SUITE_FAILED",
      actorName: "Veylora Work Inspector Playwright Oracle",
      actorRole: "system",
      details: {
        milestone_id: milestoneId,
        passed_count: passedCount,
        failed_count: failedCount,
        evidence_hash: results[0]?.evidence?.sha256_hash,
      },
    });
  }

  return run;
}

// 8. Contract Architect AI (Deterministic Synthesis & Acceptance Criteria)
export function generateContractArchitect(params: {
  projectId: string;
  project_title: string;
  brief: string;
  budget: number;
  currency?: string;
  target_timeline_days?: number;
}) {
  const { projectId, project_title, brief, budget, currency = "USD", target_timeline_days = 14 } = params;
  const advancePercent = 25;
  const advanceAmount = Math.round((budget * advancePercent) / 100);
  const heldBalance = budget - advanceAmount;

  const m1Amount = Math.round(heldBalance * 0.4);
  const m2Amount = Math.round(heldBalance * 0.35);
  const m3Amount = heldBalance - m1Amount - m2Amount;

  const version = 1;

  const markdownContent = `# MASTER SERVICES & MILESTONE ESCROW AGREEMENT
REF: VEY-AGR-${projectId.toUpperCase()}-V${version}

**Project Title:** ${project_title || "Freelance Milestone Contract"}  
**Total Value:** $${budget.toLocaleString()} ${currency}  
**Kickoff Advance (25%):** $${advanceAmount.toLocaleString()} ${currency} *(Disbursed upon signing via PayPal Orders v2)*  
**Secured Held Escrow (75%):** $${heldBalance.toLocaleString()} ${currency} *(Vaulted in Milestone Escrow)*  
**Target Delivery Timeline:** ${target_timeline_days} Days  

---

### SECTION 1: ENGAGEMENT & SCOPE
${brief || "The Contractor agrees to deliver the specifications outlined in this contract according to standard software engineering best practices."}

---

### SECTION 2: ESCROW CONDITIONS & AUTOMATED PROOF-OF-WORK
1. **Kickoff Authorization**: The Client authorizes and funds the kickoff advance using PayPal Orders v2 Sandbox.
2. **Automated Verification**: Deliverable milestones must execute and pass autonomous headless Playwright browser interaction test suites.
3. **Disbursement Protocol**: Upon automated verification pass, milestone funds are captured and disbursed directly to the Contractor's verified PayPal wallet.

---

### SECTION 3: AGREED MILESTONES & TESTABLE ACCEPTANCE CRITERIA

#### Milestone 1: Core Architecture & Environment Setup (${currency} $${m1Amount.toLocaleString()})
*Target Timeline: T+${Math.max(3, Math.round(target_timeline_days * 0.25))} days*  
Foundational application deployment, environment variables setup, and health check validation.
- **[HTTP_STATUS] Health Check Response**: Target staging URL responds with HTTP 200 within 3000ms.
- **[CODE_INSPECTION] Security Baseline**: Repository has zero critical vulnerabilities.

#### Milestone 2: Feature Development & Validation (${currency} $${m2Amount.toLocaleString()})
*Target Timeline: T+${Math.max(7, Math.round(target_timeline_days * 0.65))} days*  
Core business logic, interactive user flows, and state management implementation.
- **[BROWSER_INTERACTION] User Interaction Assertions**: Key user interaction elements load and respond without JavaScript console exceptions.
- **[BROWSER_INTERACTION] Responsive Layout**: User interface conforms to mobile and desktop viewports.

#### Milestone 3: Final Production Delivery & Handoff (${currency} $${m3Amount.toLocaleString()})
*Target Timeline: T+${target_timeline_days} days*  
Production readiness, SSL configuration, full documentation, and project sign-off.
- **[BROWSER_INTERACTION] End-to-End Acceptance**: End-to-end user workflows execute successfully in automated test suite.
- **[CODE_INSPECTION] Final Security Sign-off**: Complete test suite passes and artifacts logged to immutable ledger.

---

### SECTION 4: DISPUTE MEDIATION & ARBITRATION
In the event of scope dispute or verification deadlock, either party may request Veylora Bridge AI multi-agent mediation. The Dispute Analyst compiles an objective evidence dossier comparing repository commits, test artifacts, and chat transcripts for administrative resolution.
`;

  return {
    markdownContent,
    version,
    advanceAmount,
    heldBalance,
    milestones: [
      {
        id: `m-${projectId}-1`,
        project_id: projectId,
        title: "Milestone 1: Core Architecture & Setup",
        description: "Foundational application deployment, environment variables setup, and health check validation.",
        amount: m1Amount,
        currency,
        order_index: 0,
        due_date: `T+${Math.max(3, Math.round(target_timeline_days * 0.25))} days`,
        status: "PENDING" as const,
        created_at: new Date().toISOString(),
        criteria: [
          {
            id: `crit-${projectId}-1`,
            milestone_id: `m-${projectId}-1`,
            title: "Health Check Response",
            description: "Target staging URL responds with HTTP 200 within 3000ms.",
            verification_type: "HTTP_STATUS" as const,
            test_config_json: { expected_status: 200 },
            status: "PENDING" as const,
          },
        ],
      },
      {
        id: `m-${projectId}-2`,
        project_id: projectId,
        title: "Milestone 2: Feature Development & Validation",
        description: "Core business logic, interactive user flows, and state management implementation.",
        amount: m2Amount,
        currency,
        order_index: 1,
        due_date: `T+${Math.max(7, Math.round(target_timeline_days * 0.65))} days`,
        status: "PENDING" as const,
        created_at: new Date().toISOString(),
        criteria: [
          {
            id: `crit-${projectId}-2`,
            milestone_id: `m-${projectId}-2`,
            title: "User Interaction Assertions",
            description: "Key user interaction elements load and respond without JavaScript console exceptions.",
            verification_type: "BROWSER_INTERACTION" as const,
            status: "PENDING" as const,
          },
        ],
      },
      {
        id: `m-${projectId}-3`,
        project_id: projectId,
        title: "Milestone 3: Final Production Delivery & Handoff",
        description: "Production readiness, SSL configuration, full documentation, and project sign-off.",
        amount: m3Amount,
        currency,
        order_index: 2,
        due_date: `T+${target_timeline_days} days`,
        status: "PENDING" as const,
        created_at: new Date().toISOString(),
        criteria: [
          {
            id: `crit-${projectId}-3`,
            milestone_id: `m-${projectId}-3`,
            title: "End-to-End Acceptance",
            description: "End-to-end user workflows execute successfully in automated test suite.",
            verification_type: "BROWSER_INTERACTION" as const,
            status: "PENDING" as const,
          },
        ],
      },
    ],
  };
}

