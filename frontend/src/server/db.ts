// Veylora Bridge AI - Self-Contained Next.js In-Memory & Persistent Serverless DB
import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  password_hash: string;
  auth_provider: string;
  paypal_email: string;
  avatar_url: string;
  is_verified: boolean;
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  id_document_type?: string;
  id_document_number?: string;
  id_document_country?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  id_selfie_url?: string;
  verified_at?: string;
  created_at: string;
}

export interface AcceptanceCriterionEntity {
  id: string;
  milestone_id: string;
  title: string;
  description: string;
  verification_type: "BROWSER_INTERACTION" | "HTTP_STATUS" | "RESPONSIVE_VIEWPORT" | "CODE_INSPECTION" | "MANUAL";
  test_config_json?: any;
  status: "PENDING" | "PASSED" | "FAILED" | "NEEDS_REVIEW";
}

export interface MilestoneEntity {
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
  criteria: AcceptanceCriterionEntity[];
}

export interface ContractEntity {
  id: string;
  project_id: string;
  version: number;
  title?: string;
  content_markdown: string;
  content_json?: any;
  status: "DRAFT" | "PENDING_APPROVAL" | "ON_HOLD" | "REVISION_REQUESTED" | "ACCEPTED" | "SUPERSEDED";
  hold_reason?: string;
  is_on_hold?: boolean;
  client_signed_at?: string;
  freelancer_signed_at?: string;
  created_at: string;
}

export interface ProjectEntity {
  id: string;
  client_id: string;
  freelancer_id?: string | null;
  title: string;
  description: string;
  category: string;
  budget: number;
  advance_amount: number;
  held_balance: number;
  advance_status: "PENDING" | "PAID";
  advance_paypal_order_id?: string;
  advance_paypal_capture_id?: string;
  held_balance_status: "UNFUNDED" | "SECURED" | "PARTIALLY_RELEASED" | "RELEASED" | "DISPUTED";
  invitation_token?: string;
  currency: string;
  status: "DRAFT" | "CONTRACT_PENDING" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED";
  created_at: string;
  milestones: MilestoneEntity[];
  contracts: ContractEntity[];
}

export interface ContractCommentEntity {
  id: string;
  contract_id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_role: "client" | "freelancer" | "admin" | "ai";
  message: string;
  comment_type: "COMMENT" | "REVISION_REQUEST" | "HOLD_NOTICE" | "CHANGE_APPROVAL" | "RESUME_NOTICE";
  created_at: string;
}

export interface SubmissionEntity {
  id: string;
  milestone_id: string;
  freelancer_id: string;
  repository_url: string;
  deployment_url: string;
  commit_hash: string;
  notes: string;
  created_at: string;
}

export interface VerificationRunEntity {
  id: string;
  milestone_id: string;
  status: "RUNNING" | "PASSED" | "FAILED" | "INCONCLUSIVE";
  summary: string;
  passed_count: number;
  failed_count: number;
  ai_analysis?: string;
  created_at: string;
  results: {
    id: string;
    criterion_id: string;
    outcome: "PASS" | "FAIL" | "WARN";
    details: string;
    execution_time_ms: number;
    evidence?: {
      sha256_hash: string;
      artifact_type: string;
      payload_json: any;
    };
  }[];
}

export interface PaymentEntity {
  id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  payer_id: string;
  payment_type: "ADVANCE" | "MILESTONE_ESCROW" | "REFUND";
  amount: number;
  currency: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  paypal_payout_id?: string;
  status: "PENDING" | "CAPTURED" | "DISBURSED" | "REFUNDED";
  created_at: string;
}

export interface AuditEventEntity {
  id: string;
  project_id: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  details?: any;
  block_hash: string;
  prev_hash: string;
  created_at: string;
}

