// TrustBridge AI - Typed Frontend API Client

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  paypal_email?: string;
  avatar_url?: string;
  auth_provider?: string;
  is_verified?: boolean;
  verification_status?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  id_document_type?: string;
  id_document_number?: string;
  id_document_country?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  id_selfie_url?: string;
  verified_at?: string;
  created_at: string;
}

export interface IdentityVerificationPayload {
  id_document_type: string;
  id_document_number: string;
  id_document_country?: string;
  id_card_front_url: string;
  id_card_back_url?: string;
  id_selfie_url: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  email?: string;
  paypal_email?: string;
  avatar_url?: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface AcceptanceCriterion {
  id: string;
  milestone_id: string;
  title: string;
  description: string;
  verification_type: "BROWSER_INTERACTION" | "HTTP_STATUS" | "RESPONSIVE_VIEWPORT" | "CODE_INSPECTION" | "MANUAL";
  test_config_json?: any;
  status: "PENDING" | "PASSED" | "FAILED" | "NEEDS_REVIEW";
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  order_index: number;
  due_date: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "VERIFYING" | "VERIFIED" | "APPROVED" | "PAID" | "DISPUTED";
  created_at: string;
  criteria: AcceptanceCriterion[];
}

export interface ContractAIEditResult {
  revised_markdown: string;
  extracted_budget: number;
  extracted_advance: number;
  extracted_held_balance: number;
  summary_of_changes: string;
}

export interface ContractComment {
  id: string;
  contract_id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_role: "client" | "freelancer" | "admin";
  message: string;
  comment_type: "COMMENT" | "REVISION_REQUEST" | "HOLD_NOTICE" | "CHANGE_APPROVAL";
  created_at: string;
}

export interface Contract {
  id: string;
  project_id: string;
  version: number;
  content_markdown: string;
  content_json?: any;
  status: "DRAFT" | "PENDING_APPROVAL" | "ON_HOLD" | "REVISION_REQUESTED" | "ACCEPTED" | "SUPERSEDED";
  hold_reason?: string;
  is_on_hold?: boolean;
  client_signed_at?: string;
  freelancer_signed_at?: string;
  created_at: string;
  comments?: ContractComment[];
}

export interface Invoice {
  id: string;
  project_id: string;
  milestone_id?: string;
  invoice_number: string;
  invoice_type: "ADVANCE" | "MILESTONE" | "FINAL";
  title: string;
  description?: string;
  amount: number;
  currency: string;
  order_index: number;
  due_date?: string;
  status: "PENDING_DEPOSIT" | "HELD_IN_ESCROW" | "RELEASED" | "REFUNDED" | "FROZEN_IN_DISPUTE";
  paypal_order_id?: string;
  paypal_capture_id?: string;
  deposit_paid_at?: string;
  released_at?: string;
  client_logo_url?: string;
  contractor_logo_url?: string;
  platform_logo_url: string;
  line_items_json?: { description: string; type: string; amount: number }[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeAIDossier {
  dispute_id: string;
  project_id: string;
  project_title: string;
  milestone_id: string;
  milestone_title: string;
  disputed_amount: number;
  client_name: string;
  freelancer_name: string;
  initiated_by_name: string;
  reason: string;
  client_argument?: string;
  freelancer_argument?: string;
  contract_summary: string;
  signed_criteria: string[];
  conversation_summary: string;
  verification_evidence_summary: string;
  ai_severity: string;
  ai_neutral_verdict: string;
  ai_recommendation: string;
  frozen_escrow_amount: number;
  is_escalated: boolean;
}

export interface Project {
  id: string;
  client_id: string;
  freelancer_id?: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  advance_amount: number;
  advance_status: "PENDING" | "PAID" | "REFUNDED";
  advance_paypal_order_id?: string;
  advance_paypal_capture_id?: string;
  held_balance: number;
  held_balance_status: "UNFUNDED" | "SECURED" | "PARTIALLY_RELEASED" | "RELEASED";
  invitation_token?: string;
  currency: string;
  status: "DRAFT" | "CONTRACT_PENDING" | "AGREEMENT_ON_HOLD" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED";
  created_at: string;
  updated_at: string;
  client?: User;
  freelancer?: User;
  contracts: Contract[];
  milestones: Milestone[];
  invitations?: Invitation[];
  invoices?: Invoice[];
  comments?: ContractComment[];
}

export interface Invitation {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_email?: string;
  role: "client" | "freelancer";
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_projects: number;
  total_payments_volume: number;
  total_escrow_secured: number;
  open_disputes: number;
  ai_verifications_count: number;
  reconciliation_status: string;
  custody_disclaimer: string;
}

export interface VerificationResult {
  id: string;
  criterion_id: string;
  outcome: "PASS" | "FAIL" | "REVIEW";
  details?: string;
  execution_time_ms: number;
  evidence_id?: string;
  evidence?: {
    file_name: string;
    file_path: string;
    sha256_hash: string;
    captured_at: string;
  };
}

export interface VerificationRun {
  id: string;
  submission_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  summary?: string;
  passed_count: number;
  failed_count: number;
  review_count: number;
  ai_analysis?: string;
  results: VerificationResult[];
}

export interface AuditEvent {
  id: string;
  project_id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role: string;
  action: string;
  details_json?: any;
  prev_hash?: string;
  current_hash: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  milestone_id: string;
  payer_id: string;
  amount: number;
  currency: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  message: string;
  comment_type: string;
  created_at: string;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("trustbridge_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("trustbridge_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  // Users & Roles
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
    return res.json();
  },

  // Projects
  async getProjects(role?: string, userId?: string): Promise<Project[]> {
    try {
      const query = new URLSearchParams();
      if (role) query.append("role", role);
      if (userId) query.append("user_id", userId);
      const res = await fetch(`${API_BASE}/projects?${query.toString()}`, { headers: getHeaders() });
      if (!res.ok) {
        console.warn("getProjects returned non-200 status:", res.status);
        return [];
      }
      return await res.json();
    } catch (err) {
      console.warn("getProjects network error:", err);
      return [];
    }
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, { headers: getHeaders() });
      if (!res.ok) {
        console.warn("getProject returned non-200 status:", res.status);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.warn("getProject network error:", err);
      return null;
    }
  },

  async createProject(data: {
    client_id: string;
    freelancer_id?: string;
    title: string;
    description: string;
    budget: number;
    category?: string;
    advance_percent?: number;
    advance_amount?: number;
    held_balance?: number;
    currency?: string;
  }): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  },

