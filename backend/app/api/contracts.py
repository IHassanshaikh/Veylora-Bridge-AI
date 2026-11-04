import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from ..database import get_db
from ..models import Project, Contract, Milestone, AcceptanceCriterion, User, ContractComment
from ..schemas import (
    ContractGenerateRequest, ContractAcceptRequest, ContractResponse,
    DealGuardianRequest, ScopeChangeRequest, ContractCommentCreate,
    ContractCommentResponse, ContractEditRequest, ContractHoldRequest,
    ContractAIEditRequest, ContractAIEditResponse
)
from ..agents import contract_architect, deal_guardian, scope_change_analyst, trust_auditor
from ..services.invoice_service import invoice_service
from ..services.financial_sync import sync_contract_financials, extract_financials_from_markdown

router = APIRouter(prefix="/contracts", tags=["Contracts & Milestones"])

@router.post("/deal-guardian/analyze")
async def analyze_with_deal_guardian(req: DealGuardianRequest):
    """Invokes Agent 2: Deal Guardian to scan proposed scope and contract terms for ambiguities and risks."""
    analysis = await deal_guardian.analyze_risks(
        project_title=req.project_title,
        brief=req.brief,
        budget=req.budget,
        milestones=req.milestones
    )
    return analysis

@router.post("/scope-change/analyze")
async def analyze_scope_change(req: ScopeChangeRequest, db: Session = Depends(get_db)):
    """Invokes Agent 3: Scope Change Analyst to evaluate messages/requests against the baseline contract."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones_data = [
        {"title": m.title, "description": m.description, "amount": m.amount}
        for m in project.milestones
    ]

    analysis = await scope_change_analyst.analyze_scope(
        contract_title=project.title,
        baseline_milestones=milestones_data,
        message_or_request=req.message_or_request
    )
    return analysis

@router.post("/generate/{project_id}", response_model=ContractResponse)
async def generate_contract_for_project(
    project_id: str,
    req: ContractGenerateRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Call Agent 1: Contract Architect
    contract_data = await contract_architect.generate_contract(
        brief=req.brief or project.description,
        project_title=req.project_title or project.title,
        budget=req.budget or project.budget,
        currency=req.currency or project.currency,
        target_days=req.target_timeline_days
    )

    # Convert to readable Markdown
    markdown_lines = [
        f"# {contract_data.get('title', 'Freelance Contract')}\n",
        f"**Summary:** {contract_data.get('summary', '')}\n",
        f"**Terms & Policy:** {contract_data.get('terms', '')}\n",
        "## Agreed Milestones & Testable Acceptance Criteria\n"
    ]

    # Clean existing draft milestones if any
    db.query(Milestone).filter(Milestone.project_id == project_id).delete()

    created_milestones = []
    for idx, m in enumerate(contract_data.get("milestones", [])):
        milestone = Milestone(
            project_id=project_id,
            title=m.get("title"),
            description=m.get("description"),
            amount=m.get("amount", 0.0),
            currency=req.currency,
            order_index=idx,
            due_date=f"T+{m.get('due_days', 7)} days",
            status="PENDING"
        )
        db.add(milestone)
        db.flush()

        markdown_lines.append(f"### {milestone.title} ({milestone.currency} {milestone.amount:,.2f})")
        markdown_lines.append(f"{milestone.description}\n")
        markdown_lines.append("**Acceptance Criteria:**")

        for c in m.get("criteria", []):
            crit = AcceptanceCriterion(
                milestone_id=milestone.id,
                title=c.get("title"),
                description=c.get("description"),
                verification_type=c.get("verification_type", "BROWSER_INTERACTION"),
                test_config_json=c.get("test_config_json") or {},
                status="PENDING"
            )
            db.add(crit)
            markdown_lines.append(f"- `[{crit.verification_type}]` **{crit.title}**: {crit.description}")
        markdown_lines.append("")

    markdown_content = "\n".join(markdown_lines)

    # Determine version
    prev_contracts = db.query(Contract).filter(Contract.project_id == project_id).count()
    version = prev_contracts + 1

    contract = Contract(
        project_id=project_id,
        version=version,
        content_markdown=markdown_content,
        content_json=contract_data,
        status="PENDING_APPROVAL"
    )
    db.add(contract)
    project.status = "CONTRACT_PENDING"
    db.commit()
    db.refresh(contract)

    # Record audit event
    trust_auditor.record_event(
        db=db,
        project_id=project_id,
        action="CONTRACT_GENERATED_BY_AI",
        actor_role="ai",
        details={"version": version, "milestones_count": len(contract_data.get("milestones", []))}
    )

    return contract

@router.get("/{project_id}/latest", response_model=ContractResponse)
def get_latest_contract(project_id: str, db: Session = Depends(get_db)):
    contract = (
        db.query(Contract)
        .filter(Contract.project_id == project_id)
        .order_by(Contract.version.desc())
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="No contract found for this project")
    return contract

@router.post("/{contract_id}/accept", response_model=ContractResponse)
def accept_contract(contract_id: str, req: ContractAcceptRequest, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user = db.query(User).filter(User.id == req.user_id).first()
    actor_name = user.name if user else req.role

    now = datetime.datetime.utcnow()
    if req.role == "client":
        contract.client_signed_at = now
    elif req.role == "freelancer":
        contract.freelancer_signed_at = now

    # If both have signed (or client initiated with freelancer auto-agreement in demo)
    if contract.client_signed_at and contract.freelancer_signed_at:
        contract.status = "ACCEPTED"
        contract.is_on_hold = False
        contract.hold_reason = None
        project = db.query(Project).filter(Project.id == contract.project_id).first()
        if project:
            project.status = "IN_PROGRESS"
            # Activate first milestone
            first_milestone = db.query(Milestone).filter(Milestone.project_id == project.id).order_by(Milestone.order_index.asc()).first()
            if first_milestone:
                first_milestone.status = "IN_PROGRESS"
            # Auto-generate sequential invoices
            invoice_service.generate_project_invoices(db, project)

    db.commit()
    db.refresh(contract)

    trust_auditor.record_event(
        db=db,
        project_id=contract.project_id,
        action=f"CONTRACT_SIGNED_BY_{req.role.upper()}",
        actor_id=req.user_id,
        actor_name=actor_name,
        actor_role=req.role,
        details={"contract_version": contract.version, "status": contract.status}
    )

    return contract

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: str,
    req: ContractEditRequest,
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query("freelancer"),
    db: Session = Depends(get_db)
):
    """Allows freelancer or creator to edit the contract markdown and milestone scope directly."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    contract.content_markdown = req.content_markdown
    contract.version += 1
    contract.is_on_hold = False
    contract.hold_reason = None
    contract.status = "PENDING_APPROVAL"
    # Reset signatures since agreement content changed
    contract.client_signed_at = None
    contract.freelancer_signed_at = datetime.datetime.utcnow() if role == "freelancer" else None

    project = contract.project
    if project:
        project.status = "CONTRACT_PENDING"

    # Identify actor
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    actor_name = user.name if user else (role.capitalize() if role else "Contractor")

    # Automatically extract and synchronize new budget, advance, and milestones everywhere
    financials_summary = sync_contract_financials(
        db=db,
        contract=contract,
        actor_id=user_id,
        actor_name=actor_name,
        actor_role=role
    )

    # Add revision notice comment with extracted financials
    new_budget = financials_summary.get("budget", project.budget if project else 0.0)
    new_adv = financials_summary.get("advance_amount", project.advance_amount if project else 0.0)
    new_escrow = financials_summary.get("held_balance", project.held_balance if project else 0.0)

    rev_comment = ContractComment(
        contract_id=contract.id,
        project_id=contract.project_id,
        author_id=user_id or "user-freelancer-001",
        author_name=actor_name,
        author_role=role or "freelancer",
        message=(
            f"Contract updated to Version {contract.version}. Revisions applied. "
            f"Financials synchronized: Budget ${new_budget:,.2f} USD "
            f"(Kickoff Advance: ${new_adv:,.2f} USD, Held Escrow: ${new_escrow:,.2f} USD). "
            f"Awaiting counterparty review and approval."
        ),
        comment_type="REVISION_REQUEST"
    )
    db.add(rev_comment)

    db.commit()
    db.refresh(contract)

    trust_auditor.record_event(
        db=db,
        project_id=contract.project_id,
        action="CONTRACT_REVISED",
        actor_id=user_id,
        actor_name=actor_name,
        actor_role=role or "freelancer",
        details={
            "version": contract.version,
            "status": contract.status,
            "new_budget": new_budget,
            "new_advance": new_adv,
            "new_held_balance": new_escrow
        }
    )

    return contract

