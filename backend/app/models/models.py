import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="client")  # client, freelancer, admin
    password_hash = Column(String, nullable=True)
    auth_provider = Column(String, default="email")  # email, google
    paypal_email = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="UNVERIFIED")  # UNVERIFIED, PENDING, VERIFIED, REJECTED
    id_document_type = Column(String, nullable=True)  # PASSPORT, NATIONAL_ID, DRIVERS_LICENSE
    id_document_number = Column(String, nullable=True)
    id_document_country = Column(String, nullable=True)
    id_card_front_url = Column(Text, nullable=True)
    id_card_back_url = Column(Text, nullable=True)
    id_selfie_url = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    client_projects = relationship("Project", back_populates="client", foreign_keys="Project.client_id")
    freelancer_projects = relationship("Project", back_populates="freelancer", foreign_keys="Project.freelancer_id")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="Web Development")
    budget = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    status = Column(String, default="CONTRACT_PENDING")  # DRAFT, CONTRACT_PENDING, IN_PROGRESS, COMPLETED, DISPUTED
    advance_amount = Column(Float, default=0.0)
    advance_status = Column(String, default="PENDING")  # PENDING, PAID, REFUNDED
    advance_paypal_order_id = Column(String, nullable=True)
    advance_paypal_capture_id = Column(String, nullable=True)
    held_balance = Column(Float, default=0.0)
    held_balance_status = Column(String, default="UNFUNDED")  # UNFUNDED, SECURED, PARTIALLY_RELEASED, RELEASED
    invitation_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    client = relationship("User", foreign_keys=[client_id], back_populates="client_projects")
    freelancer = relationship("User", foreign_keys=[freelancer_id], back_populates="freelancer_projects")
    contracts = relationship("Contract", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan", order_by="Milestone.order_index")
    audit_events = relationship("AuditEvent", back_populates="project", cascade="all, delete-orphan", order_by="AuditEvent.timestamp")
    invitations = relationship("Invitation", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ContractComment", back_populates="project", cascade="all, delete-orphan", order_by="ContractComment.created_at")
    invoices = relationship("Invoice", back_populates="project", cascade="all, delete-orphan", order_by="Invoice.order_index")

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    version = Column(Integer, default=1)
    content_markdown = Column(Text, nullable=False)
    content_json = Column(JSON, nullable=True)
    status = Column(String, default="PENDING_APPROVAL")  # DRAFT, PENDING_APPROVAL, ON_HOLD, REVISION_REQUESTED, ACCEPTED, SUPERSEDED
    hold_reason = Column(Text, nullable=True)
    is_on_hold = Column(Boolean, default=False)
    client_signed_at = Column(DateTime, nullable=True)
    freelancer_signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="contracts")
    comments = relationship("ContractComment", back_populates="contract", cascade="all, delete-orphan", order_by="ContractComment.created_at")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    order_index = Column(Integer, default=0)
    due_date = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, SUBMITTED, VERIFYING, VERIFIED, APPROVED, PAID, DISPUTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="milestones")
    criteria = relationship("AcceptanceCriterion", back_populates="milestone", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="milestone", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="milestone", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="milestone", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="milestone", cascade="all, delete-orphan")