  // Contracts
  async generateContract(projectId: string, data: {
    project_title: string;
    brief: string;
    budget: number;
    currency?: string;
    target_timeline_days?: number;
    advance_percent?: number;
    advance_amount?: number;
    held_balance?: number;
  }): Promise<Contract> {
    const res = await fetch(`${API_BASE}/contracts/generate/${projectId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to generate contract");
    return res.json();
  },

  async acceptContract(contractId: string, userId: string, role: string): Promise<Contract> {
    const res = await fetch(`${API_BASE}/contracts/${contractId}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, role })
    });
    if (!res.ok) throw new Error("Failed to sign contract");
    return res.json();
  },

  // Milestones & Submissions
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const res = await fetch(`${API_BASE}/milestones/project/${projectId}`);
    return res.json();
  },

  async submitMilestone(milestoneId: string, data: { freelancer_id?: string; deployment_url: string; repository_url?: string; notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/milestones/${milestoneId}/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ milestone_id: milestoneId, ...data })
    });
    if (!res.ok) throw new Error("Failed to submit work");
    return res.json();
  },

  async approveMilestone(milestoneId: string, clientId: string): Promise<Milestone> {
    const res = await fetch(`${API_BASE}/milestones/${milestoneId}/approve?client_id=${clientId}`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to approve milestone");
    return res.json();
  },

  // Proof of Work Engine
  async startVerification(milestoneId: string): Promise<VerificationRun> {
    const res = await fetch(`${API_BASE}/verifications/start?milestone_id=${milestoneId}`, {
      method: "POST"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to run proof of work verification");
    }
    return res.json();
  },

  async getVerificationRun(runId: string): Promise<VerificationRun> {
    const res = await fetch(`${API_BASE}/verifications/${runId}`);
    return res.json();
  },

  getEvidenceImageUrl(fileName: string): string {
    return `/evidence/${fileName}`;
  },

  // PayPal Payments
  async createPayPalOrder(milestoneId: string, payerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ milestone_id: milestoneId, payer_id: payerId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "PayPal order creation failed");
    }
    return res.json();
  },

  async capturePayPalOrder(paypalOrderId: string, milestoneId: string): Promise<Payment> {
    const res = await fetch(`${API_BASE}/payments/capture-order`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ paypal_order_id: paypalOrderId, milestone_id: milestoneId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "PayPal order capture failed");
    }
    return res.json();
  },

  // Disputes
  async createDispute(data: { milestone_id: string; initiated_by_id: string; reason: string; client_argument?: string; freelancer_argument?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/disputes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getDispute(milestoneId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/disputes/milestone/${milestoneId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Timeline & Cryptographic Ledger
  async getTimeline(projectId: string): Promise<AuditEvent[]> {
    const res = await fetch(`${API_BASE}/timeline/project/${projectId}`);
    return res.json();
  },

  async verifyLedger(projectId: string): Promise<{ valid: boolean; count: number; latest_hash?: string; message: string }> {
    const res = await fetch(`${API_BASE}/timeline/project/${projectId}/verify-ledger`);
    return res.json();
  },

  // Demo Target API
  async getDemoStoreStatus(): Promise<{ checkout_bug_active: boolean; store_name: string; status: string }> {
    const res = await fetch(`${API_BASE}/demo-store/status`);
    return res.json();
  },

  async toggleDemoStoreBug(bugActive: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/demo-store/toggle-bug`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ bug_active: bugActive })
    });
    return res.json();
  },

  // Invitations API (Email + Link)
  async createInvitation(data: { project_id: string; inviter_id: string; role: string; invitee_email?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/invitations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create invitation");
    return res.json();
  },

  async getInvitation(token: string): Promise<any> {
    const res = await fetch(`${API_BASE}/invitations/${token}`);
    if (!res.ok) throw new Error("Invitation not found or expired");
    return res.json();
  },

  async acceptInvitation(token: string, data: { user_id?: string; email?: string; name?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to accept invitation");
    }
    return res.json();
  },

  // Advance Payments & Held Balance Releases
  async createAdvanceOrder(projectId: string, payerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/advance/create-order`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, payer_id: payerId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to initiate advance payment");
    }
    return res.json();
  },

  async captureAdvanceOrder(projectId: string, paypalOrderId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/advance/capture-order`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, paypal_order_id: paypalOrderId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to capture advance payment");
    }
    return res.json();
  },

  async releaseMilestoneFunds(milestoneId: string, clientId: string, note?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/milestones/release`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ milestone_id: milestoneId, client_id: clientId, release_note: note })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to release milestone funds");
    }
    return res.json();
  },

  async explainPayments(projectId: string, question?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/explain`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, question })
    });
    return res.json();
  },

  // Deal Guardian & Scope Change AI
  async analyzeDealGuardian(data: { project_title: string; brief: string; budget: number; milestones?: any[] }): Promise<any> {
    const res = await fetch(`${API_BASE}/contracts/deal-guardian/analyze`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async analyzeScopeChange(projectId: string, message: string): Promise<any> {
    const res = await fetch(`${API_BASE}/contracts/scope-change/analyze`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId, message_or_request: message })
    });
    return res.json();
  },

  // Contract Comments, AI Revisions & Financial Sync
  async aiEditContract(contractId: string, instruction: string, userId?: string, role?: string): Promise<ContractAIEditResult> {
    const res = await fetch(`${API_BASE}/contracts/${contractId}/ai-edit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ instruction, user_id: userId, role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to revise agreement with AI");
    }
    return res.json();
  },

  async updateContract(contractId: string, data: { content_markdown: string }, userId?: string, role?: string): Promise<Contract> {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (role) params.append("role", role);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/contracts/${contractId}${qs}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update agreement");
    return res.json();
  },

  async addContractComment(contractId: string, data: { message: string; comment_type?: string }, userId?: string, role?: string): Promise<ContractComment> {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (role) params.append("role", role);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/contracts/${contractId}/comments${qs}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to post comment");
    return res.json();
  },

  async getContractComments(contractId: string): Promise<ContractComment[]> {
    const res = await fetch(`${API_BASE}/contracts/${contractId}/comments`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async holdContract(contractId: string, data: { reason: string }, userId?: string, role?: string): Promise<Contract> {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (role) params.append("role", role);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/contracts/${contractId}/hold${qs}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to place agreement on hold");
    return res.json();
  },

  async resumeContract(contractId: string, userId?: string, role?: string): Promise<Contract> {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (role) params.append("role", role);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/contracts/${contractId}/resume${qs}`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to resume agreement review");
    return res.json();
  },

  // Sequential Invoices & Dual-Logo Escrow
  async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    const res = await fetch(`${API_BASE}/invoices/projects/${projectId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async forceGenerateInvoices(projectId: string): Promise<Invoice[]> {
    const res = await fetch(`${API_BASE}/invoices/projects/${projectId}/generate`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to generate invoices");
    return res.json();
  },

  async depositInvoice(invoiceId: string, payerId: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/deposit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ payer_id: payerId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to deposit invoice to escrow");
    }
    return res.json();
  },

  async releaseInvoice(invoiceId: string, clientId: string, note?: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/release`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ client_id: clientId, note: note || "Released by client" })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to release invoice funds");
    }
    return res.json();
  },

  async updateInvoiceLogos(invoiceId: string, data: { client_logo_url?: string; contractor_logo_url?: string }): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/logos`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update invoice logos");
    return res.json();
  },

  async getDisputeDossier(disputeId: string): Promise<DisputeAIDossier> {
    const res = await fetch(`${API_BASE}/disputes/${disputeId}/dossier`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch dispute AI dossier");
    return res.json();
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error("Failed to load admin stats");
    return res.json();
  },

  async getAdminDisputes(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/disputes`);
    return res.json();
  },

  async resolveDispute(disputeId: string, decision: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, notes: notes || "Resolved by Administrator" })
    });
    if (!res.ok) throw new Error("Failed to resolve dispute");
    return res.json();
  },

  async getAdminAIHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/ai-health`);
    return res.json();
  },

  async getAdminAuditStream(limit: number = 30): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-stream?limit=${limit}`);
    return res.json();
  },

  // Project Chat APIs
  async getChatMessages(projectId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/chat/${projectId}/messages`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to load chat messages");
    return res.json();
  },

  async sendChatMessage(projectId: string, data: { message: string; author_name?: string; author_role?: string; comment_type?: string }): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/chat/${projectId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to send chat message");
    return res.json();
  },

  // Identity Verification & Profile APIs
  async verifyIdentity(data: IdentityVerificationPayload, userId?: string): Promise<User> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${API_BASE}/auth/verify-identity${query}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Identity verification submission failed");
    }
    return res.json();
  },

  async updateProfile(data: ProfileUpdatePayload, userId?: string): Promise<{ message: string; user: User; access_token?: string }> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${API_BASE}/auth/profile${query}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update profile");
    }
    return res.json();
  },

  async changePassword(data: PasswordChangePayload, userId?: string): Promise<{ message: string }> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${API_BASE}/auth/change-password${query}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to change password");
    }
    return res.json();
  },

  async resetVerification(userId?: string): Promise<User> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${API_BASE}/auth/reset-verification${query}`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to reset verification");
    }
    return res.json();
  }
};

