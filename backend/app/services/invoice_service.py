import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models import Project, Milestone, Invoice, Payment, User
from ..agents import trust_auditor

class InvoiceService:
    @staticmethod
    def generate_project_invoices(db: Session, project: Project) -> List[Invoice]:
        """
        Generates or syncs sequential invoices for a project:
        - If milestones already cover 100% of the budget, Milestone 1 is the kickoff deliverable.
          We avoid creating a duplicate extra advance invoice so payments are not shown 2 times.
        - If milestones do not sum to full budget, an Upfront Kickoff Advance invoice is generated for the difference.
        - Preserves RELEASED status so disbursed invoices never revert back to HELD_IN_ESCROW.
        """
        existing_invoices = {inv.invoice_number: inv for inv in project.invoices}
        generated = []
        
        milestones_sum = sum(m.amount for m in project.milestones) if project.milestones else 0.0
        adv_num = f"INV-{project.id[:6].upper()}-ADV"
        
        # Only create a separate ADV invoice if milestones do not already cover the entire project budget
        # or if there are no milestones defined yet.
        has_separate_advance = (
            project.advance_amount and project.advance_amount > 0 and 
            (not project.milestones or milestones_sum < project.budget)
        )

        if has_separate_advance:
            adv_inv = existing_invoices.get(adv_num)
            
            # Determine correct status (never overwrite RELEASED)
            if adv_inv and (adv_inv.status == "RELEASED" or adv_inv.released_at):
                adv_status = "RELEASED"
            elif project.advance_status == "PAID":
                adv_status = "HELD_IN_ESCROW"
            else:
                adv_status = "PENDING_DEPOSIT"
            
            if not adv_inv:
                adv_inv = Invoice(
                    project_id=project.id,
                    milestone_id=None,
                    invoice_number=adv_num,
                    invoice_type="ADVANCE",
                    title="Upfront Kickoff Advance Deposit",
                    description=f"Initial mobilization deposit to activate project development for: {project.title}",
                    amount=project.advance_amount,
                    currency=project.currency,
                    order_index=0,
                    due_date="Immediate (Before Work Commences)",
                    status=adv_status,
                    paypal_order_id=project.advance_paypal_order_id,
                    paypal_capture_id=project.advance_paypal_capture_id,
                    deposit_paid_at=datetime.datetime.utcnow() if project.advance_status == "PAID" else None,
                    platform_logo_url="/veylora-logo.png",
                    line_items_json=[
                        {
                            "description": "Upfront Mobilization & Architecture Setup",
                            "type": "Kickoff Advance",
                            "amount": project.advance_amount
                        }
                    ],
                    notes="Funds are held securely by Veylora Bridge escrow and authorized via PayPal Orders v2."
                )
                db.add(adv_inv)
            else:
                adv_inv.amount = project.advance_amount
                adv_inv.status = adv_status
                adv_inv.paypal_order_id = project.advance_paypal_order_id or adv_inv.paypal_order_id
                adv_inv.paypal_capture_id = project.advance_paypal_capture_id or adv_inv.paypal_capture_id
                if project.advance_status == "PAID" and not adv_inv.deposit_paid_at:
                    adv_inv.deposit_paid_at = datetime.datetime.utcnow()
            generated.append(adv_inv)
        else:
            # If an extra duplicate ADV invoice exists from before, remove it to prevent showing advance 2 times
            orphan_adv = existing_invoices.get(adv_num)
            if orphan_adv:
                db.delete(orphan_adv)
                db.flush()

        # 2. Milestone Deliverable Invoices
        import re
        for idx, m in enumerate(project.milestones):
            m_num = f"INV-{project.id[:6].upper()}-M{idx + 1}"
            
            # Clean up milestone title to avoid duplicate "Milestone 1: Milestone 1: ..."
            raw_title = (m.title or f"Deliverable {idx + 1}").strip()
            clean_title = re.sub(r"^(Milestone\s*\d+\s*:\s*)+", "", raw_title, flags=re.IGNORECASE).strip()
            final_title = f"Milestone {idx + 1}: {clean_title}"

            # Determine status based on milestone state and sequential escrow flow
            if m.status == "PAID":
                m_status = "RELEASED"
            elif m.status == "DISPUTED":
                m_status = "FROZEN_IN_DISPUTE"
            elif idx == 0 and (project.advance_status == "PAID" or project.held_balance_status == "SECURED"):
                # 1st milestone is held in escrow if paid or secured
                m_status = "HELD_IN_ESCROW"
            else:
                m_status = "PENDING_DEPOSIT"

            m_inv = existing_invoices.get(m_num)
            if not m_inv:
                m_inv = Invoice(
                    project_id=project.id,
                    milestone_id=m.id,
                    invoice_number=m_num,
                    invoice_type="MILESTONE",
                    title=final_title,
                    description=m.description or f"Acceptance criteria deliverables for {clean_title}",
                    amount=m.amount,
                    currency=m.currency,
                    order_index=idx + 1,
                    due_date=m.due_date or f"T+{7 * (idx + 1)} days",
                    status=m_status,
                    platform_logo_url="/veylora-logo.png",
                    line_items_json=[
                        {
                            "description": f"{final_title} — Verified by Playwright Suite",
                            "type": "Kickoff Advance Deliverable" if idx == 0 else "Milestone Deliverable",
                            "amount": m.amount
                        }
                    ],
                    notes="Payment releases automatically upon passing headless browser acceptance criteria verification."
                )
                db.add(m_inv)
            else:
                m_inv.amount = m.amount
                m_inv.status = m_status
                m_inv.title = final_title
                m_inv.description = m.description or f"Acceptance criteria deliverables for {clean_title}"
                m_inv.line_items_json = [
                    {
                        "description": f"{final_title} — Verified by Playwright Suite",
                        "type": "Kickoff Advance Deliverable" if idx == 0 else "Milestone Deliverable",
                        "amount": m.amount
                    }
                ]
            generated.append(m_inv)

        db.commit()
        for inv in generated:
            db.refresh(inv)
        return generated

invoice_service = InvoiceService()