class AcceptanceCriterion(Base):
    __tablename__ = "acceptance_criteria"

    id = Column(String, primary_key=True, default=generate_uuid)
    milestone_id = Column(String, ForeignKey("milestones.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    verification_type = Column(String, default="BROWSER_INTERACTION")  # BROWSER_INTERACTION, HTTP_STATUS, RESPONSIVE_VIEWPORT, CODE_INSPECTION, MANUAL
    test_config_json = Column(JSON, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, PASSED, FAILED, NEEDS_REVIEW

    milestone = relationship("Milestone", back_populates="criteria")
    results = relationship("VerificationResult", back_populates="criterion", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    milestone_id = Column(String, ForeignKey("milestones.id"), nullable=False)
    freelancer_id = Column(String, ForeignKey("users.id"), nullable=True)
    repository_url = Column(String, nullable=True)
    deployment_url = Column(String, nullable=False)
    commit_hash = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    milestone = relationship("Milestone", back_populates="submissions")
    verification_runs = relationship("VerificationRun", back_populates="submission", cascade="all, delete-orphan")

class VerificationRun(Base):
    __tablename__ = "verification_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    submission_id = Column(String, ForeignKey("submissions.id"), nullable=False)
    status = Column(String, default="COMPLETED")  # RUNNING, COMPLETED, FAILED
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    summary = Column(Text, nullable=True)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    ai_analysis = Column(Text, nullable=True)

    submission = relationship("Submission", back_populates="verification_runs")
    results = relationship("VerificationResult", back_populates="run", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="verification_run", cascade="all, delete-orphan")

class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, ForeignKey("verification_runs.id"), nullable=False)
    criterion_id = Column(String, ForeignKey("acceptance_criteria.id"), nullable=False)
    outcome = Column(String, default="PASS")  # PASS, FAIL, REVIEW
    details = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, default=0)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=True)

    run = relationship("VerificationRun", back_populates="results")
    criterion = relationship("AcceptanceCriterion", back_populates="results")
    evidence = relationship("Evidence")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    verification_run_id = Column(String, ForeignKey("verification_runs.id"), nullable=False)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, default="image/png")
    sha256_hash = Column(String, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    captured_at = Column(DateTime, default=datetime.datetime.utcnow)

    verification_run = relationship("VerificationRun", back_populates="evidence_items")

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String, primary_key=True, default=generate_uuid)
    milestone_id = Column(String, ForeignKey("milestones.id"), nullable=False)
    initiated_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    client_argument = Column(Text, nullable=True)
    freelancer_argument = Column(Text, nullable=True)
    ai_neutral_analysis = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    ai_severity = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    is_escalated = Column(Boolean, default=False)
    escalated_to_admin = Column(Boolean, default=False)
    ai_dossier_summary = Column(Text, nullable=True)
    frozen_amount = Column(Float, default=0.0)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String, nullable=True)  # "ai_auto" or "admin_arbitrator"
    status = Column(String, default="OPEN")  # OPEN, ESCALATED, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    milestone = relationship("Milestone", back_populates="disputes")
    initiator = relationship("User", foreign_keys=[initiated_by_id])

class ContractComment(Base):
    __tablename__ = "contract_comments"

    id = Column(String, primary_key=True, default=generate_uuid)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    author_name = Column(String, nullable=False)
    author_role = Column(String, default="client")  # client, freelancer, admin
    message = Column(Text, nullable=False)
    comment_type = Column(String, default="COMMENT")  # COMMENT, REVISION_REQUEST, HOLD_NOTICE, CHANGE_APPROVAL
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    contract = relationship("Contract", back_populates="comments")
    project = relationship("Project", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    milestone_id = Column(String, ForeignKey("milestones.id"), nullable=True)
    invoice_number = Column(String, nullable=False, unique=True, index=True)
    invoice_type = Column(String, default="MILESTONE")  # ADVANCE, MILESTONE, FINAL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    order_index = Column(Integer, default=0)
    due_date = Column(String, nullable=True)
    status = Column(String, default="PENDING_DEPOSIT")  # PENDING_DEPOSIT, HELD_IN_ESCROW, RELEASED, REFUNDED, FROZEN_IN_DISPUTE
    paypal_order_id = Column(String, nullable=True)
    paypal_capture_id = Column(String, nullable=True)
    deposit_paid_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)
    client_logo_url = Column(String, nullable=True)
    contractor_logo_url = Column(String, nullable=True)
    platform_logo_url = Column(String, default="/veylora-logo.png")
    line_items_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="invoices")
    milestone = relationship("Milestone", back_populates="invoices")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    milestone_id = Column(String, ForeignKey("milestones.id"), nullable=True)
    payer_id = Column(String, ForeignKey("users.id"), nullable=False)
    payment_type = Column(String, default="MILESTONE")  # ADVANCE, MILESTONE, REFUND
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    paypal_order_id = Column(String, nullable=True, index=True)
    paypal_capture_id = Column(String, nullable=True, index=True)
    status = Column(String, default="CREATED")  # CREATED, APPROVED, CAPTURED, FAILED, REFUNDED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    milestone = relationship("Milestone", back_populates="payments")
    project = relationship("Project")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    actor_id = Column(String, nullable=True)
    actor_name = Column(String, nullable=True)
    actor_role = Column(String, default="system")  # client, freelancer, system, ai
    action = Column(String, nullable=False)  # e.g., CONTRACT_CREATED, CONTRACT_ACCEPTED, SUBMISSION_MADE, VERIFICATION_PASSED, PAYMENT_CAPTURED
    details_json = Column(JSON, nullable=True)
    prev_hash = Column(String, nullable=True)
    current_hash = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="audit_events")

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    inviter_id = Column(String, ForeignKey("users.id"), nullable=False)
    invitee_email = Column(String, nullable=True)
    role = Column(String, default="client")  # "client" or "freelancer"
    token = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, ACCEPTED, EXPIRED, CANCELLED
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[inviter_id])

