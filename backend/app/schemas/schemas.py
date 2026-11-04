from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    name: str
    role: str = "client"
    avatar_url: Optional[str] = None
    paypal_email: Optional[str] = None
    auth_provider: Optional[str] = "email"
    is_verified: Optional[bool] = False
    verification_status: Optional[str] = "UNVERIFIED"
    id_document_type: Optional[str] = None
    id_document_number: Optional[str] = None
    id_document_country: Optional[str] = None
    id_card_front_url: Optional[str] = None
    id_card_back_url: Optional[str] = None
    id_selfie_url: Optional[str] = None
    verified_at: Optional[datetime] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "client"  # client, freelancer
    paypal_email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    role: Optional[str] = "client"
    google_id: Optional[str] = None

class IdentityVerificationRequest(BaseModel):
    id_document_type: str = "NATIONAL_ID"  # PASSPORT, NATIONAL_ID, DRIVERS_LICENSE
    id_document_number: str
    id_document_country: str = "United States"
    id_card_front_url: str
    id_card_back_url: Optional[str] = None
    id_selfie_url: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    paypal_email: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# Acceptance Criterion Schemas
class AcceptanceCriterionBase(BaseModel):
    title: str
    description: str
    verification_type: str = "BROWSER_INTERACTION"  # BROWSER_INTERACTION, HTTP_STATUS, RESPONSIVE_VIEWPORT, CODE_INSPECTION, MANUAL
    test_config_json: Optional[Any] = None

class AcceptanceCriterionCreate(AcceptanceCriterionBase):
    pass

class AcceptanceCriterionResponse(AcceptanceCriterionBase):
    id: str
    milestone_id: str
    status: str
    class Config:
        from_attributes = True

# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    order_index: int = 0
    due_date: Optional[str] = None

class MilestoneCreate(MilestoneBase):
    criteria: Optional[List[AcceptanceCriterionCreate]] = None

class MilestoneResponse(MilestoneBase):
    id: str
    project_id: str
    status: str
    created_at: datetime
    criteria: List[AcceptanceCriterionResponse] = []
    class Config:
        from_attributes = True

# Contract Schemas
class ContractGenerateRequest(BaseModel):
    project_title: str
    brief: str
    budget: float
    currency: str = "USD"
    target_timeline_days: int = 14
    category: str = "Web Development"

class ContractAcceptRequest(BaseModel):
    user_id: str
    role: str  # client or freelancer

class ContractResponse(BaseModel):
    id: str
    project_id: str
    version: int
    content_markdown: str
    content_json: Optional[Any] = None
    status: str
    hold_reason: Optional[str] = None
    is_on_hold: bool = False
    client_signed_at: Optional[datetime] = None
    freelancer_signed_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Contract Comment & Revision Schemas
class ContractCommentCreate(BaseModel):
    message: str
    comment_type: str = "COMMENT"  # COMMENT, REVISION_REQUEST, HOLD_NOTICE, CHANGE_APPROVAL

class ContractCommentResponse(BaseModel):
    id: str
    contract_id: str
    project_id: str
    author_id: str
    author_name: str
    author_role: str
    message: str
    comment_type: str
    created_at: datetime
    class Config:
        from_attributes = True

class ContractEditRequest(BaseModel):
    content_markdown: str
    milestones: Optional[List[Dict[str, Any]]] = None

class ContractAIEditRequest(BaseModel):
    instruction: str
    user_id: Optional[str] = None
    role: Optional[str] = "freelancer"

class ContractAIEditResponse(BaseModel):
    revised_markdown: str
    extracted_budget: float
    extracted_advance: float
    extracted_held_balance: float
    summary_of_changes: str

class ContractHoldRequest(BaseModel):
    reason: str

# Submission Schemas
class SubmissionCreate(BaseModel):
    milestone_id: str
    freelancer_id: Optional[str] = None
    repository_url: Optional[str] = None
    deployment_url: str
    commit_hash: Optional[str] = None
    notes: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: str
    milestone_id: str
    freelancer_id: Optional[str]
    repository_url: Optional[str]
    deployment_url: str
    commit_hash: Optional[str]
    notes: Optional[str]
    submitted_at: datetime
    class Config:
        from_attributes = True

# Evidence & Verification Schemas
class EvidenceResponse(BaseModel):
    id: str
    file_path: str
    file_name: str
    file_type: str
    sha256_hash: str
    metadata_json: Optional[Any] = None
    captured_at: datetime
    class Config:
        from_attributes = True

class VerificationResultResponse(BaseModel):
    id: str
    criterion_id: str
    outcome: str  # PASS, FAIL, REVIEW
    details: Optional[str] = None
    execution_time_ms: int = 0
    evidence_id: Optional[str] = None
    evidence: Optional[EvidenceResponse] = None
    class Config:
        from_attributes = True

class VerificationRunResponse(BaseModel):
    id: str
    submission_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    summary: Optional[str] = None
    passed_count: int
    failed_count: int
    review_count: int
    ai_analysis: Optional[str] = None
    results: List[VerificationResultResponse] = []
    evidence_items: List[EvidenceResponse] = []
    class Config:
        from_attributes = True

# Dispute Schemas
class DisputeCreate(BaseModel):
    milestone_id: str
    initiated_by_id: str
    reason: str
    client_argument: Optional[str] = None
    freelancer_argument: Optional[str] = None

class DisputeRespond(BaseModel):
    argument: str
    role: str  # client or freelancer

