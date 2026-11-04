import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..database import get_db
from ..models import Milestone, Payment, User, AcceptanceCriterion, Project, Invoice
from ..schemas import (
    PayPalCreateOrderRequest, PayPalCaptureOrderRequest, PaymentResponse,
    PayPalCreateAdvanceOrderRequest, PayPalCaptureAdvanceOrderRequest,
    MilestoneReleaseRequest, PaymentExplanationRequest
)
from ..agents import payment_coordinator, payment_explanation_assistant, trust_auditor
from ..services.paypal_service import paypal_service

router = APIRouter(prefix="/payments", tags=["PayPal Payments"])

@router.post("/advance/create-order")
async def create_paypal_advance_order(req: PayPalCreateAdvanceOrderRequest, db: Session = Depends(get_db)):
    """Creates a PayPal Orders v2 transaction for the project's upfront advance payment."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.advance_status == "PAID":
        raise HTTPException(status_code=400, detail="Advance payment has already been paid for this project.")

    advance_amount = project.advance_amount if project.advance_amount > 0 else round(project.budget * 0.30, 2)
    payer = db.query(User).filter(User.id == req.payer_id).first()
    if not payer:
        raise HTTPException(status_code=400, detail="Payer user not found")

    order_data = await paypal_service.create_order(
        milestone_id=f"adv-{project.id}",
        amount=advance_amount,
        currency=project.currency,
        description=f"TrustBridge Kickoff Advance: {project.title}"
    )

    payment = Payment(
        project_id=project.id,
        milestone_id=None,
        payer_id=req.payer_id,
        payment_type="ADVANCE",
        amount=advance_amount,
        currency=project.currency,
        paypal_order_id=order_data.get("order_id"),
        status="CREATED"
    )
    db.add(payment)
    project.advance_paypal_order_id = order_data.get("order_id")
    db.commit()
    db.refresh(payment)

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="PAYPAL_ADVANCE_ORDER_CREATED",
        actor_id=payer.id,
        actor_name=payer.name,
        actor_role="client",
        details={
            "paypal_order_id": payment.paypal_order_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "is_simulation": order_data.get("is_simulation", False)
        }
    )

    return {
        "payment_id": payment.id,
        "paypal_order_id": payment.paypal_order_id,
        "status": payment.status,
        "amount": payment.amount,
        "currency": payment.currency,
        "links": order_data.get("links", []),
        "is_simulation": order_data.get("is_simulation", False)
    }

@router.post("/advance/capture-order")
async def capture_paypal_advance_order(req: PayPalCaptureAdvanceOrderRequest, db: Session = Depends(get_db)):
    """Captures the PayPal Orders v2 transaction for upfront advance deposit, securing the escrow balance."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    payment = (
        db.query(Payment)
        .filter(Payment.paypal_order_id == req.paypal_order_id)
        .first()
    )
    if not payment:
        payment = (
            db.query(Payment)
            .filter(Payment.project_id == project.id, Payment.payment_type == "ADVANCE")
            .order_by(Payment.created_at.desc())
            .first()
        )

    if not payment:
        raise HTTPException(status_code=404, detail="Advance payment record not found")

    capture_data = await paypal_service.capture_order(order_id=req.paypal_order_id)

    payment.paypal_capture_id = capture_data.get("capture_id")
    payment.status = "CAPTURED"
    payment.updated_at = datetime.datetime.utcnow()

    project.advance_status = "PAID"
    project.advance_paypal_capture_id = payment.paypal_capture_id
    project.held_balance_status = "SECURED"
    if project.status in ["DRAFT", "CONTRACT_PENDING"]:
        project.status = "IN_PROGRESS"

    db.commit()
    db.refresh(project)

    payer = db.query(User).filter(User.id == payment.payer_id).first()
    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="ADVANCE_PAYMENT_CAPTURED",
        actor_id=payment.payer_id,
        actor_name=payer.name if payer else "Client",
        actor_role="client",
        details={
            "paypal_order_id": payment.paypal_order_id,
            "paypal_capture_id": payment.paypal_capture_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "held_balance_secured": project.held_balance
        }
    )

    return {
        "status": "CAPTURED",
        "project_id": project.id,
        "advance_status": project.advance_status,
        "held_balance_status": project.held_balance_status,
        "payment": PaymentResponse.model_validate(payment)
    }

