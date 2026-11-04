import os
import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..models import Milestone, Submission, AcceptanceCriterion, VerificationRun, VerificationResult, Evidence
from ..schemas import VerificationRunResponse
from ..services.playwright_runner import playwright_runner, EVIDENCE_DIR
from ..agents import work_inspector, trust_auditor

router = APIRouter(prefix="/verifications", tags=["Proof of Work Engine"])

@router.post("/start", response_model=VerificationRunResponse)
async def start_verification(milestone_id: str, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    submission = (
        db.query(Submission)
        .filter(Submission.milestone_id == milestone_id)
        .order_by(Submission.submitted_at.desc())
        .first()
    )
    if not submission:
        raise HTTPException(status_code=400, detail="No submission found for this milestone")

    criteria = db.query(AcceptanceCriterion).filter(AcceptanceCriterion.milestone_id == milestone_id).all()
    if not criteria:
        raise HTTPException(status_code=400, detail="No criteria found to verify")

    milestone.status = "VERIFYING"
    db.commit()

    # Create verification run record
    run = VerificationRun(
        submission_id=submission.id,
        status="RUNNING",
        started_at=datetime.datetime.utcnow()
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Format criteria for runner
    crit_payload = [
        {
            "id": c.id,
            "title": c.title,
            "verification_type": c.verification_type,
            "test_config_json": c.test_config_json or {}
        }
        for c in criteria
    ]

    # Execute Proof of Work testing
    raw_results = await playwright_runner.run_verification(
        submission_url=submission.deployment_url,
        criteria=crit_payload
    )

    # Process and record evidence and outcomes
    passed_cnt = 0
    failed_cnt = 0
    review_cnt = 0

    for res in raw_results:
        # Create Evidence record
        ev = Evidence(
            verification_run_id=run.id,
            file_path=res["evidence_path"],
            file_name=res["evidence_file"],
            file_type="image/png",
            sha256_hash=res["sha256_hash"],
            metadata_json={"url": submission.deployment_url, "criterion_id": res["criterion_id"]},
            captured_at=datetime.datetime.utcnow()
        )
        db.add(ev)
        db.flush()

        # Create VerificationResult record
        outcome = res["outcome"]
        if outcome == "PASS":
            passed_cnt += 1
            crit_status = "PASSED"
        elif outcome == "FAIL":
            failed_cnt += 1
            crit_status = "FAILED"
        else:
            review_cnt += 1
            crit_status = "NEEDS_REVIEW"

        v_result = VerificationResult(
            run_id=run.id,
            criterion_id=res["criterion_id"],
            outcome=outcome,
            details=res["details"],
            execution_time_ms=res["execution_time_ms"],
            evidence_id=ev.id
        )
        db.add(v_result)

        # Update criterion entity status
        matched_c = next((c for c in criteria if c.id == res["criterion_id"]), None)
        if matched_c:
            matched_c.status = crit_status

    # Agent 3: Work Inspector synthesizes the verifiable findings
    inspection = await work_inspector.inspect(
        submission_url=submission.deployment_url,
        test_results=raw_results
    )

    run.status = "COMPLETED"
    run.completed_at = datetime.datetime.utcnow()
    run.summary = inspection.get("summary")
    run.ai_analysis = inspection.get("summary")
    run.passed_count = passed_cnt
    run.failed_count = failed_cnt
    run.review_count = review_cnt

    # Update milestone overall status
    if failed_cnt == 0 and review_cnt == 0:
        milestone.status = "VERIFIED"
    else:
        milestone.status = "IN_PROGRESS"

    db.commit()
    db.refresh(run)

    # Record tamper-evident audit event
    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="PROOF_OF_WORK_VERIFICATION_COMPLETED",
        actor_role="ai",
        details={
            "run_id": run.id,
            "passed": passed_cnt,
            "failed": failed_cnt,
            "readiness": inspection.get("readiness"),
            "summary": run.summary
        }
    )

    return run

@router.get("/{run_id}", response_model=VerificationRunResponse)
def get_verification_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(VerificationRun).filter(VerificationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Verification run not found")
    return run

@router.get("/evidence/file/{file_name}")
def serve_evidence_screenshot(file_name: str):
    file_path = os.path.join(EVIDENCE_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found")
    return FileResponse(file_path, media_type="image/png")

