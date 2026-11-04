from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Milestone, Submission, AcceptanceCriterion, Project, User
from ..schemas import MilestoneResponse, SubmissionCreate, SubmissionResponse
from ..agents import trust_auditor

router = APIRouter(prefix="/milestones", tags=["Milestones"])

@router.get("/project/{project_id}", response_model=List[MilestoneResponse])
def get_project_milestones(project_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.order_index.asc())
        .all()
    )

@router.get("/{milestone_id}", response_model=MilestoneResponse)
def get_milestone(milestone_id: str, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone

@router.post("/{milestone_id}/submit", response_model=SubmissionResponse)
def submit_milestone_work(milestone_id: str, sub_in: SubmissionCreate, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    submission = Submission(
        milestone_id=milestone_id,
        freelancer_id=sub_in.freelancer_id,
        repository_url=sub_in.repository_url,
        deployment_url=sub_in.deployment_url,
        commit_hash=sub_in.commit_hash or "a1b2c3d4",
        notes=sub_in.notes
    )
    db.add(submission)
    milestone.status = "SUBMITTED"
    db.commit()
    db.refresh(submission)

    freelancer = db.query(User).filter(User.id == sub_in.freelancer_id).first() if sub_in.freelancer_id else None

    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="WORK_SUBMITTED",
        actor_id=sub_in.freelancer_id,
        actor_name=freelancer.name if freelancer else "Freelancer",
        actor_role="freelancer",
        details={
            "milestone_title": milestone.title,
            "deployment_url": submission.deployment_url,
            "repository_url": submission.repository_url
        }
    )

    return submission

@router.post("/{milestone_id}/approve", response_model=MilestoneResponse)
def approve_milestone(milestone_id: str, client_id: str, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    client = db.query(User).filter(User.id == client_id).first()
    milestone.status = "APPROVED"
    db.commit()
    db.refresh(milestone)

    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="MILESTONE_APPROVED_BY_CLIENT",
        actor_id=client_id,
        actor_name=client.name if client else "Client",
        actor_role="client",
        details={"milestone_title": milestone.title, "amount": milestone.amount}
    )

    return milestone