async def _release_invoice_direct(invoice: Invoice, client_id: str, release_note: str | None, db: Session):
    client = db.query(User).filter(User.id == client_id).first()
    if not client:
        client = db.query(User).filter(User.role == "client").first()
    if not client:
        raise HTTPException(status_code=400, detail="Client user not found")

    project = invoice.project
    if not project:
        raise HTTPException(status_code=404, detail="Associated project not found")

    freelancer = project.freelancer or db.query(User).filter(User.role == "freelancer").first()
    recipient_email = (
        freelancer.paypal_email 
        if (freelancer and freelancer.paypal_email) 
        else (freelancer.email if freelancer else "elena-seller@craftdev.io")
    )

    payout = await paypal_service.create_payout(
        recipient_email=recipient_email,
        amount=invoice.amount,
        currency=invoice.currency or "USD",
        note=f"Veylora Escrow release: {invoice.title} ({invoice.invoice_number})",
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

    disbursement = Payment(
        project_id=project.id,
        milestone_id=invoice.milestone_id,
        payer_id=client.id,
        payment_type="ADVANCE" if invoice.invoice_type == "ADVANCE" else "MILESTONE",
        amount=invoice.amount,
        currency=invoice.currency,
        status="CAPTURED",
        paypal_capture_id=payout.get("payout_batch_id") or f"DISBURSE-{invoice.invoice_number}"
    )
    db.add(disbursement)

    next_invoice = (
        db.query(Invoice)
        .filter(Invoice.project_id == project.id, Invoice.status == "PENDING_DEPOSIT")
        .order_by(Invoice.order_index)
        .first()
    )

    all_milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
    if all_milestones and all(m.status == "PAID" for m in all_milestones):
        project.status = "COMPLETED"
        project.held_balance_status = "RELEASED"
    elif any(m.status == "PAID" for m in all_milestones):
        project.held_balance_status = "PARTIALLY_RELEASED"

    db.commit()
    db.refresh(project)

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="ESCROW_FUNDS_DISBURSED",
        actor_id=client.id,
        actor_name=client.name,
        actor_role="client",
        details={
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "invoice_type": invoice.invoice_type,
            "disbursed_amount": invoice.amount,
            "currency": invoice.currency,
            "recipient_paypal_email": recipient_email,
            "paypal_payout_batch_id": payout.get("payout_batch_id"),
            "note": release_note
        }
    )

    return {
        "status": "SUCCESS",
        "milestone_status": "PAID",
        "disbursed_amount": invoice.amount,
        "currency": invoice.currency or "USD",
        "recipient_paypal_email": recipient_email,
        "contractor_name": freelancer.name if freelancer else "Contractor",
        "payout_batch_id": payout.get("payout_batch_id"),
        "payout_item_id": payout.get("payout_item_id"),
        "disbursed_at": payout.get("disbursed_at"),
        "project_status": project.status,
        "held_balance_status": project.held_balance_status,
        "next_invoice": {
            "id": next_invoice.id,
            "invoice_number": next_invoice.invoice_number,
            "amount": next_invoice.amount,
            "title": next_invoice.title
        } if next_invoice else None
    }

