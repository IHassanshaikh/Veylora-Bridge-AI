import datetime
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Project, Contract, Milestone, AcceptanceCriterion,
    Submission, VerificationRun, VerificationResult, Evidence,
    Payment, AuditEvent, Invitation
)
from app.agents import trust_auditor

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        from app.api.auth import hash_password
        default_pwd = hash_password("Password123!")
        admin_pwd = hash_password("AdminSecret2026!")

        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already has users. Updating password hashes and auth fields...")
            users = db.query(User).all()
            for u in users:
                if not u.password_hash:
                    u.password_hash = admin_pwd if u.role == "admin" else default_pwd
                if not u.auth_provider:
                    u.auth_provider = "email"
                if not u.paypal_email:
                    u.paypal_email = u.email
            db.commit()
            return

        print("Seeding database with TrustBridge demo data...")

        # 1. Create Users
        client = User(
            id="user-client-001",
            name="Alex Rivera",
            email="alex@acmestudio.io",
            role="client",
            password_hash=default_pwd,
            auth_provider="email",
            paypal_email="alex@acmestudio.io",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        freelancer = User(
            id="user-freelancer-001",
            name="Elena Rostova",
            email="elena@devcraft.io",
            role="freelancer",
            password_hash=default_pwd,
            auth_provider="email",
            paypal_email="elena@devcraft.io",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
        admin = User(
            id="user-admin-001",
            name="Compliance Administrator",
            email="admin@payflow.io",
            role="admin",
            password_hash=admin_pwd,
            auth_provider="email",
            paypal_email="admin@payflow.io",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        )
        db.add_all([client, freelancer, admin])
        db.flush()

        # 2. Create Primary Project
        project = Project(
            id="proj-demo-1042",
            client_id=client.id,
            freelancer_id=freelancer.id,
            title="ApexStorefront Pro E-Commerce Platform",
            description="Build a high-performance modern e-commerce storefront with responsive catalog, reactive cart state, and working checkout workflow.",
            category="Web Development",
            budget=1500.00,
            advance_amount=300.00,
            held_balance=1200.00,
            advance_status="PAID",
            advance_paypal_order_id="SANDBOX-ADV-ORD-881203",
            advance_paypal_capture_id="SANDBOX-ADV-CAP-441920",
            held_balance_status="SECURED",
            invitation_token="invite-demo-token-99",
            currency="USD",
            status="IN_PROGRESS"
        )
        db.add(project)
        db.flush()

        # Advance payment record
        advance_payment = Payment(
            project_id=project.id,
            milestone_id=None,
            payer_id=client.id,
            payment_type="ADVANCE",
            amount=300.00,
            currency="USD",
            paypal_order_id="SANDBOX-ADV-ORD-881203",
            paypal_capture_id="SANDBOX-ADV-CAP-441920",
            status="CAPTURED"
        )
        db.add(advance_payment)
        db.flush()

        # Invitation record for primary project
        invitation = Invitation(
            id="inv-demo-001",
            project_id=project.id,
            inviter_id=client.id,
            invitee_email="elena@devcraft.io",
            role="freelancer",
            token="invite-demo-token-99",
            status="ACCEPTED",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            accepted_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
        )
        db.add(invitation)
        db.flush()

        # 3. Create Second Project with Client Email Invitation
        p2 = Project(
            id="proj-novapay-2099",
            client_id=client.id,
            freelancer_id=None,
            title="NovaPay Mobile Web & Checkout UI",
            description="Design and implement a responsive mobile fintech payment flow with real-time currency conversion and biometric auth mock.",
            category="Mobile Development",
            budget=2000.00,
            advance_amount=600.00,
            held_balance=1400.00,
            advance_status="PENDING",
            held_balance_status="UNFUNDED",
            currency="USD",
            status="CONTRACT_PENDING",
            invitation_token="invite-novapay-client-invite"
        )
        db.add(p2)
        db.flush()

        inv2 = Invitation(
            id="inv-demo-002",
            project_id=p2.id,
            inviter_id=client.id,
            invitee_email="client.partner@stripe-demo.org",
            role="client",
            token="invite-novapay-client-invite",
            status="PENDING",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=5)
        )
        db.add(inv2)
        db.flush()

        # 3. Create Signed Contract
        contract_content = """# Freelance Agreement: ApexStorefront Pro
**Client:** Alex Rivera (Acme Studio)
**Freelancer:** Elena Rostova
**Total Value:** $1,500.00 USD
**Governing Principle:** Objective verification prior to PayPal disbursement.

## Agreed Scope & Milestones
- **Milestone 1:** Core Architecture & Responsive Viewport ($500.00)
- **Milestone 2:** Shopping Cart & Checkout Validation ($600.00)
- **Milestone 3:** Final Admin Dashboard & SSL Production ($400.00)
"""
        contract = Contract(
            id="contract-001",
            project_id=project.id,
            version=1,
            content_markdown=contract_content,
            content_json={"title": project.title, "budget": project.budget},
            status="ACCEPTED",
            client_signed_at=datetime.datetime.utcnow() - datetime.timedelta(days=4),
            freelancer_signed_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
        )
        db.add(contract)
        db.flush()

        # Record Contract Genesis Hash
        trust_auditor.record_event(
            db=db,
            project_id=project.id,
            action="CONTRACT_MUTUALLY_ACCEPTED",
            actor_id=client.id,
            actor_name=client.name,
            actor_role="client",
            details={"version": 1, "budget": 1500.00}
        )

        # 4. Milestone 1 (Completed & Paid with PayPal)
        m1 = Milestone(
            id="m1-arch",
            project_id=project.id,
            title="Milestone 1: Core Architecture & Responsive UI",
            description="Setup repository, build responsive layout and verify clean rendering across desktop and mobile devices.",
            amount=500.00,
            currency="USD",
            order_index=0,
            due_date="Completed",
            status="PAID"
        )
        db.add(m1)
        db.flush()

        c1_1 = AcceptanceCriterion(
            milestone_id=m1.id,
            title="Homepage Loads & Returns HTTP 200",
            description="Target application renders within 3 seconds with HTTP 200 OK status.",
            verification_type="HTTP_STATUS",
            test_config_json={"expected_status": 200},
            status="PASSED"
        )
        c1_2 = AcceptanceCriterion(
            milestone_id=m1.id,
            title="Mobile Responsive Viewport",
            description="Layout scales smoothly to 375x667 viewport with no horizontal overflow.",
            verification_type="RESPONSIVE_VIEWPORT",
            test_config_json={"viewport": {"width": 375, "height": 667}},
            status="PASSED"
        )
        db.add_all([c1_1, c1_2])
        db.flush()

        # PayPal payment record for Milestone 1
        payment1 = Payment(
            milestone_id=m1.id,
            payer_id=client.id,
            amount=500.00,
            currency="USD",
            paypal_order_id="SANDBOX-ORD-M1-984102",
            paypal_capture_id="SANDBOX-CAP-M1-558291",
            status="CAPTURED"
        )
        db.add(payment1)
        db.flush()

        trust_auditor.record_event(
            db=db,
            project_id=project.id,
            action="PAYMENT_CAPTURED_AND_VERIFIED",
            actor_id=client.id,
            actor_name=client.name,
            actor_role="client",
            details={
                "milestone": m1.title,
                "amount": 500.00,
                "paypal_capture_id": payment1.paypal_capture_id
            }
        )

        # 5. Milestone 2 (Active Demo Target: Cart & Checkout)
        m2 = Milestone(
            id="m2-cart-checkout",
            project_id=project.id,
            title="Milestone 2: Shopping Cart & Checkout Flow",
            description="Interactive product catalog, cart item quantity updates, and form checkout validation.",
            amount=600.00,
            currency="USD",
            order_index=1,
            due_date="In Progress",
            status="SUBMITTED"
        )
        db.add(m2)
        db.flush()

        c2_1 = AcceptanceCriterion(
            id="crit-cart-update",
            milestone_id=m2.id,
            title="Product Selection & Cart Increment",
            description="Clicking 'Add to Cart' updates cart quantity badge and drawer in the DOM.",
            verification_type="BROWSER_INTERACTION",
            test_config_json={"selector": "button.add-to-cart", "action": "click"},
            status="PENDING"
        )
        c2_2 = AcceptanceCriterion(
            id="crit-checkout-flow",
            milestone_id=m2.id,
            title="Order Checkout Validation",
            description="Form input submission processes order with zero client exceptions and returns order receipt.",
            verification_type="BROWSER_INTERACTION",
            test_config_json={"selector": "button.checkout-btn", "action": "click", "target_feature": "checkout_submission"},
            status="PENDING"
        )
        db.add_all([c2_1, c2_2])
        db.flush()

        # Initial Submission for Milestone 2
        sub2 = Submission(
            id="sub-m2-001",
            milestone_id=m2.id,
            freelancer_id=freelancer.id,
            repository_url="https://github.com/elena-dev/apex-storefront",
            deployment_url="http://localhost:8000/api/demo-store",
            commit_hash="c839f10a",
            notes="Implemented responsive cart and checkout flow. Ready for Proof of Work verification run."
        )
        db.add(sub2)
        db.flush()

        # 6. Milestone 3 (Pending)
        m3 = Milestone(
            id="m3-admin",
            project_id=project.id,
            title="Milestone 3: Admin Dashboard & Production Deployment",
            description="Admin inventory management view, SSL deployment, and final handoff documentation.",
            amount=400.00,
            currency="USD",
            order_index=2,
            due_date="Pending M2",
            status="PENDING"
        )
        db.add(m3)
        db.flush()

        c3_1 = AcceptanceCriterion(
            milestone_id=m3.id,
            title="Production SSL Availability",
            description="HTTPS connection verified with valid certificate and zero mixed-content warnings.",
            verification_type="HTTP_STATUS",
            test_config_json={"expected_status": 200},
            status="PENDING"
        )
        db.add(c3_1)

        db.commit()
        print("Database seeded successfully with project ApexStorefront Pro!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

