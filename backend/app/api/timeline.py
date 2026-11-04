from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import AuditEvent, Project
from ..schemas import AuditEventResponse
from ..agents import trust_auditor

router = APIRouter(prefix="/timeline", tags=["Trust Timeline & Ledger"])

@router.get("/project/{project_id}", response_model=List[AuditEventResponse])
def get_project_timeline(project_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.project_id == project_id)
        .order_by(AuditEvent.timestamp.desc())
        .all()
    )
    return events

@router.get("/project/{project_id}/verify-ledger")
def verify_project_ledger_integrity(project_id: str, db: Session = Depends(get_db)):
    """Verifies the unbroken cryptographic SHA-256 hash chain of the project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    audit_result = trust_auditor.verify_ledger_integrity(db=db, project_id=project_id)
    return audit_result