@router.post("/milestones/release")
async def release_milestone_funds(req: MilestoneReleaseRequest, db: Session = Depends(get_db)):
    """Releases milestone funds OR advance invoice funds from held escrow whenever the client authorizes release."""
    milestone = db.query(Milestone).filter(Milestone.id == req.milestone_id).first()
    if not milestone:
        # Check if ID is an Invoice ID (e.g. advance invoice INV-... or UUID)
        invoice = db.query(Invoice).filter(Invoice.id == req.milestone_id).first()
        if invoice:
            return await _release_invoice_direct(invoice, req.client_id, req.release_note, db)
        
        # Check if ID is a Project ID (e.g. release project advance or first held invoice)
        project = db.query(Project).filter(Project.id == req.milestone_id).first()
        if project:
            held_inv = (
                db.query(Invoice)
                .filter(Invoice.project_id == project.id, Invoice.status == "HELD_IN_ESCROW")
                .first()
            )
            if not held_inv:
                held_inv = (
                    db.query(Invoice)
                    .filter(Invoice.project_id == project.id, Invoice.invoice_type == "ADVANCE")
                    .first()
                )
            if held_inv:
                return await _release_invoice_direct(held_inv, req.client_id, req.release_note, db)

        raise HTTPException(status_code=404, detail="Milestone or Invoice not found")

    client = db.query(User).filter(User.id == req.client_id).first()
    if not client:
        client = db.query(User).filter(User.role == "client").first()
    if not client:
        raise HTTPException(status_code=400, detail="Client user not found")

    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Associated project not found")

    # Look up contractor's connected PayPal account
    freelancer = project.freelancer or db.query(User).filter(User.role == "freelancer").first()
    recipient_email = (
        freelancer.paypal_email 
        if (freelancer and freelancer.paypal_email) 
        else (freelancer.email if freelancer else "elena-seller@craftdev.io")
    )

    # Execute PayPal Payouts v1 API transaction
    payout = await paypal_service.create_payout(
        recipient_email=recipient_email,
        amount=milestone.amount,
        currency=milestone.currency or "USD",
        note=f"Veylora Escrow release: {milestone.title}",
        milestone_id=milestone.id
    )

    milestone.status = "PAID"

    # Create disbursement payment record
    disbursement = Payment(
        project_id=project.id,
        milestone_id=milestone.id,
        payer_id=client.id,
        payment_type="MILESTONE",
        amount=milestone.amount,
        currency=milestone.currency,
        status="CAPTURED",
        paypal_capture_id=payout.get("payout_batch_id") or f"DISBURSE-{milestone.id[:8].upper()}"
    )
    db.add(disbursement)

    # Update matching invoice
    matching_invoice = db.query(Invoice).filter(Invoice.milestone_id == milestone.id).first()
    if matching_invoice:
        matching_invoice.status = "RELEASED"
        matching_invoice.released_at = datetime.datetime.utcnow()
        matching_invoice.paypal_capture_id = payout.get("payout_batch_id")

    # Find next pending invoice in sequential escrow pipeline
    next_invoice = (
        db.query(Invoice)
        .filter(Invoice.project_id == project.id, Invoice.status == "PENDING_DEPOSIT")
        .order_by(Invoice.order_index)
        .first()
    )

    # Check if all milestones are now paid
    all_milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
    if all(m.status == "PAID" for m in all_milestones):
        project.status = "COMPLETED"
        project.held_balance_status = "RELEASED"
    else:
        project.held_balance_status = "PARTIALLY_RELEASED"

    db.commit()
    db.refresh(project)

    trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="MILESTONE_FUNDS_DISBURSED",
        actor_id=client.id,
        actor_name=client.name,
        actor_role="client",
        details={
            "milestone_id": milestone.id,
            "milestone_title": milestone.title,
            "disbursed_amount": milestone.amount,
            "currency": milestone.currency,
            "recipient_paypal_email": recipient_email,
            "paypal_payout_batch_id": payout.get("payout_batch_id"),
            "note": req.release_note
        }
    )

    return {
        "status": "SUCCESS",
        "milestone_status": milestone.status,
        "disbursed_amount": milestone.amount,
        "currency": milestone.currency or "USD",
        "recipient_paypal_email": recipient_email,
        "contractor_name": freelancer.name if freelancer else "Contractor",
        "payout_batch_id": payout.get("payout_batch_id"),
        "payout_item_id": payout.get("payout_item_id"),
        "disbursed_at": payout.get("disbursed_at"),
        "project_status": project.status,
        "held_balance_status": project.held_balance_status,
        "next_invoice": {
            "id": next_invoice.id,
            "invoice_number": next_invoice.invoice_number,
            "amount": next_invoice.amount,
            "title": next_invoice.title
        } if next_invoice else None
    }