export interface InvitationEntity {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_email?: string;
  role: "client" | "freelancer";
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  delivery_status?: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface DisputeEntity {
  id: string;
  milestone_id: string;
  initiated_by_id: string;
  status: "OPEN" | "AI_REVIEW" | "ESCALATED" | "RESOLVED";
  reason: string;
  client_argument?: string;
  freelancer_argument?: string;
  ai_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ai_recommendation?: string;
  created_at: string;
  resolved_at?: string;
}

export interface InvoiceEntity {
  id: string;
  project_id: string;
  milestone_id?: string | null;
  invoice_number: string;
  order_index: number;
  amount: number;
  currency: string;
  title: string;
  status: "DRAFT" | "PENDING_DEPOSIT" | "HELD_IN_ESCROW" | "RELEASED" | "DISPUTED";
  due_date: string;
  created_at: string;
  paid_at?: string | null;
  client_logo_url?: string;
  contractor_logo_url?: string;
}

export interface ChatMessageEntity {
  id: string;
  project_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  message: string;
  comment_type?: string;
  created_at: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: string;
  timestamp?: string;
}

export interface DbState {
  users: UserEntity[];
  projects: ProjectEntity[];
  contractComments: ContractCommentEntity[];
  submissions: SubmissionEntity[];
  verificationRuns: VerificationRunEntity[];
  payments: PaymentEntity[];
  auditEvents: AuditEventEntity[];
  invitations: InvitationEntity[];
  disputes: DisputeEntity[];
  invoices: InvoiceEntity[];
  chatMessages: ChatMessageEntity[];
  demoBugActive: boolean;
}

// Password hashing utility using built-in Node crypto (compatible everywhere)
export function hashPassword(plain: string): string {
  const salt = "trustbridge_salt_2026";
  return crypto.pbkdf2Sync(plain, salt, 1000, 32, "sha256").toString("hex");
}

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

// Initial Seed Data Factory
function createInitialSeed(): DbState {
  const defaultPwd = hashPassword("Password123!");
  const adminPwd = hashPassword("AdminSecret2026!");

  const users: UserEntity[] = [
    {
      id: "user-client-001",
      name: "Alex Rivera",
      email: "alex@acmestudio.io",
      role: "client",
      password_hash: defaultPwd,
      auth_provider: "email",
      paypal_email: "alex@acmestudio.io",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      is_verified: true,
      verification_status: "VERIFIED",
      id_document_type: "PASSPORT",
      id_document_number: "US-8829104",
      id_document_country: "United States",
      verified_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "user-freelancer-001",
      name: "Elena Rostova",
      email: "elena@devcraft.io",
      role: "freelancer",
      password_hash: defaultPwd,
      auth_provider: "email",
      paypal_email: "elena@devcraft.io",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      is_verified: true,
      verification_status: "VERIFIED",
      id_document_type: "NATIONAL_ID",
      id_document_number: "EU-449102",
      id_document_country: "Estonia",
      verified_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "user-admin-001",
      name: "Compliance Administrator",
      email: "admin@payflow.io",
      role: "admin",
      password_hash: adminPwd,
      auth_provider: "email",
      paypal_email: "admin@payflow.io",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      is_verified: true,
      verification_status: "VERIFIED",
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const contract1: ContractEntity = {
    id: "contract-001",
    project_id: "proj-001",
    version: 1,
    content_markdown: `# MASTER SERVICES & MILESTONE ESCROW AGREEMENT
REF: VEY-AGR-PROJ001-V1

**Client:** Alex Rivera (Acme Studio Inc.)  
**Contractor:** Elena Rostova (DevCraft Engineering)  
**Total Value:** $1,200.00 USD  
**Platform Rails:** PayPal Orders v2 & Payouts v1  

### SECTION 1: RECITALS & SCOPE
WHEREAS, Client engages Contractor to deliver high-throughput microservices API gateway with JWT authorization and rate limiting.

### SECTION 2: COMPENSATION & MILESTONE SCHEDULE
- **Milestone 1:** Core Architecture & Responsive UI ($420.00 USD)
- **Milestone 2:** Functional Features & Interactive Flows ($540.00 USD)
- **Milestone 3:** Final Integration, QA & Production Deployment ($240.00 USD)

### SECTION 3: AUTOMATED ACCEPTANCE TESTING
Escrow funds shall be released upon automated test verification via the Playwright headless suite.`,
    status: "ACCEPTED",
    client_signed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    freelancer_signed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  };

  const project1: ProjectEntity = {
    id: "proj-001",
    client_id: "user-client-001",
    freelancer_id: "user-freelancer-001",
    title: "Cloud Native API Gateway",
    description: "High-throughput microservices API gateway with JWT authorization and rate limiting.",
    category: "Backend Engineering",
    budget: 1200.0,
    advance_amount: 300.0,
    held_balance: 660.0,
    advance_status: "PAID",
    advance_paypal_order_id: "PAYID-SANDBOX-ADV-881203",
    advance_paypal_capture_id: "CAPTURE-SANDBOX-ADV-441920",
    held_balance_status: "SECURED",
    invitation_token: "invite-demo-token-99",
    currency: "USD",
    status: "IN_PROGRESS",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    milestones: [
      {
        id: "m-001",
        project_id: "proj-001",
        title: "Milestone 1: Core Architecture & Responsive UI",
        description: "Initial setup, core layouts, mobile responsiveness, and deployment to staging.",
        amount: 420.0,
        currency: "USD",
        order_index: 0,
        due_date: "T+4 days",
        status: "PAID",
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-001",
            milestone_id: "m-001",
            title: "Deployment URL returns HTTP 200 OK",
            description: "Deployment URL returns HTTP 200 OK and renders within 3 seconds.",
            verification_type: "HTTP_STATUS",
            test_config_json: { expected_status: 200 },
            status: "PASSED",
          },
          {
            id: "crit-002",
            milestone_id: "m-001",
            title: "Mobile Responsive Viewport Validation",
            description: "Page renders with no horizontal overflow on mobile viewport (375x667).",
            verification_type: "RESPONSIVE_VIEWPORT",
            test_config_json: { viewport: { width: 375, height: 667 } },
            status: "PASSED",
          },
        ],
      },
      {
        id: "m-002",
        project_id: "proj-001",
        title: "Milestone 2: Functional Features & Interactive Flows",
        description: "Interactive UI components, product cart management, and checkout workflow.",
        amount: 540.0,
        currency: "USD",
        order_index: 1,
        due_date: "T+8 days",
        status: "PAID",
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-003",
            milestone_id: "m-002",
            title: "Cart Selection & DOM Increment",
            description: "User can select an item and add to cart; cart count updates immediately in DOM.",
            verification_type: "BROWSER_INTERACTION",
            test_config_json: { selector: "button.add-to-cart", action: "click" },
            status: "PASSED",
          },
          {
            id: "crit-004",
            milestone_id: "m-002",
            title: "Checkout Input Validation",
            description: "Checkout form validates required inputs and initiates order processing without JavaScript exceptions.",
            verification_type: "BROWSER_INTERACTION",
            test_config_json: { selector: "button.checkout-btn", action: "click" },
            status: "PASSED",
          },
        ],
      },
      {
        id: "m-003",
        project_id: "proj-001",
        title: "Milestone 3: Final Integration, QA & Production Deployment",
        description: "Production readiness, SSL configuration, documentation, and clean handoff.",
        amount: 240.0,
        currency: "USD",
        order_index: 2,
        due_date: "T+21 days",
        status: "PENDING",
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-005",
            milestone_id: "m-003",
            title: "Production SSL Endpoint Live",
            description: "Production endpoint is accessible via HTTPS with valid security certificates.",
            verification_type: "HTTP_STATUS",
            test_config_json: { expected_status: 200 },
            status: "PENDING",
          },
          {
            id: "crit-006",
            milestone_id: "m-003",
            title: "Code Inspection & Security Audit",
            description: "GitHub repository contains README with setup instructions and zero critical security advisories.",
            verification_type: "CODE_INSPECTION",
            test_config_json: { path: "README.md" },
            status: "PENDING",
          },
        ],
      },
    ],
    contracts: [contract1],
  };

  const project2: ProjectEntity = {
    id: "proj-002",
    client_id: "user-client-001",
    freelancer_id: "user-freelancer-001",
    title: "Modern E-Commerce Storefront",
    description: "Phase 1 - Basic Features (Demo Deadline: 7 Days): Modern responsive website design, product categories, shopping cart, and basic admin dashboard.\nPhase 2 - Advanced Features (After 2 Months): Online payment gateway, order tracking, and inventory management.",
    category: "Web Development",
    budget: 1000.0,
    advance_amount: 300.0,
    held_balance: 700.0,
    advance_status: "PAID",
    advance_paypal_order_id: "PAYID-SANDBOX-ECOM-001",
    advance_paypal_capture_id: "CAPTURE-SANDBOX-ECOM-001",
    held_balance_status: "SECURED",
    invitation_token: "invite-ecom-token-88",
    currency: "USD",
    status: "IN_PROGRESS",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    milestones: [
      {
        id: "m-ecom-1",
        project_id: "proj-002",
        title: "Phase 1: Basic Responsive Storefront & Cart",
        description: "Homepage, product pages, registration, and shopping cart workflow.",
        amount: 400.0,
        currency: "USD",
        order_index: 0,
        due_date: "T+7 days",
        status: "PAID",
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-ecom-1",
            milestone_id: "m-ecom-1",
            title: "Storefront UI & Cart Functional",
            description: "Catalog renders and items can be added to cart with persistent local storage.",
            verification_type: "BROWSER_INTERACTION",
            status: "PASSED",
          },
        ],
      },
      {
        id: "m-ecom-2",
        project_id: "proj-002",
        title: "Phase 2: Payment Gateway & Order Tracking",
        description: "PayPal integration, order receipts, and tracking dashboard.",
        amount: 350.0,
        currency: "USD",
        order_index: 1,
        due_date: "T+30 days",
        status: "IN_PROGRESS",
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-ecom-2",
            milestone_id: "m-ecom-2",
            title: "PayPal Checkout Flow",
            description: "Checkout button initiates PayPal sandbox transaction.",
            verification_type: "BROWSER_INTERACTION",
            status: "PENDING",
          },
        ],
      },
      {
        id: "m-ecom-3",
        project_id: "proj-002",
        title: "Phase 3: Final Delivery & Security Optimization",
        description: "Performance audit, bug fixing, and final client sign-off.",
        amount: 250.0,
        currency: "USD",
        order_index: 2,
        due_date: "T+60 days",
        status: "PENDING",
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        criteria: [
          {
            id: "crit-ecom-3",
            milestone_id: "m-ecom-3",
            title: "Performance & Security Sign-off",
            description: "Zero high vulnerabilities and Lighthouse performance score > 90.",
            verification_type: "CODE_INSPECTION",
            status: "PENDING",
          },
        ],
      },
    ],
    contracts: [],
  };

  const invoices: InvoiceEntity[] = [
    {
      id: "inv-001",
      project_id: "proj-001",
      milestone_id: null,
      invoice_number: "INV-VEY-2026-001",
      order_index: 0,
      amount: 300.0,
      currency: "USD",
      title: "Upfront Kickoff Advance Deposit",
      status: "RELEASED",
      due_date: "Immediate",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      paid_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "inv-002",
      project_id: "proj-001",
      milestone_id: "m-001",
      invoice_number: "INV-VEY-2026-002",
      order_index: 1,
      amount: 420.0,
      currency: "USD",
      title: "Milestone 1: Core Architecture & Responsive UI",
      status: "RELEASED",
      due_date: "T+4 days",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      paid_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "inv-003",
      project_id: "proj-001",
      milestone_id: "m-002",
      invoice_number: "INV-VEY-2026-003",
      order_index: 2,
      amount: 540.0,
      currency: "USD",
      title: "Milestone 2: Functional Features & Interactive Flows",
      status: "RELEASED",
      due_date: "T+8 days",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      paid_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "inv-004",
      project_id: "proj-001",
      milestone_id: "m-003",
      invoice_number: "INV-VEY-2026-004",
      order_index: 3,
      amount: 240.0,
      currency: "USD",
      title: "Milestone 3: Final Integration, QA & Production Deployment",
      status: "HELD_IN_ESCROW",
      due_date: "T+21 days",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const chatMessages: ChatMessageEntity[] = [
    {
      id: "chat-001",
      project_id: "proj-001",
      author_id: "user-client-001",
      author_name: "Alex Rivera",
      author_role: "client",
      message: "Hi Elena! Excited to kick off the Cloud Native API Gateway project. I have funded the $300 kickoff advance via PayPal.",
      comment_type: "COMMENT",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "chat-002",
      project_id: "proj-001",
      author_id: "user-freelancer-001",
      author_name: "Elena Rostova",
      author_role: "freelancer",
      message: "Thank you Alex! Received the kickoff deposit. Starting Stage 1 architecture setup and CI pipeline now.",
      comment_type: "COMMENT",
      created_at: new Date(Date.now() - 4 * 86400000 + 3600000).toISOString(),
    },
    {
      id: "chat-003",
      project_id: "proj-001",
      author_id: "system-ai-arbiter",
      author_name: "Veylora Escrow Arbiter AI",
      author_role: "ai_assistant",
      message: "I am monitoring this project's escrow milestones. Escrow balance is secured under PayPal Orders v2. Current held balance is $660.00 USD.",
      comment_type: "AI_ASSIST",
      created_at: new Date(Date.now() - 4 * 86400000 + 7200000).toISOString(),
    },
  ];

  const auditEvents: AuditEventEntity[] = [
    {
      id: "audit-001",
      project_id: "proj-001",
      action: "PROJECT_CREATED",
      actor_id: "user-client-001",
      actor_name: "Alex Rivera",
      actor_role: "client",
      details: { title: "Cloud Native API Gateway", budget: 1200 },
      prev_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      block_hash: "7f8a9e2d1c3b4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "audit-002",
      project_id: "proj-001",
      action: "KICKOFF_ADVANCE_CAPTURED",
      actor_id: "user-client-001",
      actor_name: "Alex Rivera",
      actor_role: "client",
      details: { amount: 300, paypal_capture_id: "CAPTURE-SANDBOX-ADV-441920" },
      prev_hash: "7f8a9e2d1c3b4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
      block_hash: "8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  return {
    users,
    projects: [project1, project2],
    contractComments: [],
    submissions: [],
    verificationRuns: [],
    payments: [],
    auditEvents,
    invitations: [
      {
        id: "inv-seed-demo-1",
        token: "invite-demo-token-99",
        project_id: "proj-001",
        inviter_id: "user-contractor-1",
        invitee_email: "alex@acmestudio.io",
        role: "client",
        status: "PENDING",
        delivery_status: "READY_TO_SHARE",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
      {
        id: "inv-seed-demo-2",
        token: "invite-ecom-token-88",
        project_id: "proj-002",
        inviter_id: "user-contractor-1",
        invitee_email: "sarah@fashionhub.com",
        role: "client",
        status: "PENDING",
        delivery_status: "READY_TO_SHARE",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    ],
    disputes: [],
    invoices,
    chatMessages,
    demoBugActive: false,
  };
}

// Global persistence store (persists in memory + os.tmpdir())
const DB_FILE_PATH = path.join(
  os.tmpdir(),
  "trustbridge_store.json"
);

function loadDb(): DbState {
  const globalRef = globalThis as any;
  if (globalRef.__trustbridge_db) {
    return globalRef.__trustbridge_db;
  }

  // Try reading from file
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      globalRef.__trustbridge_db = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn("Could not read disk DB cache, using seed data:", e);
  }

  const initial = createInitialSeed();
  globalRef.__trustbridge_db = initial;
  saveDb(initial);
  return initial;
}

function saveDb(state: DbState) {
  const globalRef = globalThis as any;
  globalRef.__trustbridge_db = state;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    // If running in strict read-only environment, keep in memory
  }
}

// Repository Operations
export const db = {
  // Users
  getUsers(): UserEntity[] {
    return loadDb().users;
  },

  getUserById(id: string): UserEntity | undefined {
    return loadDb().users.find((u) => u.id === id);
  },

  getUserByEmail(email: string): UserEntity | undefined {
    return loadDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(user: UserEntity): UserEntity {
    const state = loadDb();
    state.users.push(user);
    saveDb(state);
    return user;
  },

  updateUser(id: string, updates: Partial<UserEntity>): UserEntity | undefined {
    const state = loadDb();
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    state.users[idx] = { ...state.users[idx], ...updates };
    saveDb(state);
    return state.users[idx];
  },

  // Projects
  getProjects(role?: string, userId?: string): ProjectEntity[] {
    const all = loadDb().projects;
    if (!role || role === "admin") return all;
    if (role === "client" && userId) {
      return all.filter((p) => p.client_id === userId);
    }
    if (role === "freelancer" && userId) {
      return all.filter((p) => p.freelancer_id === userId || !p.freelancer_id);
    }
    return all;
  },

  getProjectById(id: string): ProjectEntity | undefined {
    return loadDb().projects.find((p) => p.id === id);
  },

  createProject(project: ProjectEntity): ProjectEntity {
    const state = loadDb();
    state.projects.unshift(project);
    saveDb(state);
    return project;
  },

  updateProject(id: string, updates: Partial<ProjectEntity>): ProjectEntity | undefined {
    const state = loadDb();
    const idx = state.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    state.projects[idx] = { ...state.projects[idx], ...updates };
    saveDb(state);
    return state.projects[idx];
  },

  // Contracts
  getContractById(id: string): ContractEntity | undefined {
    if (!id) return undefined;
    const state = loadDb();
    // 1. Exact contract id match
    for (const p of state.projects) {
      const c = p.contracts?.find((item) => item.id === id);
      if (c) return c;
    }
    // 2. Direct project id match
    const directProj = state.projects.find((p) => p.id === id);
    if (directProj?.contracts && directProj.contracts.length > 0) {
      return directProj.contracts[directProj.contracts.length - 1];
    }
    // 3. Substring / normalized match (e.g. "contract-proj-..." vs "proj-...")
    for (const p of state.projects) {
      if (id.includes(p.id) || p.id.includes(id)) {
        if (p.contracts && p.contracts.length > 0) {
          return p.contracts[p.contracts.length - 1];
        }
      }
      const c = p.contracts?.find((item) => item.id.includes(id) || id.includes(item.id));
      if (c) return c;
    }
    return undefined;
  },

  createContract(contract: ContractEntity): ContractEntity {
    const state = loadDb();
    let project = state.projects.find((p) => p.id === contract.project_id);
    if (!project) {
      project = {
        id: contract.project_id,
        client_id: "user-client-001",
        freelancer_id: "user-freelancer-001",
        title: "Freelance Milestone Project",
        description: "Milestone contract workspace",
        category: "Web Development",
        budget: 1000,
        advance_amount: 250,
        held_balance: 750,
        advance_status: "PENDING",
        held_balance_status: "UNFUNDED",
        invitation_token: `invite-${Date.now()}`,
        currency: "USD",
        status: "IN_PROGRESS",
        created_at: new Date().toISOString(),
        milestones: [],
        contracts: [],
      };
      state.projects.unshift(project);
    }
    if (!project.contracts) project.contracts = [];
    project.contracts.push(contract);
    saveDb(state);
    return contract;
  },

  updateContract(id: string, updates: Partial<ContractEntity>): ContractEntity | undefined {
    if (!id) return undefined;
    const state = loadDb();
    // 1. Exact contract id match
    for (const p of state.projects) {
      if (!p.contracts) continue;
      const idx = p.contracts.findIndex((item) => item.id === id);
      if (idx !== -1) {
        p.contracts[idx] = { ...p.contracts[idx], ...updates };
        saveDb(state);
        return p.contracts[idx];
      }
    }
    // 2. Direct project id match
    for (const p of state.projects) {
      if (p.id === id && p.contracts && p.contracts.length > 0) {
        const idx = p.contracts.length - 1;
        p.contracts[idx] = { ...p.contracts[idx], ...updates };
        saveDb(state);
        return p.contracts[idx];
      }
    }
    // 3. Substring match
    for (const p of state.projects) {
      if (p.id.includes(id) || id.includes(p.id)) {
        if (p.contracts && p.contracts.length > 0) {
          const idx = p.contracts.length - 1;
          p.contracts[idx] = { ...p.contracts[idx], ...updates };
          saveDb(state);
          return p.contracts[idx];
        }
      }
    }
    return undefined;
  },

  // Contract Comments
  getContractComments(contractId: string): ContractCommentEntity[] {
    return loadDb().contractComments.filter((c) => c.contract_id === contractId);
  },

  addContractComment(comment: ContractCommentEntity): ContractCommentEntity {
    const state = loadDb();
    state.contractComments.push(comment);
    saveDb(state);
    return comment;
  },

  // Milestones
  getMilestoneById(id: string): MilestoneEntity | undefined {
    const state = loadDb();
    for (const p of state.projects) {
      const m = p.milestones?.find((item) => item.id === id);
      if (m) return m;
    }
    return undefined;
  },

  updateMilestone(id: string, updates: Partial<MilestoneEntity>): MilestoneEntity | undefined {
    const state = loadDb();
    for (const p of state.projects) {
      if (!p.milestones) continue;
      const idx = p.milestones.findIndex((item) => item.id === id);
      if (idx !== -1) {
        p.milestones[idx] = { ...p.milestones[idx], ...updates };
        saveDb(state);
        return p.milestones[idx];
      }
    }
    return undefined;
  },

  // Submissions
  createSubmission(submission: SubmissionEntity): SubmissionEntity {
    const state = loadDb();
    state.submissions.push(submission);
    saveDb(state);
    return submission;
  },

  // Verifications
  createVerificationRun(run: VerificationRunEntity): VerificationRunEntity {
    const state = loadDb();
    state.verificationRuns.unshift(run);
    saveDb(state);
    return run;
  },

  getVerificationRunById(id: string): VerificationRunEntity | undefined {
    return loadDb().verificationRuns.find((v) => v.id === id);
  },

  // Payments
  createPayment(payment: PaymentEntity): PaymentEntity {
    const state = loadDb();
    state.payments.unshift(payment);
    saveDb(state);
    return payment;
  },

  getPayments(projectId?: string): PaymentEntity[] {
    const all = loadDb().payments;
    if (projectId) return all.filter((p) => p.project_id === projectId);
    return all;
  },

  // Disputes
  createDispute(dispute: DisputeEntity): DisputeEntity {
    const state = loadDb();
    state.disputes.unshift(dispute);
    saveDb(state);
    return dispute;
  },

  getDisputes(): DisputeEntity[] {
    return loadDb().disputes;
  },

  getDisputeByMilestoneId(milestoneId: string): DisputeEntity | undefined {
    return loadDb().disputes.find((d) => d.milestone_id === milestoneId);
  },

  updateDispute(id: string, updates: Partial<DisputeEntity>): DisputeEntity | undefined {
    const state = loadDb();
    const idx = state.disputes.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    state.disputes[idx] = { ...state.disputes[idx], ...updates };
    saveDb(state);
    return state.disputes[idx];
  },

  // Audit Events
  addAuditEvent(event: AuditEventEntity): AuditEventEntity {
    const state = loadDb();
    state.auditEvents.unshift(event);
    saveDb(state);
    return event;
  },

  getAuditEvents(projectId: string): AuditEventEntity[] {
    return loadDb().auditEvents.filter((a) => a.project_id === projectId);
  },

  // Invitations
  createInvitation(inv: InvitationEntity): InvitationEntity {
    const state = loadDb();
    state.invitations.push(inv);
    saveDb(state);
    return inv;
  },

  getInvitationByToken(token: string): InvitationEntity | undefined {
    return loadDb().invitations.find((i) => i.token === token);
  },

  updateInvitation(token: string, updates: Partial<InvitationEntity>): InvitationEntity | undefined {
    const state = loadDb();
    const idx = state.invitations.findIndex((i) => i.token === token);
    if (idx === -1) return undefined;
    state.invitations[idx] = { ...state.invitations[idx], ...updates };
    saveDb(state);
    return state.invitations[idx];
  },

  // Invoices
  getInvoices(projectId: string): InvoiceEntity[] {
    return loadDb().invoices.filter((i) => i.project_id === projectId);
  },

  deleteInvoicesForProject(projectId: string): void {
    const state = loadDb();
    state.invoices = state.invoices.filter((i) => i.project_id !== projectId);
    saveDb(state);
  },

  createInvoice(inv: InvoiceEntity): InvoiceEntity {
    const state = loadDb();
    state.invoices.push(inv);
    saveDb(state);
    return inv;
  },

  updateInvoice(id: string, updates: Partial<InvoiceEntity>): InvoiceEntity | undefined {
    const state = loadDb();
    const idx = state.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    state.invoices[idx] = { ...state.invoices[idx], ...updates };
    saveDb(state);
    return state.invoices[idx];
  },

  // Chat
  getChatMessages(projectId: string): ChatMessageEntity[] {
    return loadDb().chatMessages.filter((m) => m.project_id === projectId);
  },

  addChatMessage(msg: Partial<ChatMessageEntity> & { project_id: string; message: string }): ChatMessageEntity {
    const state = loadDb();
    const normalized: ChatMessageEntity = {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      project_id: msg.project_id,
      author_id: msg.author_id || msg.sender_id || "system",
      author_name: msg.author_name || msg.sender_name || "System",
      author_role: msg.author_role || msg.sender_role || "system",
      message: msg.message,
      comment_type: msg.comment_type || "chat",
      created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
      sender_id: msg.sender_id || msg.author_id || "system",
      sender_name: msg.sender_name || msg.author_name || "System",
      sender_role: msg.sender_role || msg.author_role || "system",
      timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
    };
    state.chatMessages.push(normalized);
    saveDb(state);
    return normalized;
  },

  // Demo store bug simulation
  getDemoBugActive(): boolean {
    return loadDb().demoBugActive;
  },

  setDemoBugActive(val: boolean) {
    const state = loadDb();
    state.demoBugActive = val;
    saveDb(state);
  },
};

