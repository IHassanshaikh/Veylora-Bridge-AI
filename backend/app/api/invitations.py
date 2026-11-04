import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import Invitation, Project, User
from ..schemas import InvitationResponse, InvitationCreate, InvitationAcceptRequest
from ..agents import trust_auditor

router = APIRouter(prefix="/invitations", tags=["invitations"])

@router.post("", response_model=Dict[str, Any])
def create_invitation(req: InvitationCreate, db: Session = Depends(get_db)):
    """Create an expiring invitation link for a counterparty, optionally addressed to a specific client/freelancer email."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    inviter = db.query(User).filter(User.id == req.inviter_id).first()
    if not inviter:
        raise HTTPException(status_code=404, detail="Inviter user not found")

    token = secrets.token_urlsafe(24)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=7)

    invitation = Invitation(
        project_id=req.project_id,
        inviter_id=req.inviter_id,
        invitee_email=req.invitee_email,
        role=req.role,
        token=token,
        status="PENDING",
        expires_at=expires_at
    )
    db.add(invitation)
    project.invitation_token = token
    db.commit()
    db.refresh(invitation)

    invite_url = f"/invite/{token}"
    email_preview = {
        "to": req.invitee_email or "client@example.com",
        "subject": f"Invitation to collaborate on '{project.title}' on PayFlow AI",
        "invite_url": invite_url,
        "inviter_name": inviter.name,
        "project_title": project.title,
        "budget": project.budget,
        "currency": project.currency,
        "message": f"{inviter.name} has invited you to collaborate on '{project.title}'. Review deliverables, accept terms, and fund advance payment securely via PayPal."
    }

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="INVITATION_ISSUED",
        actor_id=inviter.id,
        actor_name=inviter.name,
        actor_role=inviter.role,
        details={
            "invitation_id": invitation.id,
            "invitee_email": req.invitee_email,
            "role": req.role,
            "token": token,
            "expires_at": expires_at.isoformat()
        }
    )

    return {
        "invitation": InvitationResponse.model_validate(invitation),
        "invite_url": invite_url,
        "email_preview": email_preview,
        "delivery_status": "SENT" if req.invitee_email else "LINK_GENERATED"
    }

@router.get("/{token}")
def get_invitation_details(token: str, db: Session = Depends(get_db)):
    """Retrieve invitation details by token along with the associated project and terms."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation token invalid or expired")

    # Check expiration
    if datetime.datetime.utcnow() > invitation.expires_at and invitation.status == "PENDING":
        invitation.status = "EXPIRED"
        db.commit()

    project = db.query(Project).filter(Project.id == invitation.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Associated project not found")

    inviter = db.query(User).filter(User.id == invitation.inviter_id).first()

    latest_contract = project.contracts[-1] if project.contracts else None

    milestones_detail = []
    for m in project.milestones:
        milestones_detail.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "amount": m.amount,
            "currency": m.currency,
            "order_index": m.order_index,
            "due_date": m.due_date,
            "status": m.status,
            "criteria": [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description,
                    "verification_type": c.verification_type
                }
                for c in m.criteria
            ]
        })

    comments_detail = []
    if latest_contract and latest_contract.comments:
        for cm in latest_contract.comments:
            comments_detail.append({
                "id": cm.id,
                "author_name": cm.author_name,
                "author_role": cm.author_role,
                "message": cm.message,
                "comment_type": cm.comment_type,
                "created_at": cm.created_at.isoformat()
            })

    return {
        "id": invitation.id,
        "token": invitation.token,
        "status": invitation.status,
        "role": invitation.role,
        "invitee_email": invitation.invitee_email,
        "expires_at": invitation.expires_at.isoformat(),
        "created_at": invitation.created_at.isoformat(),
        "inviter": {
            "id": inviter.id if inviter else None,
            "name": inviter.name if inviter else "Collaborator",
            "role": inviter.role if inviter else "user"
        },
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "budget": project.budget,
            "advance_amount": project.advance_amount,
            "held_balance": project.held_balance,
            "currency": project.currency,
            "status": project.status,
            "milestones_count": len(project.milestones),
            "contracts_count": len(project.contracts),
            "milestones": milestones_detail,
            "latest_contract": {
                "id": latest_contract.id,
                "version": latest_contract.version,
                "content_markdown": latest_contract.content_markdown,
                "status": latest_contract.status,
                "is_on_hold": latest_contract.is_on_hold,
                "hold_reason": latest_contract.hold_reason,
                "comments": comments_detail
            } if latest_contract else None
        }
    }

@router.post("/{token}/accept")
def accept_invitation(token: str, req: InvitationAcceptRequest, db: Session = Depends(get_db)):
    """Accept an invitation to join the project as client or freelancer."""
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.status == "ACCEPTED":
        return {"status": "ALREADY_ACCEPTED", "project_id": invitation.project_id}

    if invitation.status == "EXPIRED" or datetime.datetime.utcnow() > invitation.expires_at:
        raise HTTPException(status_code=400, detail="This invitation has expired")

    project = db.query(Project).filter(Project.id == invitation.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Find or create accepting user
    user = None
    if req.user_id:
        user = db.query(User).filter(User.id == req.user_id).first()
    elif req.email:
        user = db.query(User).filter(User.id == req.email).first()
        if not user:
            user = db.query(User).filter(User.email == req.email).first()
        if not user:
            user = User(
                email=req.email,
                name=req.name or req.email.split("@")[0].title(),
                role=invitation.role
            )
            db.add(user)
            db.flush()

    if not user:
        raise HTTPException(status_code=400, detail="Accepting user information required")

    # Bind user to project
    if invitation.role == "freelancer":
        project.freelancer_id = user.id
    elif invitation.role == "client":
        project.client_id = user.id

    invitation.status = "ACCEPTED"
    invitation.accepted_at = datetime.datetime.utcnow()

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="INVITATION_ACCEPTED",
        actor_id=user.id,
        actor_name=user.name,
        actor_role=invitation.role,
        details={
            "invitation_id": invitation.id,
            "token": token,
            "joined_role": invitation.role,
            "user_email": user.email
        }
    )

    db.commit()
    db.refresh(project)

    return {
        "status": "ACCEPTED",
        "project_id": project.id,
        "role": invitation.role,
        "user_id": user.id,
        "message": f"Successfully joined '{project.title}' as {invitation.role}."
    }