@router.post("/{contract_id}/ai-edit", response_model=ContractAIEditResponse)
async def ai_edit_contract(
    contract_id: str,
    req: ContractAIEditRequest,
    db: Session = Depends(get_db)
):
    """
    Invokes Contract Architect AI to revise the agreement terms, budget, and milestones
    based on counterparty or client comments / instructions (e.g., 'Client said it must be 1000 instead of 1500').
    """
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    project = contract.project
    current_budget = float(project.budget) if project and project.budget else 1000.0
    project_title = project.title if project else "Freelance Project"
    currency = project.currency if project else "USD"

    revision = await contract_architect.revise_contract_with_instruction(
        current_markdown=contract.content_markdown,
        instruction=req.instruction,
        project_title=project_title,
        current_budget=current_budget,
        currency=currency
    )

    return revision

@router.post("/{contract_id}/comments", response_model=ContractCommentResponse)
def add_contract_comment(
    contract_id: str,
    req: ContractCommentCreate,
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query("client"),
    db: Session = Depends(get_db)
):
    """Adds a negotiation comment or change feedback to the contract."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    actor_name = user.name if user else (role.capitalize() if role else "User")

    comment = ContractComment(
        contract_id=contract.id,
        project_id=contract.project_id,
        author_id=user_id or "user-client-001",
        author_name=actor_name,
        author_role=role or "client",
        message=req.message,
        comment_type=req.comment_type
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment

@router.get("/{contract_id}/comments", response_model=List[ContractCommentResponse])
def get_contract_comments(contract_id: str, db: Session = Depends(get_db)):
    """Returns all comments and revision requests recorded for this agreement."""
    comments = (
        db.query(ContractComment)
        .filter(ContractComment.contract_id == contract_id)
        .order_by(ContractComment.created_at.asc())
        .all()
    )
    return comments

@router.post("/{contract_id}/hold", response_model=ContractResponse)
def put_contract_on_hold(
    contract_id: str,
    req: ContractHoldRequest,
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query("client"),
    db: Session = Depends(get_db)
):
    """Puts agreement on hold with specific requested changes, notifying the contractor."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    actor_name = user.name if user else (role.capitalize() if role else "Client")

    contract.status = "ON_HOLD"
    contract.is_on_hold = True
    contract.hold_reason = req.reason

    project = contract.project
    if project:
        project.status = "AGREEMENT_ON_HOLD"

    # Add comment record for the hold
    hold_comment = ContractComment(
        contract_id=contract.id,
        project_id=contract.project_id,
        author_id=user_id or "user-client-001",
        author_name=actor_name,
        author_role=role or "client",
        message=f"Agreement placed ON HOLD. Requested Changes: {req.reason}",
        comment_type="HOLD_NOTICE"
    )
    db.add(hold_comment)

    db.commit()
    db.refresh(contract)

    trust_auditor.record_event(
        db=db,
        project_id=contract.project_id,
        action="CONTRACT_PUT_ON_HOLD",
        actor_id=user_id,
        actor_name=actor_name,
        actor_role=role or "client",
        details={"reason": req.reason, "version": contract.version}
    )

    return contract

@router.post("/{contract_id}/resume", response_model=ContractResponse)
def resume_contract_review(
    contract_id: str,
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query("freelancer"),
    db: Session = Depends(get_db)
):
    """Resumes contract review after revisions have been applied."""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    actor_name = user.name if user else (role.capitalize() if role else "Contractor")

    contract.status = "PENDING_APPROVAL"
    contract.is_on_hold = False
    contract.hold_reason = None

    project = contract.project
    if project:
        project.status = "CONTRACT_PENDING"

    resume_comment = ContractComment(
        contract_id=contract.id,
        project_id=contract.project_id,
        author_id=user_id or "user-freelancer-001",
        author_name=actor_name,
        author_role=role or "freelancer",
        message="Revisions completed. Hold lifted. Agreement returned to review.",
        comment_type="COMMENT"
    )
    db.add(resume_comment)

    db.commit()
    db.refresh(contract)

    trust_auditor.record_event(
        db=db,
        project_id=contract.project_id,
        action="CONTRACT_REVIEW_RESUMED",
        actor_id=user_id,
        actor_name=actor_name,
        actor_role=role or "freelancer",
        details={"version": contract.version}
    )

    return contract

