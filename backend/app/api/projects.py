from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Project, User, AuditEvent, Invitation
from ..schemas import ProjectCreate, ProjectResponse
from ..agents import trust_auditor
import secrets
import datetime

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(role: str = None, user_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if user_id:
        if role == "freelancer":
            query = query.filter(Project.freelancer_id == user_id)
        elif role == "client":
            query = query.filter(Project.client_id == user_id)
    return query.order_by(Project.created_at.desc()).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=ProjectResponse)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    # Verify client exists or auto-create default client
    client = db.query(User).filter(User.id == project_in.client_id).first()
    if not client:
        # Check if any client exists
        client = db.query(User).filter(User.role == "client").first()
        if not client:
            client = User(
                id=project_in.client_id or "user-client-001",
                name="Alex Rivera",
                email="alex@acmestudio.io",
                role="client"
            )
            db.add(client)
            db.commit()
            db.refresh(client)

    freelancer = None
    if project_in.freelancer_id:
        freelancer = db.query(User).filter(User.id == project_in.freelancer_id).first()
    if not freelancer and not project_in.invitee_email:
        freelancer = db.query(User).filter(User.role == "freelancer").first()

    budget = float(project_in.budget or 1000.0)
    advance_amount = float(project_in.advance_amount) if project_in.advance_amount and project_in.advance_amount > 0 else round(budget * 0.30, 2)
    held_balance = float(project_in.held_balance) if project_in.held_balance and project_in.held_balance > 0 else round(budget - advance_amount, 2)

    project = Project(
        client_id=client.id,
        freelancer_id=freelancer.id if freelancer else None,
        title=project_in.title,
        description=project_in.description,
        category=project_in.category,
        budget=budget,
        advance_amount=advance_amount,
        held_balance=held_balance,
        advance_status="PENDING",
        held_balance_status="UNFUNDED",
        currency=project_in.currency,
        status="CONTRACT_PENDING"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # If invitee email was provided, automatically generate invitation
    if project_in.invitee_email:
        token = secrets.token_urlsafe(24)
        invitation = Invitation(
            project_id=project.id,
            inviter_id=client.id,
            invitee_email=project_in.invitee_email,
            role=project_in.invite_role or "freelancer",
            token=token,
            status="PENDING",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.add(invitation)
        project.invitation_token = token
        db.commit()
        db.refresh(project)

    # Record genesis audit event
    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="PROJECT_CREATED",
        actor_id=client.id,
        actor_name=client.name,
        actor_role="client",
        details={
            "title": project.title,
            "budget": project.budget,
            "advance_amount": project.advance_amount,
            "held_balance": project.held_balance,
            "currency": project.currency,
            "invited_email": project_in.invitee_email
        }
    )

    return project

