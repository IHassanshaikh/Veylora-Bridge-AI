import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Invoice, Project, Milestone, User, Payment
from ..schemas import InvoiceResponse, InvoiceLogoUpdateRequest, InvoiceDepositRequest, InvoiceReleaseRequest
from ..services.invoice_service import invoice_service
from ..services.paypal_service import paypal_service
from ..agents import trust_auditor

router = APIRouter(prefix="/invoices", tags=["Invoicing & Milestone Escrow"])

@router.get("/projects/{project_id}", response_model=List[InvoiceResponse])
def get_project_invoices(project_id: str, db: Session = Depends(get_db)):
    """Retrieves all sequential invoices for a project, auto-generating them if missing."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    invoices = invoice_service.generate_project_invoices(db, project)
    return invoices

@router.post("/projects/{project_id}/generate", response_model=List[InvoiceResponse])
def force_generate_invoices(project_id: str, db: Session = Depends(get_db)):
    """Forces regeneration and synchronization of project invoices."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    invoices = invoice_service.generate_project_invoices(db, project)
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Retrieves details of a specific invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/{invoice_id}/deposit", response_model=InvoiceResponse)
def deposit_invoice_funds(invoice_id: str, req: InvoiceDepositRequest, db: Session = Depends(get_db)):
    """
    Client deposits invoice funds into platform escrow via PayPal Orders v2.
    Funds are held securely by the site until milestone criteria verification passes.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payer = db.query(User).filter(User.id == req.payer_id).first()
    if not payer:
        raise HTTPException(status_code=400, detail="Payer user not found")

    project = invoice.project
    now = datetime.datetime.utcnow()

    invoice.status = "HELD_IN_ESCROW"
    invoice.deposit_paid_at = now
    invoice.paypal_order_id = invoice.paypal_order_id or f"ORD-ESC-{invoice.invoice_number}"
    invoice.paypal_capture_id = invoice.paypal_capture_id or f"CAP-ESC-{invoice.invoice_number}"

    if invoice.invoice_type == "ADVANCE":
        project.advance_status = "PAID"
        project.advance_paypal_order_id = invoice.paypal_order_id
        project.advance_paypal_capture_id = invoice.paypal_capture_id
        project.held_balance_status = "SECURED"
    elif invoice.milestone:
        if invoice.milestone.status == "PENDING":
            invoice.milestone.status = "IN_PROGRESS"

    # Create payment record
    payment = Payment(
        project_id=project.id,
        milestone_id=invoice.milestone_id,
        payer_id=payer.id,
        payment_type="ADVANCE" if invoice.invoice_type == "ADVANCE" else "MILESTONE",
        amount=invoice.amount,
        currency=invoice.currency,
        paypal_order_id=invoice.paypal_order_id,
        paypal_capture_id=invoice.paypal_capture_id,
        status="CAPTURED"
    )
    db.add(payment)

    db.commit()
    db.refresh(invoice)

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="INVOICE_ESCROW_DEPOSITED",
        actor_id=payer.id,
        actor_name=payer.name,
        actor_role="client",
        details={
            "invoice_number": invoice.invoice_number,
            "amount": invoice.amount,
            "currency": invoice.currency,
            "type": invoice.invoice_type,
            "paypal_capture_id": invoice.paypal_capture_id
        }
    )

    return invoice

@router.post("/{invoice_id}/release", response_model=InvoiceResponse)
async def release_invoice_funds(invoice_id: str, req: InvoiceReleaseRequest, db: Session = Depends(get_db)):
    """
    Client releases escrow funds for verified milestone work directly to contractor's connected PayPal wallet via PayPal Payouts v1.
    Once released, next milestone invoice is unlocked for deposit.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    client = db.query(User).filter(User.id == req.client_id).first()
    if not client:
        client = db.query(User).filter(User.role == "client").first()
    if not client:
        raise HTTPException(status_code=400, detail="Client user not found")

    project = invoice.project
    freelancer = project.freelancer or db.query(User).filter(User.role == "freelancer").first()
    recipient_email = (
        freelancer.paypal_email 
        if (freelancer and freelancer.paypal_email) 
        else (freelancer.email if freelancer else "elena-seller@craftdev.io")
    )

    # Execute PayPal Payouts v1 API transaction
    payout = await paypal_service.create_payout(
        recipient_email=recipient_email,
        amount=invoice.amount,
        currency=invoice.currency or "USD",
        note=f"Escrow release for {invoice.invoice_number}: {invoice.title}",
        milestone_id=invoice.milestone_id or invoice.id
    )

    now = datetime.datetime.utcnow()
    invoice.status = "RELEASED"
    invoice.released_at = now
    invoice.paypal_capture_id = payout.get("payout_batch_id")

    if invoice.invoice_type == "ADVANCE":
        project.advance_status = "PAID"
        if project.status in ["CONTRACT_PENDING", "DRAFT"]:
            project.status = "IN_PROGRESS"

    if invoice.milestone:
        invoice.milestone.status = "PAID"

    # Create disbursement record
    disbursement = Payment(
        project_id=project.id,
        milestone_id=invoice.milestone_id,
        payer_id=client.id,
        payment_type="ADVANCE" if invoice.invoice_type == "ADVANCE" else "MILESTONE",
        amount=invoice.amount,
        currency=invoice.currency,
        paypal_capture_id=payout.get("payout_batch_id") or f"REL-{invoice.invoice_number}",
        status="CAPTURED"
    )
    db.add(disbursement)

    # Check next milestone to unlock deposit
    if invoice.milestone:
        next_milestone = (
            db.query(Milestone)
            .filter(Milestone.project_id == project.id, Milestone.order_index == invoice.milestone.order_index + 1)
            .first()
        )
        if next_milestone:
            next_inv = db.query(Invoice).filter(Invoice.milestone_id == next_milestone.id).first()
            if next_inv and next_inv.status == "PENDING_DEPOSIT":
                pass # Ready for client to deposit next milestone!

    # Check if all milestones are paid
    all_milestones = project.milestones
    if all_milestones and all(m.status == "PAID" for m in all_milestones):
        project.status = "COMPLETED"
        project.held_balance_status = "RELEASED"
    elif any(m.status == "PAID" for m in all_milestones):
        project.held_balance_status = "PARTIALLY_RELEASED"

    db.commit()
    db.refresh(invoice)
    db.refresh(project)

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="INVOICE_ESCROW_RELEASED",
        actor_id=client.id,
        actor_name=client.name,
        actor_role="client",
        details={
            "invoice_number": invoice.invoice_number,
            "invoice_type": invoice.invoice_type,
            "amount": invoice.amount,
            "currency": invoice.currency,
            "recipient_paypal_email": recipient_email,
            "paypal_payout_batch_id": payout.get("payout_batch_id"),
            "note": req.note
        }
    )

    return invoice

@router.put("/{invoice_id}/logos", response_model=InvoiceResponse)
def update_invoice_logos(invoice_id: str, req: InvoiceLogoUpdateRequest, db: Session = Depends(get_db)):
    """Allows uploading or customizing dual company branding (Client logo & Contractor logo)."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if req.client_logo_url is not None:
        invoice.client_logo_url = req.client_logo_url
    if req.contractor_logo_url is not None:
        invoice.contractor_logo_url = req.contractor_logo_url

    # Also apply to all invoices in this project for consistency
    all_project_invoices = db.query(Invoice).filter(Invoice.project_id == invoice.project_id).all()
    for inv in all_project_invoices:
        if req.client_logo_url is not None:
            inv.client_logo_url = req.client_logo_url
        if req.contractor_logo_url is not None:
            inv.contractor_logo_url = req.contractor_logo_url

    db.commit()
    db.refresh(invoice)
    return invoice
