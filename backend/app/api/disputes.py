import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dispute, Milestone, AcceptanceCriterion, Project, User, Contract, ContractComment, Invoice, Submission, VerificationRun
from ..schemas import DisputeCreate, DisputeRespond, DisputeResponse, DisputeAIDossierResponse
from ..agents import dispute_analyst, trust_auditor

router = APIRouter(prefix="/disputes", tags=["Disputes & Resolution"])

@router.post("", response_model=DisputeResponse)
async def create_dispute(req: DisputeCreate, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == req.milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    user = db.query(User).filter(User.id == req.initiated_by_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    project = milestone.project

    # Fetch agreed criteria
    criteria = db.query(AcceptanceCriterion).filter(AcceptanceCriterion.milestone_id == req.milestone_id).all()
    criteria_list = [f"{c.title}: {c.description}" for c in criteria]

    # Fetch contract content and negotiation comments
    contract = (
        db.query(Contract)
        .filter(Contract.project_id == project.id)
        .order_by(Contract.version.desc())
        .first()
    ) if project else None

    comments = (
        db.query(ContractComment)
        .filter(ContractComment.project_id == project.id)
        .order_by(ContractComment.created_at.asc())
        .all()
    ) if project else []
    comments_data = [{"author_name": c.author_name, "author_role": c.author_role, "message": c.message} for c in comments]

    # Fetch test verification summary
    verification_summary = None
    sub = (
        db.query(Submission)
        .filter(Submission.milestone_id == milestone.id)
        .order_by(Submission.submitted_at.desc())
        .first()
    )
    if sub and sub.verification_runs:
        last_run = sub.verification_runs[-1]
        verification_summary = (
            f"Run Status: {last_run.status} | Passed: {last_run.passed_count} | "
            f"Failed: {last_run.failed_count} | Notes: {last_run.summary or 'N/A'}"
        )

    # Run Agent 4: Impartial Dispute Analyst & Triage
    analysis = await dispute_analyst.analyze(
        contract_title=project.title if project else "Project",
        milestone_title=milestone.title,
        agreed_criteria=criteria_list,
        client_argument=req.client_argument or req.reason,
        freelancer_argument=req.freelancer_argument or "Work was completed as specified in the agreed criteria.",
        contract_markdown=contract.content_markdown if contract else None,
        comments_log=comments_data,
        verification_summary=verification_summary,
        dispute_amount=milestone.amount
    )

    severity = analysis.get("severity", "LOW")
    escalated = analysis.get("escalate_to_admin", False) or severity in ["HIGH", "CRITICAL"]

    dispute = Dispute(
        milestone_id=req.milestone_id,
        initiated_by_id=req.initiated_by_id,
        reason=req.reason,
        client_argument=req.client_argument or req.reason,
        freelancer_argument=req.freelancer_argument or "Work was completed as specified in the agreed criteria.",
        ai_neutral_analysis=analysis.get("neutral_analysis"),
        recommended_action=analysis.get("recommended_action"),
        ai_severity=severity,
        is_escalated=escalated,
        escalated_to_admin=escalated,
        ai_dossier_summary=analysis.get("admin_dossier_summary"),
        frozen_amount=milestone.amount,
        status="ESCALATED" if escalated else "OPEN"
    )
    db.add(dispute)
    milestone.status = "DISPUTED"

    # Freeze corresponding invoice if exists
    inv = db.query(Invoice).filter(Invoice.milestone_id == milestone.id).first()
    if inv:
        inv.status = "FROZEN_IN_DISPUTE"

    db.commit()
    db.refresh(dispute)

    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="DISPUTE_ESCALATED_TO_ADMIN" if escalated else "DISPUTE_OPENED",
        actor_id=user.id,
        actor_name=user.name,
        actor_role=user.role,
        details={
            "dispute_id": dispute.id,
            "reason": req.reason,
            "severity": severity,
            "escalated_to_admin": escalated,
            "frozen_amount": dispute.frozen_amount
        }
    )

    return dispute

@router.get("/milestone/{milestone_id}", response_model=DisputeResponse)
def get_milestone_dispute(milestone_id: str, db: Session = Depends(get_db)):
    dispute = (
        db.query(Dispute)
        .filter(Dispute.milestone_id == milestone_id)
        .order_by(Dispute.created_at.desc())
        .first()
    )
    if not dispute:
        raise HTTPException(status_code=404, detail="No dispute found for this milestone")
    return dispute

@router.get("/{dispute_id}/dossier", response_model=DisputeAIDossierResponse)
def get_dispute_dossier(dispute_id: str, db: Session = Depends(get_db)):
    """Provides the Dispute Department (Admin) with the complete AI synthesized dossier."""
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    milestone = dispute.milestone
    project = milestone.project if milestone else None
    client = project.client if project else None
    freelancer = project.freelancer if project else None
    initiator = dispute.initiator

    # Criteria
    criteria = db.query(AcceptanceCriterion).filter(AcceptanceCriterion.milestone_id == milestone.id).all() if milestone else []
    signed_criteria = [f"{c.title} — {c.description}" for c in criteria]

    # Verification evidence
    evidence_summary = "No test runs executed."
    sub = db.query(Submission).filter(Submission.milestone_id == milestone.id).first() if milestone else None
    if sub and sub.verification_runs:
        run = sub.verification_runs[-1]
        evidence_summary = f"Playwright Run: {run.status} | Passed: {run.passed_count} | Failed: {run.failed_count}. Summary: {run.summary or 'Executed against target selectors.'}"

    # Conversation summary
    comments = db.query(ContractComment).filter(ContractComment.project_id == project.id).all() if project else []
    convo_summary = f"{len(comments)} negotiation comments recorded between client and contractor." if comments else "Direct creation without pre-signing revisions."

    return DisputeAIDossierResponse(
        dispute_id=dispute.id,
        project_id=project.id if project else "N/A",
        project_title=project.title if project else "Disputed Project",
        milestone_id=milestone.id if milestone else "N/A",
        milestone_title=milestone.title if milestone else "Disputed Milestone",
        disputed_amount=dispute.frozen_amount or (milestone.amount if milestone else 0.0),
        client_name=client.name if client else "Client",
        freelancer_name=freelancer.name if freelancer else "Contractor",
        initiated_by_name=initiator.name if initiator else "User",
        reason=dispute.reason,
        client_argument=dispute.client_argument,
        freelancer_argument=dispute.freelancer_argument,
        contract_summary=project.description if project else "Agreed milestone contract.",
        signed_criteria=signed_criteria,
        conversation_summary=convo_summary,
        verification_evidence_summary=evidence_summary,
        ai_severity=dispute.ai_severity or "HIGH",
        ai_neutral_verdict=dispute.ai_neutral_analysis or "Impartial analysis pending.",
        ai_recommendation=dispute.recommended_action or "Review evidence and decide.",
        frozen_escrow_amount=dispute.frozen_amount or 0.0,
        is_escalated=dispute.is_escalated
    )
