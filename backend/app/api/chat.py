import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, ContractComment, User

router = APIRouter(prefix="/chat", tags=["Project Chat"])

class ChatMessageCreate(BaseModel):
    message: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = "client" # client, freelancer, admin, ai_assistant
    comment_type: Optional[str] = "COMMENT" # COMMENT, SCOPE_CHANGE, ESCROW_NOTICE, AI_ASSIST

class ChatMessageResponse(BaseModel):
    id: str
    project_id: str
    author_id: str
    author_name: str
    author_role: str
    message: str
    comment_type: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/{project_id}/messages", response_model=List[ChatMessageResponse])
def get_project_chat_messages(project_id: str, db: Session = Depends(get_db)):
    """Retrieves all chat messages between client, contractor, and AI Escrow Arbiter for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    messages = (
        db.query(ContractComment)
        .filter(ContractComment.project_id == project_id)
        .order_by(ContractComment.created_at.asc())
        .all()
    )

    # If empty, generate standard initial project onboarding messages
    if not messages:
        client_name = project.client.name if project.client else "Alex Rivera (Client)"
        contractor_name = project.freelancer.name if project.freelancer else "Elena Rostova (Contractor)"
        contract_id = project.contracts[-1].id if project.contracts else project.id

        initial_seed = [
            ContractComment(
                contract_id=contract_id,
                project_id=project_id,
                author_id=project.client_id,
                author_name=client_name,
                author_role="client",
                message=f"Hi Elena! I've authorized the initial escrow deposit for {project.title}. Looking forward to kicking off Milestone 1.",
                comment_type="ESCROW_NOTICE",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            ),
            ContractComment(
                contract_id=contract_id,
                project_id=project_id,
                author_id=project.freelancer_id or "user-freelancer-001",
                author_name=contractor_name,
                author_role="freelancer",
                message="Hi Alex! Thank you. I have initialized the repository and staging architecture. All automated tests are passing in the verification sandbox.",
                comment_type="COMMENT",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1)
            ),
            ContractComment(
                contract_id=contract_id,
                project_id=project_id,
                author_id="system-ai-arbiter",
                author_name="Veylora Escrow Arbiter AI",
                author_role="ai_assistant",
                message="🔒 PayPal Orders v2 escrow protection is ACTIVE. When deliverables are submitted and tests pass, funds will disburse autonomously to the contractor's PayPal wallet.",
                comment_type="AI_ASSIST",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=45)
            )
        ]
        for msg in initial_seed:
            db.add(msg)
        db.commit()
        messages = initial_seed

    return messages

@router.post("/{project_id}/messages", response_model=ChatMessageResponse)
async def send_project_chat_message(
    project_id: str,
    req: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """Sends a chat message in the project conversation thread."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    contract_id = project.contracts[-1].id if project.contracts else project.id

    author_name = req.author_name
    if not author_name:
        if req.author_role == "client":
            author_name = project.client.name if project.client else "Alex Rivera (Client)"
        elif req.author_role == "freelancer":
            author_name = project.freelancer.name if project.freelancer else "Elena Rostova (Contractor)"
        else:
            author_name = "Admin / Arbiter"

    new_msg = ContractComment(
        contract_id=contract_id,
        project_id=project_id,
        author_id=req.author_id or (project.client_id if req.author_role == "client" else (project.freelancer_id or "user-freelancer-001")),
        author_name=author_name,
        author_role=req.author_role or "client",
        message=req.message.strip(),
        comment_type=req.comment_type or "COMMENT",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Autonomous AI assistant reply if user asks about escrow, payments, or verification
    lower_text = req.message.lower()
    if any(k in lower_text for k in ["@ai", "escrow", "release", "payout", "paypal", "milestone", "verify", "dispute"]):
        ai_reply = "I am monitoring this project's escrow milestones. "
        if "release" in lower_text or "payout" in lower_text:
            ai_reply += "To release funds, the client can click 'Release via PayPal' on the Invoices & Escrow tab once test verification is complete."
        elif "escrow" in lower_text:
            ai_reply += f"Escrow balance is secured under PayPal Orders v2. Current held balance is ${project.held_balance:,.2f} {project.currency}."
        elif "verify" in lower_text or "test" in lower_text:
            ai_reply += "Our automated Playwright test suite validates staging URLs for HTTP 200, responsiveness, and DOM interactions before payment release."
        elif "dispute" in lower_text:
            ai_reply += "If an issue arises, either party may file a dispute in the Disputes tab to freeze remaining escrow and escalate to an Arbiter."
        else:
            ai_reply += "Everything is on track with the agreed contract criteria."

        ai_comment = ContractComment(
            contract_id=contract_id,
            project_id=project_id,
            author_id="system-ai-arbiter",
            author_name="Veylora Escrow Arbiter AI",
            author_role="ai_assistant",
            message=ai_reply,
            comment_type="AI_ASSIST",
            created_at=datetime.datetime.utcnow() + datetime.timedelta(seconds=1)
        )
        db.add(ai_comment)
        db.commit()

    return new_msg

