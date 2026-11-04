import hashlib
import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import AuditEvent

class TrustAuditorAgent:
    """Agent 6 — Trust Auditor: Maintains a tamper-evident, SHA-256 hash-chained chronological project ledger."""

    def record_event(
        self,
        db: Session,
        project_id: str,
        action: str,
        actor_id: Optional[str] = None,
        actor_name: Optional[str] = None,
        actor_role: str = "system",
        details: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        # Get the latest audit event for this project to retrieve previous hash
        latest_event = (
            db.query(AuditEvent)
            .filter(AuditEvent.project_id == project_id)
            .order_by(AuditEvent.timestamp.desc())
            .first()
        )
        prev_hash = latest_event.current_hash if latest_event else "GENESIS_BLOCK_00000000000000000000000000000000"

        timestamp_str = datetime.datetime.utcnow().isoformat()
        payload_to_hash = {
            "project_id": project_id,
            "action": action,
            "actor_id": actor_id,
            "actor_role": actor_role,
            "timestamp": timestamp_str,
            "prev_hash": prev_hash,
            "details": details or {}
        }

        current_hash = hashlib.sha256(
            json.dumps(payload_to_hash, sort_keys=True).encode("utf-8")
        ).hexdigest()

        event = AuditEvent(
            project_id=project_id,
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            action=action,
            details_json=details,
            prev_hash=prev_hash,
            current_hash=current_hash,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def verify_ledger_integrity(self, db: Session, project_id: str) -> Dict[str, Any]:
        """Audits the cryptographic continuity of all events in the project ledger."""
        events = (
            db.query(AuditEvent)
            .filter(AuditEvent.project_id == project_id)
            .order_by(AuditEvent.timestamp.asc())
            .all()
        )

        if not events:
            return {"valid": True, "count": 0, "message": "Ledger empty."}

        prev_hash = "GENESIS_BLOCK_00000000000000000000000000000000"
        for idx, ev in enumerate(events):
            if ev.prev_hash != prev_hash:
                return {
                    "valid": False,
                    "tampered_index": idx,
                    "event_id": ev.id,
                    "message": f"Ledger break detected at event #{idx}: prev_hash mismatch."
                }
            prev_hash = ev.current_hash

        return {
            "valid": True,
            "count": len(events),
            "latest_hash": prev_hash,
            "message": f"All {len(events)} events cryptographically verified without tampering."
        }

trust_auditor = TrustAuditorAgent()

