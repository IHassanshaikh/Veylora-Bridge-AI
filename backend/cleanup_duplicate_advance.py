from app.database import SessionLocal
from app.models import Project, Invoice, Milestone
from app.services.invoice_service import InvoiceService

def main():
    db = SessionLocal()
    try:
        projs = db.query(Project).all()
        for p in projs:
            m_sum = sum(m.amount for m in p.milestones) if p.milestones else 0.0
            print(f"Checking Project {p.id[:8]} ({p.title}): budget={p.budget}, m_sum={m_sum}, adv_amount={p.advance_amount}")
            
            # If milestones sum to the budget, delete the duplicate orphan INV-...-ADV
            adv_num = f"INV-{p.id[:6].upper()}-ADV"
            if m_sum >= p.budget:
                orphan = db.query(Invoice).filter(Invoice.project_id == p.id, Invoice.invoice_number == adv_num).first()
                if orphan:
                    print(f"  -> Removing duplicate advance invoice {orphan.invoice_number} (amount: {orphan.amount})")
                    db.delete(orphan)
                    db.commit()

            # Now run generate_project_invoices to ensure clean sequential state
            InvoiceService.generate_project_invoices(db, p)
            db.commit()
            
            clean_invoices = db.query(Invoice).filter(Invoice.project_id == p.id).order_by(Invoice.order_index).all()
            print(f"  -> Remaining clean invoices ({len(clean_invoices)}):")
            for inv in clean_invoices:
                print(f"     [{inv.invoice_number}] {inv.title} - ${inv.amount} ({inv.status})")

        print("Database invoices successfully cleaned and synchronized!")
    finally:
        db.close()

if __name__ == "__main__":
    main()

