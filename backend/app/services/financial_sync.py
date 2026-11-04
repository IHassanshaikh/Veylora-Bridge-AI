import re
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import Project, Contract, Milestone, AcceptanceCriterion, Invoice, ContractComment
from .invoice_service import invoice_service
from ..agents import trust_auditor

def extract_financials_from_markdown(content_markdown: str, fallback_budget: float = 1000.0) -> Dict[str, Any]:
    """
    Intelligently extracts financial parameters and milestone breakdown from contract markdown:
    - Total agreed project budget
    - Upfront kickoff advance deposit
    - Secured held escrow balance
    - Granular milestone list with amounts and criteria
    """
    text = content_markdown or ""

    # 1. Parse Milestones: ### Title (USD 1,234.56) or ### Title ($1234.56)
    milestone_matches = list(re.finditer(
        r'###\s+([^\n(]+?)\s*\((?:USD|\$)?\s*([\d,]+(?:\.\d+)?)\)',
        text,
        re.IGNORECASE
    ))

    parsed_milestones: List[Dict[str, Any]] = []
    for idx, match in enumerate(milestone_matches):
        raw_title = match.group(1).strip()
        raw_amt = match.group(2).replace(',', '')
        try:
            amt = float(raw_amt)
        except ValueError:
            amt = 0.0

        # Extract text between this milestone and next milestone
        start_pos = match.end()
        end_pos = milestone_matches[idx + 1].start() if idx + 1 < len(milestone_matches) else len(text)
        block_text = text[start_pos:end_pos].strip()

        # Split into description and criteria
        desc = ""
        criteria = []
        if "**Acceptance Criteria:**" in block_text:
            parts = block_text.split("**Acceptance Criteria:**", 1)
            desc = parts[0].strip()
            criteria_text = parts[1].strip()
            # Parse criteria lines: - `[VERIFICATION_TYPE]` **Title**: Description
            crit_matches = re.finditer(
                r'-\s*(?:`\[([A-Z_]+)\]`|\[([A-Z_]+)\])?\s*\*\*([^*]+)\*\*:\s*([^\n]+)',
                criteria_text
            )
            for cm in crit_matches:
                vtype = cm.group(1) or cm.group(2) or "BROWSER_INTERACTION"
                c_title = cm.group(3).strip()
                c_desc = cm.group(4).strip()
                criteria.append({
                    "title": c_title,
                    "description": c_desc,
                    "verification_type": vtype
                })
        else:
            desc = block_text

        parsed_milestones.append({
            "title": raw_title,
            "amount": round(amt, 2),
            "description": desc,
            "criteria": criteria
        })

    # 2. Extract Explicit Budget from Terms / Summary
    budget_patterns = [
        r'(?:total\s+project\s+budget|total\s+agreed\s+value|total\s+budget|project\s+budget)\s*(?:is|:)?\s*(?:USD|\$)?\s*([\d,]+(?:\.\d+)?)',
        r'budget\s*(?:is|of|:)\s*(?:USD|\$)?\s*([\d,]+(?:\.\d+)?)',
        r'agreed\s+budget\s*(?:is|:)?\s*(?:USD|\$)?\s*([\d,]+(?:\.\d+)?)'
    ]
    explicit_budget = None
    for pat in budget_patterns:
        bm = re.search(pat, text, re.IGNORECASE)
        if bm:
            try:
                explicit_budget = float(bm.group(1).replace(',', ''))
                break
            except ValueError:
                pass

    # Sum of milestones
    milestones_total = sum(m["amount"] for m in parsed_milestones)

    # 3. Detect Kickoff Advance
    # Check if a milestone is designated as Advance / Kickoff / Confirmation
    advance_amount = 0.0
    advance_in_milestones = False
    for m in parsed_milestones:
        if any(w in m["title"].lower() for w in ["advance", "kickoff", "confirmation and advance", "project confirmation"]):
            advance_amount = m["amount"]
            advance_in_milestones = True
            break

    # If not found in milestones, check text
    if advance_amount == 0.0:
        adv_patterns = [
            r'(?:kickoff\s+advance|upfront\s+advance|kickoff\s+deposit|advance\s+payment|advance\s+deposit|advance)\s*(?:is|of|:)?\s*(?:USD|\$)?\s*([\d,]+(?:\.\d+)?)',
            r'(?:advance|kickoff)\s*(?:of)?\s*(\d+)%'
        ]
        for pat in adv_patterns:
            am = re.search(pat, text, re.IGNORECASE)
            if am:
                val = float(am.group(1).replace(',', ''))
                if "%" in pat or val < 100 and val <= 60 and explicit_budget:
                    # Percentage
                    advance_amount = round(explicit_budget * (val / 100.0), 2)
                else:
                    advance_amount = val
                break

    # 4. Resolve Final Total Budget
    if explicit_budget and explicit_budget > 0:
        total_budget = explicit_budget
    elif milestones_total > 0:
        # If advance was separate from milestones, budget = milestones_total + advance
        if not advance_in_milestones and advance_amount > 0 and milestones_total < advance_amount + 10:
            total_budget = round(milestones_total, 2)
        elif not advance_in_milestones and advance_amount > 0:
            total_budget = round(milestones_total + advance_amount, 2)
        else:
            total_budget = round(milestones_total, 2)
    else:
        total_budget = fallback_budget

    # If advance still 0 but budget > 0, check if we should keep 30% default or 0
    # If the user has distinct milestones summing to total_budget, and none says advance:
    if advance_amount == 0.0 and total_budget > 0:
        # If milestone 1 is setup or architecture, or if advance was specified on project
        advance_amount = 0.0

    # Ensure advance cannot exceed total_budget
    if advance_amount > total_budget:
        advance_amount = round(total_budget * 0.30, 2)

    held_balance = round(max(0.0, total_budget - advance_amount), 2)

    return {
        "budget": round(total_budget, 2),
        "advance_amount": round(advance_amount, 2),
        "held_balance": held_balance,
        "milestones_total": round(milestones_total, 2),
        "milestones": parsed_milestones
    }