@router.post("/explain")
async def explain_project_payments(req: PaymentExplanationRequest, db: Session = Depends(get_db)):
    """Invokes the Payment Explanation Assistant to provide plain-language financial clarity."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones_data = [
        {"id": m.id, "title": m.title, "amount": m.amount, "status": m.status}
        for m in project.milestones
    ]

    explanation = await payment_explanation_assistant.explain_payment_status(
        project_title=project.title,
        total_budget=project.budget,
        advance_amount=project.advance_amount,
        advance_status=project.advance_status,
        held_balance=project.held_balance,
        held_balance_status=project.held_balance_status,
        milestones=milestones_data,
        user_question=req.question
    )

    return explanation

@router.post("/create-order")
async def create_paypal_order(req: PayPalCreateOrderRequest, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == req.milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    payer = db.query(User).filter(User.id == req.payer_id).first()
    if not payer:
        raise HTTPException(status_code=400, detail="Payer user not found")

    # Check criteria statuses
    criteria = db.query(AcceptanceCriterion).filter(AcceptanceCriterion.milestone_id == req.milestone_id).all()
    passed_count = sum(1 for c in criteria if c.status == "PASSED")
    failed_count = sum(1 for c in criteria if c.status == "FAILED")

    readiness = payment_coordinator.check_payment_readiness(
        milestone_status=milestone.status,
        passed_count=passed_count,
        failed_count=failed_count
    )

    if not readiness["ready"] and milestone.status != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail=f"Payment blocked by Payment Coordinator: {readiness['reason']}"
        )

    # Initiate PayPal Order v2
    order_data = await payment_coordinator.initiate_milestone_payment(
        milestone_id=milestone.id,
        amount=milestone.amount,
        currency=milestone.currency,
        milestone_title=milestone.title
    )

    # Save payment record
    payment = Payment(
        milestone_id=milestone.id,
        payer_id=req.payer_id,
        amount=milestone.amount,
        currency=milestone.currency,
        paypal_order_id=order_data.get("order_id"),
        status="CREATED"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="PAYPAL_ORDER_CREATED",
        actor_id=payer.id,
        actor_name=payer.name,
        actor_role="client",
        details={
            "paypal_order_id": payment.paypal_order_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "is_simulation": order_data.get("is_simulation", False)
        }
    )

    return {
        "payment_id": payment.id,
        "paypal_order_id": payment.paypal_order_id,
        "status": payment.status,
        "amount": payment.amount,
        "currency": payment.currency,
        "links": order_data.get("links", []),
        "is_simulation": order_data.get("is_simulation", False)
    }

@router.post("/capture-order", response_model=PaymentResponse)
async def capture_paypal_order(req: PayPalCaptureOrderRequest, db: Session = Depends(get_db)):
    payment = (
        db.query(Payment)
        .filter(Payment.paypal_order_id == req.paypal_order_id)
        .first()
    )
    if not payment:
        payment = (
            db.query(Payment)
            .filter(Payment.milestone_id == req.milestone_id)
            .order_by(Payment.created_at.desc())
            .first()
        )

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    milestone = db.query(Milestone).filter(Milestone.id == payment.milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Capture through PayPal Orders v2 API
    capture_data = await payment_coordinator.finalize_milestone_payment(
        paypal_order_id=req.paypal_order_id
    )

    payment.paypal_capture_id = capture_data.get("capture_id")
    payment.status = "CAPTURED"
    payment.updated_at = datetime.datetime.utcnow()
    milestone.status = "PAID"

    # If all milestones paid, mark project COMPLETED
    all_milestones = db.query(Milestone).filter(Milestone.project_id == milestone.project_id).all()
    if all(m.status == "PAID" for m in all_milestones):
        project = db.query(Project).filter(Project.id == milestone.project_id).first()
        if project:
            project.status = "COMPLETED"

    db.commit()
    db.refresh(payment)

    payer = db.query(User).filter(User.id == payment.payer_id).first()

    trust_auditor.record_event(
        db=db,
        project_id=milestone.project_id,
        action="PAYMENT_CAPTURED_AND_VERIFIED",
        actor_id=payment.payer_id,
        actor_name=payer.name if payer else "Client",
        actor_role="client",
        details={
            "paypal_order_id": payment.paypal_order_id,
            "paypal_capture_id": payment.paypal_capture_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "milestone_title": milestone.title,
            "is_simulation": capture_data.get("is_simulation", False)
        }
    )

    return payment

@router.get("/milestone/{milestone_id}", response_model=List[PaymentResponse])
def get_milestone_payments(milestone_id: str, db: Session = Depends(get_db)):
    return db.query(Payment).filter(Payment.milestone_id == milestone_id).all()

@router.post("/webhook")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives and processes official PayPal Sandbox Webhook events."""
    try:
        body = await request.json()
        event_type = body.get("event_type")
        resource = body.get("resource", {})
        order_id = resource.get("id")

        logger_msg = f"Received PayPal webhook: {event_type} for resource {order_id}"
        
        if event_type == "CHECKOUT.ORDER.APPROVED":
            pass
        elif event_type == "PAYMENT.CAPTURE.COMPLETED":
            pass

        return {"status": "success", "event_type": event_type}
    except Exception as e:
        return {"status": "error", "message": str(e)}

