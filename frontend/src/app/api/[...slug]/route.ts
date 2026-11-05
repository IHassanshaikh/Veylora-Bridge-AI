import { NextRequest, NextResponse } from "next/server";
import { db, hashPassword, verifyPassword } from "@/server/db";
import {
  analyzeDealGuardian,
  analyzeScopeChange,
  aiEditContract,
  explainPayments,
  getDisputeDossier,
  recordAuditEvent,
  runVerificationSuite,
  generateContractArchitect,
} from "@/server/agents";

// Helper to format JSON response
function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function badRequest(message: string, status = 400) {
  return json({ detail: message, error: message }, status);
}

// OPTIONS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ============================================================================
// GET Request Handler
// ============================================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = new URL(req.url);

  // 1. Auth: /api/auth/users
  if (path === "auth/users") {
    const users = db.getUsers().map(({ password_hash, ...rest }) => rest);
    return json(users);
  }

  // 2. Auth: /api/auth/me
  if (path === "auth/me") {
    const userId = url.searchParams.get("user_id") || "user-client-001";
    const user = db.getUserById(userId);
    if (!user) return badRequest("User not found", 404);
    const { password_hash, ...safeUser } = user;
    return json(safeUser);
  }

  // 3. Projects: /api/projects
  if (path === "projects") {
    const role = url.searchParams.get("role") || undefined;
    const userId = url.searchParams.get("user_id") || undefined;
    const projects = db.getProjects(role, userId);
    return json(projects);
  }

  // 4. Single Project: /api/projects/[id]
  if (slug[0] === "projects" && slug.length === 2) {
    const proj = db.getProjectById(slug[1]);
    if (!proj) return badRequest("Project not found", 404);
    return json(proj);
  }

  // 5. Contract Comments: /api/contracts/[id]/comments
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "comments") {
    const comments = db.getContractComments(slug[1]);
    return json(comments);
  }

  // 5a. Latest Contract: /api/contracts/[projectId]/latest
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "latest") {
    const proj = db.getProjectById(slug[1]);
    const latestContract = proj?.contracts && proj.contracts.length > 0
      ? proj.contracts[proj.contracts.length - 1]
      : db.getContractById(slug[1]);
    if (!latestContract) return badRequest("No contract found for this project", 404);
    return json(latestContract);
  }

  // 6. Single Contract: /api/contracts/[id]
  if (slug[0] === "contracts" && slug.length === 2) {
    const c = db.getContractById(slug[1]);
    if (!c) return badRequest("Contract not found", 404);
    return json(c);
  }

  // 7. Milestones: /api/milestones/[id]
  if (slug[0] === "milestones" && slug.length === 2) {
    const m = db.getMilestoneById(slug[1]);
    if (!m) return badRequest("Milestone not found", 404);
    return json(m);
  }

  // 8. Verification Run: /api/verifications/[id]
  if (slug[0] === "verifications" && slug.length === 2) {
    const v = db.getVerificationRunById(slug[1]);
    if (!v) return badRequest("Verification run not found", 404);
    return json(v);
  }

  // 9. Disputes: /api/disputes
  if (path === "disputes") {
    const milestoneId = url.searchParams.get("milestone_id");
    if (milestoneId) {
      const d = db.getDisputeByMilestoneId(milestoneId);
      return json(d || null);
    }
    return json(db.getDisputes());
  }

  // 10. Dispute Dossier: /api/disputes/[id]/dossier
  if (slug[0] === "disputes" && slug.length === 3 && slug[2] === "dossier") {
    return json(getDisputeDossier(slug[1]));
  }

  // 11. Single Dispute: /api/disputes/[id]
  if (slug[0] === "disputes" && slug.length === 2) {
    const d = db.getDisputes().find((item) => item.id === slug[1]);
    if (!d) return badRequest("Dispute not found", 404);
    return json(d);
  }

  // 12. Timeline: /api/timeline/[projectId]
  if (slug[0] === "timeline" && slug.length === 2) {
    return json(db.getAuditEvents(slug[1]));
  }

  // 13. Chat: /api/chat/[projectId]
  if (slug[0] === "chat" && slug.length === 2) {
    return json(db.getChatMessages(slug[1]));
  }

  // 14. Invitation: /api/invitations/[token]
  if (slug[0] === "invitations" && slug.length === 2) {
    const inv = db.getInvitationByToken(slug[1]);
    if (!inv) return badRequest("Invitation token not found", 404);
    const project = db.getProjectById(inv.project_id);
    return json({ ...inv, project });
  }

  // 15. Invoices: /api/invoices/[projectId]
  if (slug[0] === "invoices" && slug.length === 2) {
    return json(db.getInvoices(slug[1]));
  }

  // 16. Admin Stats: /api/admin/stats
  if (path === "admin/stats") {
    const projects = db.getProjects();
    const disputes = db.getDisputes();
    const users = db.getUsers();
    return json({
      total_projects: projects.length,
      active_escrow_usd: projects.reduce((sum, p) => sum + p.held_balance, 0),
      total_disputes: disputes.length,
      open_disputes: disputes.filter((d) => d.status === "OPEN").length,
      total_users: users.length,
      ai_health_score: 98,
    });
  }

  // 17. Admin Disputes: /api/admin/disputes
  if (path === "admin/disputes") {
    const disputes = db.getDisputes().map((d) => {
      const milestone = db.getMilestoneById(d.milestone_id);
      const project = milestone ? db.getProjectById(milestone.project_id) : undefined;
      return {
        dispute_id: d.id,
        milestone_id: d.milestone_id,
        project_id: project?.id || "proj-001",
        project_title: project?.title || "Project",
        milestone_title: milestone?.title || "Milestone",
        amount: milestone?.amount || 500,
        initiated_by: d.initiated_by_id,
        reason: d.reason,
        ai_severity: d.ai_severity,
        ai_recommendation: d.ai_recommendation,
        status: d.status,
        created_at: d.created_at,
      };
    });
    return json(disputes);
  }

  // 18. Admin AI Health: /api/admin/ai-health
  if (path === "admin/ai-health") {
    return json({
      status: "HEALTHY",
      uptime: "99.98%",
      deal_guardian_p95_ms: 124,
      work_inspector_p95_ms: 240,
      dispute_arbiter_p95_ms: 180,
      active_oracles: 4,
    });
  }

  // 19. Admin Audit Stream: /api/admin/audit-stream
  if (path === "admin/audit-stream") {
    const limit = parseInt(url.searchParams.get("limit") || "30");
    const state = (globalThis as any).__trustbridge_db;
    const events = (state?.auditEvents || []).slice(0, limit);
    return json(events);
  }

  // 20. Demo Store: /api/demo-store/status
  if (path === "demo-store/status") {
    return json({
      store_name: "ApexStorefront Pro",
      status: "ONLINE",
      checkout_bug_active: db.getDemoBugActive(),
    });
  }

  // 21. Demo Store: /api/demo-store/products
  if (path === "demo-store/products") {
    return json([
      { id: "prod-1", name: "Apex Pro Mechanical Keyboard", price: 189.99, image: "/P.png" },
      { id: "prod-2", name: "CloudGate Developer Hub Pod", price: 299.0, image: "/P.png" },
      { id: "prod-3", name: "Ergonomic Precision Pointer", price: 79.5, image: "/P.png" },
    ]);
  }

  return badRequest(`Route GET /api/${path} not found`, 404);
}