def sync_contract_financials(db: Session, contract: Contract, actor_id: Optional[str] = None, actor_name: Optional[str] = None, actor_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Synchronizes financial extraction from contract markdown across:
    - Project entity (budget, advance_amount, held_balance)
    - Milestone entities (amounts, titles, descriptions, criteria)
    - Invoice entities (advance invoice INV-*-ADV, milestone invoices INV-*-M*)
    - Audit ledger & contract comments
    """
    project = contract.project
    if not project:
        return {}

    financials = extract_financials_from_markdown(contract.content_markdown, fallback_budget=project.budget or 1000.0)
    new_budget = financials["budget"]
    new_advance = financials["advance_amount"]
    new_held = financials["held_balance"]
    parsed_ms = financials["milestones"]

    old_budget = project.budget
    old_advance = project.advance_amount
    old_held = project.held_balance

    # 1. Update Project Financials
    project.budget = new_budget
    project.advance_amount = new_advance
    project.held_balance = new_held

    # 2. Update Milestones if parsed
    if parsed_ms:
        existing_milestones = db.query(Milestone).filter(Milestone.project_id == project.id).order_by(Milestone.order_index).all()
        
        # If count matches or we update in place
        for idx, m_data in enumerate(parsed_ms):
            if idx < len(existing_milestones):
                ms = existing_milestones[idx]
                ms.title = m_data["title"]
                ms.amount = m_data["amount"]
                if m_data["description"]:
                    ms.description = m_data["description"]
                ms.order_index = idx

                # Sync criteria if provided
                if m_data["criteria"]:
                    # Delete existing pending criteria and replace with updated
                    db.query(AcceptanceCriterion).filter(AcceptanceCriterion.milestone_id == ms.id).delete()
                    for crit_data in m_data["criteria"]:
                        crit = AcceptanceCriterion(
                            milestone_id=ms.id,
                            title=crit_data["title"],
                            description=crit_data["description"],
                            verification_type=crit_data.get("verification_type", "BROWSER_INTERACTION"),
                            status="PENDING"
                        )
                        db.add(crit)
            else:
                # Add new milestone
                new_ms = Milestone(
                    project_id=project.id,
                    title=m_data["title"],
                    description=m_data["description"] or f"Deliverable for {m_data['title']}",
                    amount=m_data["amount"],
                    currency=project.currency or "USD",
                    order_index=idx,
                    due_date=f"T+{7 * (idx + 1)} days",
                    status="PENDING"
                )
                db.add(new_ms)
                db.flush()

                for crit_data in m_data["criteria"]:
                    crit = AcceptanceCriterion(
                        milestone_id=new_ms.id,
                        title=crit_data["title"],
                        description=crit_data["description"],
                        verification_type=crit_data.get("verification_type", "BROWSER_INTERACTION"),
                        status="PENDING"
                    )
                    db.add(crit)

        # If there were extra existing milestones that are still PENDING, remove them to keep count consistent
        if len(existing_milestones) > len(parsed_ms):
            for extra_ms in existing_milestones[len(parsed_ms):]:
                if extra_ms.status == "PENDING":
                    db.delete(extra_ms)

    db.flush()

    # 3. Regenerate and Synchronize All Invoices
    synced_invoices = invoice_service.generate_project_invoices(db, project)

    # 4. Record Audit Trail
    audit_details = {
        "contract_id": contract.id,
        "contract_version": contract.version,
        "budget_before": old_budget,
        "budget_after": new_budget,
        "advance_before": old_advance,
        "advance_after": new_advance,
        "held_escrow_before": old_held,
        "held_escrow_after": new_held,
        "milestones_count": len(project.milestones),
        "invoices_count": len(synced_invoices)
    }

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="FINANCIALS_SYNCHRONIZED",
        actor_id=actor_id or "system",
        actor_name=actor_name or "Financial Auto-Sync Agent",
        actor_role=actor_role or "system",
        details=audit_details
    )

    db.commit()
    db.refresh(project)
    db.refresh(contract)

    return {
        "budget": new_budget,
        "advance_amount": new_advance,
        "held_balance": new_held,
        "milestones": [
            {"id": m.id, "title": m.title, "amount": m.amount, "status": m.status}
            for m in project.milestones
        ],
        "invoices": [
            {"id": inv.id, "invoice_number": inv.invoice_number, "amount": inv.amount, "status": inv.status}
            for inv in project.invoices
        ]
    }

