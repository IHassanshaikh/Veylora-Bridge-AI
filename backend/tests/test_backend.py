import pytest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models import User, Project, Milestone, Contract
from app.agents import (
    contract_architect,
    deal_guardian,
    scope_change_analyst,
    requirement_planner,
    work_inspector,
    dispute_analyst,
    payment_coordinator,
    payment_explanation_assistant,
    trust_auditor
)
from app.services.paypal_service import paypal_service
from app.services.playwright_runner import playwright_runner

@pytest.fixture
def db():
    db_session = SessionLocal()
    yield db_session
    db_session.close()

@pytest.mark.asyncio
async def test_agent1_contract_architect():
    res = await contract_architect.generate_contract(
        brief="Build a full stack website with checkout",
        project_title="Test Store",
        budget=1000.0,
        currency="USD",
        target_days=10
    )
    assert "milestones" in res
    assert len(res["milestones"]) > 0
    first_milestone = res["milestones"][0]
    assert "criteria" in first_milestone
    assert len(first_milestone["criteria"]) > 0

def test_agent2_requirement_planner():
    mock_criteria = [
        {"id": "crit-1", "title": "Home HTTP 200", "verification_type": "HTTP_STATUS", "test_config_json": {"expected_status": 200}},
        {"id": "crit-2", "title": "Cart Click", "verification_type": "BROWSER_INTERACTION", "test_config_json": {"selector": "button.cart"}}
    ]
    plan = requirement_planner.plan_verification(mock_criteria)
    assert len(plan) == 2
    assert plan[0]["automated"] is True
    assert "HTTP" in plan[0]["strategy"]

@pytest.mark.asyncio
async def test_agent3_work_inspector():
    mock_results = [
        {"criterion_id": "c1", "outcome": "PASS", "details": "HTTP 200 OK"},
        {"criterion_id": "c2", "outcome": "FAIL", "details": "Checkout button exception"}
    ]
    inspection = await work_inspector.inspect("http://localhost:8000/demo", mock_results)
    assert inspection["failed_count"] == 1
    assert inspection["passed_count"] == 1
    assert inspection["readiness"] == "REVISIONS_REQUIRED"

@pytest.mark.asyncio
async def test_agent4_dispute_analyst():
    res = await dispute_analyst.analyze(
        contract_title="E-Commerce Store",
        milestone_title="Milestone 2",
        agreed_criteria=["Shopping cart updates item count", "Checkout processes test order"],
        client_argument="The developer did not build a native iOS mobile app as part of this web milestone!",
        freelancer_argument="The contract clearly specifies a responsive web app, not a native iOS app."
    )
    assert "neutral_analysis" in res
    assert res.get("scope_creep_detected") is True

def test_agent5_payment_coordinator():
    readiness_blocked = payment_coordinator.check_payment_readiness("IN_PROGRESS", passed_count=1, failed_count=1)
    assert readiness_blocked["ready"] is False

    readiness_approved = payment_coordinator.check_payment_readiness("VERIFIED", passed_count=2, failed_count=0)
    assert readiness_approved["ready"] is True

def test_agent6_trust_auditor(db):
    project = db.query(Project).first()
    assert project is not None
    ev = trust_auditor.record_event(
        db=db,
        project_id=project.id,
        action="TEST_VERIFICATION_EVENT",
        actor_role="system",
        details={"test": True}
    )
    assert ev.current_hash is not None
    assert len(ev.current_hash) == 64

    # Verify ledger integrity
    audit = trust_auditor.verify_ledger_integrity(db=db, project_id=project.id)
    assert audit["valid"] is True

@pytest.mark.asyncio
async def test_paypal_order_lifecycle():
    # Test Create Order
    order_res = await paypal_service.create_order(
        milestone_id="test-m-100",
        amount=250.00,
        currency="USD",
        description="Test Milestone"
    )
    assert "order_id" in order_res
    order_id = order_res["order_id"]

    # Test Capture Order
    capture_res = await paypal_service.capture_order(order_id)
    assert "capture_id" in capture_res
    assert capture_res["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_deal_guardian():
    res = await deal_guardian.analyze_risks(
        project_title="E-Commerce Redesign",
        brief="We need a modern, clean, fast website with good UX and great performance.",
        budget=1200.0,
        milestones=[{"title": "M1", "amount": 600.0}, {"title": "M2", "amount": 600.0}]
    )
    assert "risk_level" in res
    assert "health_score" in res
    assert isinstance(res["ambiguities_detected"], list)

@pytest.mark.asyncio
async def test_scope_change_analyst():
    res = await scope_change_analyst.analyze_scope(
        contract_title="Web Platform",
        baseline_milestones=[{"title": "Web Catalog", "description": "Responsive product page"}],
        message_or_request="We also want a native iOS mobile app and push notifications built!"
    )
    assert "classification" in res
    assert res.get("is_out_of_scope") is True

@pytest.mark.asyncio
async def test_payment_explanation_assistant():
    res = await payment_explanation_assistant.explain_payment_status(
        project_title="ApexStorefront Pro",
        total_budget=1500.0,
        advance_amount=300.0,
        advance_status="PAID",
        held_balance=1200.0,
        held_balance_status="SECURED",
        milestones=[{"title": "M1", "amount": 500.0, "status": "PAID"}]
    )
    assert "summary" in res
    assert "financial_metrics" in res
    assert res["financial_metrics"]["advance_amount"] == 300.0