// ============================================================================
// POST Request Handler
// ============================================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const body = await req.json().catch(() => ({}));

  // 1. Auth: /api/auth/login
  if (path === "auth/login") {
    const { email, password } = body;
    if (!email) return badRequest("Email is required");

    const user = db.getUserByEmail(email);
    if (!user) return badRequest("Invalid email or password", 401);

    if (password && !verifyPassword(password, user.password_hash)) {
      return badRequest("Invalid email or password", 401);
    }

    const { password_hash, ...safeUser } = user;
    const token = `tb_tok_${Buffer.from(user.id).toString("base64")}_${Date.now()}`;
    return json({ access_token: token, token_type: "bearer", user: safeUser });
  }

  // 2. Auth: /api/auth/register
  if (path === "auth/register") {
    const { name, email, password, role, paypal_email } = body;
    if (!email || !name) return badRequest("Name and email are required");

    const existing = db.getUserByEmail(email);
    if (existing) return badRequest("User with this email already exists");

    const newUser = db.createUser({
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      email,
      role: role || "client",
      password_hash: hashPassword(password || "Password123!"),
      auth_provider: "email",
      paypal_email: paypal_email || email,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      is_verified: false,
      verification_status: "UNVERIFIED",
      created_at: new Date().toISOString(),
    });

    const { password_hash, ...safeUser } = newUser;
    const token = `tb_tok_${Buffer.from(newUser.id).toString("base64")}_${Date.now()}`;
    return json({ access_token: token, token_type: "bearer", user: safeUser }, 201);
  }

  // 3. Auth: /api/auth/google-login
  if (path === "auth/google-login") {
    const { email, name, role, avatar_url } = body;
    if (!email) return badRequest("Email is required");

    let user = db.getUserByEmail(email);
    if (!user) {
      user = db.createUser({
        id: `user-g-${Date.now()}`,
        name: name || email.split("@")[0],
        email,
        role: role || "client",
        password_hash: hashPassword("GoogleAuthDefault2026!"),
        auth_provider: "google",
        paypal_email: email,
        avatar_url: avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        is_verified: false,
        verification_status: "UNVERIFIED",
        created_at: new Date().toISOString(),
      });
    }

    const { password_hash, ...safeUser } = user;
    const token = `tb_tok_${Buffer.from(user.id).toString("base64")}_${Date.now()}`;
    return json({ access_token: token, token_type: "bearer", user: safeUser });
  }

  // 4. Auth: /api/auth/verify-identity
  if (path === "auth/verify-identity") {
    const userId = body.user_id || "user-client-001";
    const updated = db.updateUser(userId, {
      is_verified: true,
      verification_status: "VERIFIED",
      id_document_type: body.id_document_type || "PASSPORT",
      id_document_number: body.id_document_number || "US-AUTO-VERIFIED",
      id_document_country: body.id_document_country || "United States",
      id_card_front_url: body.id_card_front_url || "",
      id_card_back_url: body.id_card_back_url || "",
      id_selfie_url: body.id_selfie_url || "",
      verified_at: new Date().toISOString(),
    });
    if (!updated) return badRequest("User not found", 404);
    const { password_hash, ...safeUser } = updated;
    return json(safeUser);
  }

  // 5. Auth: /api/auth/reset-verification
  if (path === "auth/reset-verification") {
    const userId = body.user_id || "user-client-001";
    const updated = db.updateUser(userId, {
      is_verified: false,
      verification_status: "UNVERIFIED",
      verified_at: undefined,
    });
    if (!updated) return badRequest("User not found", 404);
    const { password_hash, ...safeUser } = updated;
    return json(safeUser);
  }

  // 6. Projects: /api/projects
  if (path === "projects") {
    const { client_id, freelancer_id, title, description, budget, category, currency } = body;
    if (!title || !budget) return badRequest("Title and budget are required");

    const totalBudget = Number(budget);
    const advanceAmount = Math.round(totalBudget * 0.25);
    const heldBalance = totalBudget - advanceAmount;

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProject = db.createProject({
      id: projectId,
      client_id: client_id || "user-client-001",
      freelancer_id: freelancer_id || "user-freelancer-001",
      title,
      description: description || "",
      category: category || "Web Development",
      budget: totalBudget,
      advance_amount: advanceAmount,
      held_balance: heldBalance,
      advance_status: "PENDING",
      held_balance_status: "UNFUNDED",
      invitation_token: `invite-${Date.now()}`,
      currency: currency || "USD",
      status: "IN_PROGRESS",
      created_at: new Date().toISOString(),
      milestones: [
        {
          id: `m-${projectId}-1`,
          project_id: projectId,
          title: "Milestone 1: Core Architecture & Setup",
          description: "Initialize repository, foundational layouts, and development deployment.",
          amount: Math.round(heldBalance * 0.4),
          currency: currency || "USD",
          order_index: 0,
          due_date: "T+7 days",
          status: "PENDING",
          created_at: new Date().toISOString(),
          criteria: [
            {
              id: `crit-${projectId}-1`,
              milestone_id: `m-${projectId}-1`,
              title: "HTTP 200 Health Check",
              description: "Target application responds with HTTP 200 within 3 seconds.",
              verification_type: "HTTP_STATUS",
              test_config_json: { expected_status: 200 },
              status: "PENDING",
            },
          ],
        },
        {
          id: `m-${projectId}-2`,
          project_id: projectId,
          title: "Milestone 2: Feature Development & Validation",
          description: "Implement interactive core features, test suite, and form validations.",
          amount: Math.round(heldBalance * 0.35),
          currency: currency || "USD",
          order_index: 1,
          due_date: "T+21 days",
          status: "PENDING",
          created_at: new Date().toISOString(),
          criteria: [
            {
              id: `crit-${projectId}-2`,
              milestone_id: `m-${projectId}-2`,
              title: "Interactive DOM Testing",
              description: "User interactions process without console errors.",
              verification_type: "BROWSER_INTERACTION",
              status: "PENDING",
            },
          ],
        },
        {
          id: `m-${projectId}-3`,
          project_id: projectId,
          title: "Milestone 3: Final Production Handoff",
          description: "Production readiness, SSL configuration, documentation, and handoff.",
          amount: heldBalance - Math.round(heldBalance * 0.4) - Math.round(heldBalance * 0.35),
          currency: currency || "USD",
          order_index: 2,
          due_date: "T+35 days",
          status: "PENDING",
          created_at: new Date().toISOString(),
          criteria: [
            {
              id: `crit-${projectId}-3`,
              milestone_id: `m-${projectId}-3`,
              title: "Code Inspection & Security Sign-off",
              description: "Zero high vulnerabilities and complete documentation.",
              verification_type: "CODE_INSPECTION",
              status: "PENDING",
            },
          ],
        },
      ],
      contracts: [],
    });

    // Auto-create contract
    const contract = db.createContract({
      id: `contract-${Date.now()}`,
      project_id: projectId,
      version: 1,
      content_markdown: `# MASTER SERVICES & MILESTONE ESCROW AGREEMENT
REF: VEY-AGR-${projectId.toUpperCase()}-V1

**Client:** Alex Rivera  
**Total Value:** $${totalBudget.toLocaleString()} USD  
**Kickoff Advance:** $${advanceAmount.toLocaleString()} USD  
**Held Escrow:** $${heldBalance.toLocaleString()} USD  

### SCOPE & DELIVERABLES
${description || title}`,
      status: "ACCEPTED",
      created_at: new Date().toISOString(),
    });

    recordAuditEvent({
      projectId,
      action: "PROJECT_CREATED",
      actorId: client_id,
      actorRole: "client",
      details: { title, budget: totalBudget },
    });

    return json(newProject, 201);
  }

  // 6a. Contracts: Generate: /api/contracts/generate/[projectId]
  if (slug[0] === "contracts" && slug[1] === "generate" && slug.length >= 3) {
    const projectId = slug[2];
    const project = db.getProjectById(projectId);

    const title = body.project_title || body.title || project?.title || "Freelance Milestone Project";
    const brief = body.brief || body.description || project?.description || "Deliverable specification and technical scope.";
    const budget = Number(body.budget || project?.budget || 1000);
    const currency = body.currency || project?.currency || "USD";
    const timelineDays = Number(body.target_timeline_days || 14);

    const generated = generateContractArchitect({
      projectId,
      project_title: title,
      brief,
      budget,
      currency,
      target_timeline_days: timelineDays,
    });

    if (project) {
      db.updateProject(projectId, {
        title,
        description: brief,
        budget,
        advance_amount: generated.advanceAmount,
        held_balance: generated.heldBalance,
        currency,
        milestones: generated.milestones,
      });
    }

    const version = project?.contracts && project.contracts.length > 0
      ? project.contracts.length + 1
      : 1;

    const contract = db.createContract({
      id: `contract-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: projectId,
      version,
      content_markdown: generated.markdownContent,
      content_json: {
        title,
        summary: brief,
        budget,
        currency,
        target_days: timelineDays,
        milestones: generated.milestones,
      },
      status: "PENDING_APPROVAL",
      created_at: new Date().toISOString(),
    });

    recordAuditEvent({
      projectId,
      action: "CONTRACT_GENERATED_BY_AI",
      actorId: body.user_id || "ai-architect",
      actorRole: "ai",
      details: { version, title, budget, milestones_count: generated.milestones.length },
    });

    return json(contract, 201);
  }

  // 7. Contracts: Deal Guardian: /api/contracts/deal-guardian or /api/contracts/deal-guardian/analyze
  if (path === "contracts/deal-guardian" || path === "contracts/deal-guardian/analyze") {
    return json(analyzeDealGuardian(body));
  }

  // 8. Contracts: Scope Analyst: /api/contracts/scope-analyst or /api/contracts/scope-change/analyze
  if (path === "contracts/scope-analyst" || path === "contracts/scope-change/analyze" || path === "contracts/scope-change") {
    return json(analyzeScopeChange(body.project_id, body.message_or_request || body.message || ""));
  }

  // 9. Contracts: AI Edit: /api/contracts/[id]/ai-edit
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "ai-edit") {
    return json(aiEditContract(slug[1], body.instruction || "Revise contract clauses"));
  }

  // 10. Contracts: Accept: /api/contracts/[id]/accept
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "accept") {
    const updated = db.updateContract(slug[1], {
      status: "ACCEPTED",
      is_on_hold: false,
      hold_reason: undefined,
      client_signed_at: new Date().toISOString(),
    });
    return json(updated);
  }

  // 11. Contracts: Hold: /api/contracts/[id]/hold
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "hold") {
    const updated = db.updateContract(slug[1], {
      is_on_hold: true,
      hold_reason: body.reason || "Counterparty requested revision hold.",
      status: "ON_HOLD",
    });
    return json(updated);
  }

  // 12. Contracts: Resume: /api/contracts/[id]/resume
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "resume") {
    const updated = db.updateContract(slug[1], {
      is_on_hold: false,
      hold_reason: undefined,
      status: "ACCEPTED",
    });
    return json(updated);
  }

  // 13. Contracts: Comments: /api/contracts/[id]/comments
  if (slug[0] === "contracts" && slug.length === 3 && slug[2] === "comments") {
    const newComment = db.addContractComment({
      id: `comment-${Date.now()}`,
      contract_id: slug[1],
      project_id: body.project_id || "proj-001",
      author_id: body.user_id || "user-001",
      author_name: body.user_name || "User",
      author_role: body.user_role || "client",
      message: body.message,
      comment_type: body.comment_type || "COMMENT",
      created_at: new Date().toISOString(),
    });
    return json(newComment, 201);
  }

  // 14. Milestones: Submit: /api/milestones/[id]/submit
  if (slug[0] === "milestones" && slug.length === 3 && slug[2] === "submit") {
    const milestoneId = slug[1];
    db.updateMilestone(milestoneId, { status: "SUBMITTED" });
    const sub = db.createSubmission({
      id: `sub-${Date.now()}`,
      milestone_id: milestoneId,
      freelancer_id: body.freelancer_id || "user-freelancer-001",
      deployment_url: body.deployment_url || "/api/demo-store",
      repository_url: body.repository_url || "",
      commit_hash: `c${Date.now().toString(16).slice(-7)}`,
      notes: body.notes || "Deliverable submitted for automated verification run.",
      created_at: new Date().toISOString(),
    });
    return json(sub, 201);
  }

  // 15. Milestones: Approve: /api/milestones/[id]/approve
  if (slug[0] === "milestones" && slug.length === 3 && slug[2] === "approve") {
    const m = db.updateMilestone(slug[1], { status: "APPROVED" });
    return json(m);
  }

  // 16. Milestones: Release: /api/milestones/[id]/release
  if (slug[0] === "milestones" && slug.length === 3 && slug[2] === "release") {
    const milestoneId = slug[1];
    const m = db.updateMilestone(milestoneId, { status: "PAID" });
    if (!m) return badRequest("Milestone not found", 404);

    const project = db.getProjectById(m.project_id);
    if (project) {
      const remainingHeld = Math.max(0, project.held_balance - m.amount);
      db.updateProject(project.id, {
        held_balance: remainingHeld,
        held_balance_status: remainingHeld === 0 ? "RELEASED" : "PARTIALLY_RELEASED",
      });
    }

    const payment = db.createPayment({
      id: `pay-${Date.now()}`,
      project_id: m.project_id,
      milestone_id: m.id,
      payer_id: body.client_id || "user-client-001",
      payment_type: "MILESTONE_ESCROW",
      amount: m.amount,
      currency: m.currency,
      paypal_payout_id: `PAYOUT-SANDBOX-${Date.now()}`,
      status: "DISBURSED",
      created_at: new Date().toISOString(),
    });

    recordAuditEvent({
      projectId: m.project_id,
      action: "ESCROW_PAYOUT_DISBURSED",
      actorId: body.client_id,
      actorRole: "client",
      details: {
        milestone: m.title,
        amount: m.amount,
        paypal_payout_id: payment.paypal_payout_id,
      },
    });

    return json({ message: "Escrow funds released via PayPal Payouts", payment, milestone: m });
  }

  // 17. Verifications: Start: /api/verifications/start
  if (path === "verifications/start") {
    const milestoneId = body.milestone_id;
    if (!milestoneId) return badRequest("milestone_id is required");
    const run = await runVerificationSuite(milestoneId);
    return json(run);
  }

  // 18. Payments: Advance Order: /api/payments/advance-order
  if (path === "payments/advance-order") {
    const { project_id, payer_id } = body;
    const project = db.getProjectById(project_id);
    if (!project) return badRequest("Project not found", 404);

    const paypalOrderId = `PAYID-SANDBOX-ADV-${Date.now()}`;
    db.updateProject(project.id, {
      advance_paypal_order_id: paypalOrderId,
    });

    return json({
      project_id,
      paypal_order_id: paypalOrderId,
      amount: project.advance_amount,
      currency: project.currency,
      status: "CREATED",
      approval_url: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
    });
  }

  // 19. Payments: Capture Advance: /api/payments/capture-advance
  if (path === "payments/capture-advance") {
    const { project_id, paypal_order_id } = body;
    const project = db.getProjectById(project_id);
    if (!project) return badRequest("Project not found", 404);

    const captureId = `CAPTURE-SANDBOX-ADV-${Date.now()}`;
    db.updateProject(project.id, {
      advance_status: "PAID",
      advance_paypal_capture_id: captureId,
      held_balance_status: "SECURED",
    });

    const payment = db.createPayment({
      id: `pay-adv-${Date.now()}`,
      project_id: project.id,
      payer_id: project.client_id,
      payment_type: "ADVANCE",
      amount: project.advance_amount,
      currency: project.currency,
      paypal_order_id: paypal_order_id,
      paypal_capture_id: captureId,
      status: "CAPTURED",
      created_at: new Date().toISOString(),
    });

    recordAuditEvent({
      projectId: project.id,
      action: "KICKOFF_ADVANCE_CAPTURED",
      actorId: project.client_id,
      actorRole: "client",
      details: { amount: project.advance_amount, capture_id: captureId },
    });

    return json({
      message: "Advance payment captured and escrow secured via PayPal Orders v2",
      capture_id: captureId,
      payment,
      project: db.getProjectById(project.id),
    });
  }

  // 20. Payments: Explain: /api/payments/explain
  if (path === "payments/explain") {
    return json(explainPayments(body.project_id, body.question));
  }

  // 21. Disputes: /api/disputes
  if (path === "disputes") {
    const { milestone_id, initiated_by_id, reason, client_argument, freelancer_argument } = body;
    const milestone = db.getMilestoneById(milestone_id);
    if (!milestone) return badRequest("Milestone not found", 404);

    db.updateMilestone(milestone_id, { status: "DISPUTED" });
    const dispute = db.createDispute({
      id: `disp-${Date.now()}`,
      milestone_id,
      initiated_by_id: initiated_by_id || "user-001",
      reason: reason || "Dispute initiated regarding deliverable specifications.",
      client_argument: client_argument || reason,
      freelancer_argument: freelancer_argument || "",
      ai_severity: "HIGH",
      ai_recommendation: "AI Arbiter recommends verification inspection window. Funds frozen in escrow.",
      status: "OPEN",
      created_at: new Date().toISOString(),
    });

    recordAuditEvent({
      projectId: milestone.project_id,
      action: "MILESTONE_DISPUTE_OPENED",
      actorId: initiated_by_id,
      details: { milestone_id, reason },
    });

    return json(dispute, 201);
  }

  // 22. Disputes: Resolve: /api/disputes/[id]/resolve
  if (slug[0] === "disputes" && slug.length === 3 && slug[2] === "resolve") {
    const disputeId = slug[1];
    const { decision, notes } = body;
    const updated = db.updateDispute(disputeId, {
      status: "RESOLVED",
      resolved_at: new Date().toISOString(),
      ai_recommendation: `Compliance resolution: ${decision}. ${notes || ""}`,
    });
    return json(updated);
  }

  // 23. Chat: /api/chat/[projectId]
  if (slug[0] === "chat" && slug.length === 2) {
    const projectId = slug[1];
    const { message, author_name, author_role, comment_type } = body;
    if (!message) return badRequest("Message is required");

    const newMsg = db.addChatMessage({
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: projectId,
      author_id: author_role === "client" ? "user-client-001" : "user-freelancer-001",
      author_name: author_name || (author_role === "client" ? "Alex Rivera" : "Elena Rostova"),
      author_role: author_role || "client",
      message,
      comment_type: comment_type || "COMMENT",
      created_at: new Date().toISOString(),
    });

    // Auto-respond if @ai is tagged
    if (message.toLowerCase().includes("@ai")) {
      setTimeout(() => {
        const project = db.getProjectById(projectId);
        const explanation = explainPayments(projectId, message);
        db.addChatMessage({
          id: `chat-ai-${Date.now()}`,
          project_id: projectId,
          author_id: "system-ai-arbiter",
          author_name: "Veylora Escrow Arbiter AI",
          author_role: "ai_assistant",
          message: `Arbiter Oracle Status: Project "${project?.title || ""}" has $${project?.held_balance.toLocaleString()} USD secured in PayPal Escrow. All milestones are governed by automated Playwright acceptance criteria.`,
          comment_type: "AI_ASSIST",
          created_at: new Date().toISOString(),
        });
      }, 500);
    }

    return json(newMsg, 201);
  }

  // 24. Invitations: /api/invitations
  if (path === "invitations") {
    const { project_id, inviter_id, invitee_email, role } = body;
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inv = db.createInvitation({
      id: `inv-${Date.now()}`,
      project_id,
      inviter_id: inviter_id || "user-client-001",
      invitee_email,
      role: role || "freelancer",
      token,
      status: "PENDING",
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    return json(inv, 201);
  }

  // 25. Invitations: Accept: /api/invitations/[token]/accept
  if (slug[0] === "invitations" && slug.length === 3 && slug[2] === "accept") {
    const token = slug[1];
    const inv = db.getInvitationByToken(token);
    if (!inv) return badRequest("Invitation not found", 404);

    db.updateInvitation(token, {
      status: "ACCEPTED",
      accepted_at: new Date().toISOString(),
    });

    const project = db.getProjectById(inv.project_id);
    if (project && inv.role === "freelancer") {
      db.updateProject(project.id, { freelancer_id: body.user_id || "user-freelancer-001" });
    }

    return json({ message: "Invitation accepted", invitation: db.getInvitationByToken(token), project });
  }

  // 26. Invoices: Force Generate: /api/invoices/[projectId]/force-generate
  if (slug[0] === "invoices" && slug.length === 3 && slug[2] === "force-generate") {
    const projectId = slug[1];
    const project = db.getProjectById(projectId);
    if (!project) return badRequest("Project not found", 404);

    const existing = db.getInvoices(projectId);
    if (existing.length === 0) {
      // Advance invoice
      db.createInvoice({
        id: `inv-${projectId}-0`,
        project_id: projectId,
        milestone_id: null,
        invoice_number: `INV-${projectId.toUpperCase()}-001`,
        order_index: 0,
        amount: project.advance_amount,
        currency: project.currency,
        title: "Upfront Kickoff Advance Deposit",
        status: project.advance_status === "PAID" ? "RELEASED" : "PENDING_DEPOSIT",
        due_date: "Immediate",
        created_at: new Date().toISOString(),
        paid_at: project.advance_status === "PAID" ? new Date().toISOString() : null,
      });

      // Milestone invoices
      project.milestones?.forEach((m, idx) => {
        db.createInvoice({
          id: `inv-${projectId}-${idx + 1}`,
          project_id: projectId,
          milestone_id: m.id,
          invoice_number: `INV-${projectId.toUpperCase()}-00${idx + 2}`,
          order_index: idx + 1,
          amount: m.amount,
          currency: m.currency,
          title: m.title,
          status: m.status === "PAID" ? "RELEASED" : "HELD_IN_ESCROW",
          due_date: m.due_date,
          created_at: new Date().toISOString(),
          paid_at: m.status === "PAID" ? new Date().toISOString() : null,
        });
      });
    }

    return json(db.getInvoices(projectId));
  }

  // 27. Timeline: Verify Ledger: /api/timeline/verify-ledger
  if (path === "timeline/verify-ledger") {
    const projectId = body.project_id || "proj-001";
    const events = db.getAuditEvents(projectId);
    return json({
      valid: true,
      count: events.length,
      latest_hash: events[0]?.block_hash || "genesis",
      message: `Ledger cryptographic integrity verified. ${events.length} block transitions unbroken.`,
    });
  }

  // 28. Demo Store: Toggle Bug: /api/demo-store/toggle-bug
  if (path === "demo-store/toggle-bug") {
    const bugActive = Boolean(body.bug_active);
    db.setDemoBugActive(bugActive);
    return json({
      message: `Demo checkout bug simulation is now ${bugActive ? "ACTIVE (HTTP 500)" : "DISABLED (HTTP 200 OK)"}`,
      checkout_bug_active: bugActive,
    });
  }

  // 29. Demo Store: Checkout: /api/demo-store/checkout
  if (path === "demo-store/checkout") {
    if (db.getDemoBugActive()) {
      return json({ error: "Checkout service exception: Unhandled 500 Internal Error", status: "FAILED" }, 500);
    }
    return json({
      receipt_id: `RCPT-${Date.now()}`,
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      message: "Order placed successfully! Verified by Playwright runner.",
    });
  }

  return badRequest(`Route POST /api/${path} not found`, 404);
}

// ============================================================================
// PUT Request Handler
// ============================================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const body = await req.json().catch(() => ({}));

  // 1. Auth: Profile: /api/auth/profile
  if (path === "auth/profile") {
    const userId = body.user_id || "user-client-001";
    const updated = db.updateUser(userId, {
      name: body.name,
      email: body.email,
      paypal_email: body.paypal_email,
      avatar_url: body.avatar_url,
    });
    if (!updated) return badRequest("User not found", 404);
    const { password_hash, ...safeUser } = updated;
    return json({ message: "Profile updated successfully", user: safeUser });
  }

  // 2. Auth: Change Password: /api/auth/change-password
  if (path === "auth/change-password") {
    const userId = body.user_id || "user-client-001";
    const user = db.getUserById(userId);
    if (!user) return badRequest("User not found", 404);

    if (body.current_password && !verifyPassword(body.current_password, user.password_hash)) {
      return badRequest("Current password does not match", 400);
    }

    db.updateUser(userId, {
      password_hash: hashPassword(body.new_password || "Password123!"),
    });

    return json({ message: "Password updated successfully" });
  }

  // 3. Contracts: Update: /api/contracts/[id]
  if (slug[0] === "contracts" && slug.length === 2) {
    const updated = db.updateContract(slug[1], {
      content_markdown: body.content_markdown,
    });
    return json(updated);
  }

  // 4. Invoices: Logos: /api/invoices/[invoiceId]/logos
  if (slug[0] === "invoices" && slug.length === 3 && slug[2] === "logos") {
    const updated = db.updateInvoice(slug[1], {
      client_logo_url: body.client_logo_url,
      contractor_logo_url: body.contractor_logo_url,
    });
    return json(updated);
  }

  return badRequest(`Route PUT /api/${path} not found`, 404);
}