class DisputeResponse(BaseModel):
    id: str
    milestone_id: str
    initiated_by_id: str
    reason: str
    client_argument: Optional[str] = None
    freelancer_argument: Optional[str] = None
    ai_neutral_analysis: Optional[str] = None
    recommended_action: Optional[str] = None
    ai_severity: Optional[str] = "LOW"
    is_escalated: bool = False
    escalated_to_admin: bool = False
    ai_dossier_summary: Optional[str] = None
    frozen_amount: float = 0.0
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class DisputeAIDossierResponse(BaseModel):
    dispute_id: str
    project_id: str
    project_title: str
    milestone_id: str
    milestone_title: str
    disputed_amount: float
    client_name: str
    freelancer_name: str
    initiated_by_name: str
    reason: str
    client_argument: Optional[str] = None
    freelancer_argument: Optional[str] = None
    contract_summary: str
    signed_criteria: List[str]
    conversation_summary: str
    verification_evidence_summary: str
    ai_severity: str
    ai_neutral_verdict: str
    ai_recommendation: str
    frozen_escrow_amount: float
    is_escalated: bool

# Invoice Schemas
class InvoiceLineItem(BaseModel):
    description: str
    type: str = "Fixed Milestone"
    amount: float

class InvoiceResponse(BaseModel):
    id: str
    project_id: str
    milestone_id: Optional[str] = None
    invoice_number: str
    invoice_type: str  # ADVANCE, MILESTONE, FINAL
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    order_index: int = 0
    due_date: Optional[str] = None
    status: str  # PENDING_DEPOSIT, HELD_IN_ESCROW, RELEASED, REFUNDED, FROZEN_IN_DISPUTE
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    deposit_paid_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    client_logo_url: Optional[str] = None
    contractor_logo_url: Optional[str] = None
    platform_logo_url: str = "/veylora-logo.png"
    line_items_json: Optional[Any] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class InvoiceLogoUpdateRequest(BaseModel):
    client_logo_url: Optional[str] = None
    contractor_logo_url: Optional[str] = None

class InvoiceDepositRequest(BaseModel):
    payer_id: str

class InvoiceReleaseRequest(BaseModel):
    client_id: str
    note: Optional[str] = "Approved and released by client"

# PayPal Payment Schemas
class PayPalCreateOrderRequest(BaseModel):
    milestone_id: str
    payer_id: str

class PayPalCaptureOrderRequest(BaseModel):
    paypal_order_id: str
    milestone_id: str

class PayPalCreateAdvanceOrderRequest(BaseModel):
    project_id: str
    payer_id: str

class PayPalCaptureAdvanceOrderRequest(BaseModel):
    project_id: str
    paypal_order_id: str

class MilestoneReleaseRequest(BaseModel):
    milestone_id: str
    client_id: str
    release_note: Optional[str] = "Milestone criteria satisfied and approved by client."

class PaymentResponse(BaseModel):
    id: str
    milestone_id: Optional[str] = None
    project_id: Optional[str] = None
    payer_id: str
    payment_type: str = "MILESTONE"
    amount: float
    currency: str
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    client_id: str
    freelancer_id: Optional[str] = None
    title: str
    description: str
    category: str = "Web Development"
    budget: float = 0.0
    advance_amount: Optional[float] = 0.0
    held_balance: Optional[float] = 0.0
    currency: str = "USD"
    invitee_email: Optional[str] = None
    invite_role: Optional[str] = "freelancer"

class InvitationResponse(BaseModel):
    id: str
    project_id: str
    inviter_id: str
    invitee_email: Optional[str] = None
    role: str
    token: str
    status: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class InvitationCreate(BaseModel):
    project_id: str
    inviter_id: str
    role: str = "client"  # or freelancer
    invitee_email: Optional[str] = None

class InvitationAcceptRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    client_id: str
    freelancer_id: Optional[str] = None
    title: str
    description: str
    category: str
    budget: float
    advance_amount: float = 0.0
    advance_status: str = "PENDING"
    advance_paypal_order_id: Optional[str] = None
    advance_paypal_capture_id: Optional[str] = None
    held_balance: float = 0.0
    held_balance_status: str = "UNFUNDED"
    invitation_token: Optional[str] = None
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime
    client: Optional[UserResponse] = None
    freelancer: Optional[UserResponse] = None
    contracts: List[ContractResponse] = []
    milestones: List[MilestoneResponse] = []
    invitations: List[InvitationResponse] = []
    invoices: List[InvoiceResponse] = []
    comments: List[ContractCommentResponse] = []
    class Config:
        from_attributes = True

# Audit Event / Timeline Schemas
class AuditEventResponse(BaseModel):
    id: str
    project_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: str
    action: str
    details_json: Optional[Any] = None
    prev_hash: Optional[str] = None
    current_hash: str
    timestamp: datetime
    class Config:
        from_attributes = True

# Additional Agent Schemas
class DealGuardianRequest(BaseModel):
    project_title: str
    brief: str
    budget: float
    milestones: Optional[List[Dict[str, Any]]] = None

class ScopeChangeRequest(BaseModel):
    project_id: str
    message_or_request: str

class PaymentExplanationRequest(BaseModel):
    project_id: str
    question: Optional[str] = None

# Admin Schemas
class AdminStatsResponse(BaseModel):
    total_users: int
    total_projects: int
    total_payments_volume: float
    total_escrow_secured: float
    open_disputes: int
    ai_verifications_count: int
    reconciliation_status: str
    custody_disclaimer: str

class AdminDisputeItem(BaseModel):
    dispute_id: str
    project_id: str
    project_title: str
    milestone_title: str
    initiated_by: str
    reason: str
    status: str
    created_at: datetime
    ai_recommendation: Optional[str] = None

class ResolveDisputeRequest(BaseModel):
    decision: str = "RELEASE_TO_FREELANCER"
    notes: Optional[str] = "Resolved by Administrator"

