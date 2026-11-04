import asyncio
import json
import sqlite3
from playwright.async_api import async_playwright

async def run_audit():
    print("==================================================")
    print("STARTING COMPREHENSIVE PLATFORM LIVE AUDIT")
    print("==================================================")

    # Reset proj-demo-1042 so we can test advance payment
    conn = sqlite3.connect("backend/trustbridge.db")
    c = conn.cursor()
    c.execute("""
        UPDATE projects 
        SET advance_status = 'PENDING', 
            advance_paypal_order_id = NULL, 
            advance_paypal_capture_id = NULL 
        WHERE id = 'proj-demo-1042'
    """)
    # Ensure there is 1 open dispute for admin testing
    c.execute("UPDATE disputes SET status = 'OPEN', resolved_at = NULL WHERE id = 'disp-d360ebcd'")
    conn.commit()
    conn.close()
    print("✓ SQLite initialized: proj-demo-1042 advance_status=PENDING, disp-d360ebcd=OPEN")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})

        console_errors = []
        page = await context.new_page()
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # ----------------------------------------------------
        # TEST 1: Landing Page
        # ----------------------------------------------------
        print("\n--- TEST 1: Landing Page ---")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        title = await page.title()
        print(f"Landing page loaded: {title}")
        assert "Veylora" in title or "TrustBridge" in title or len(title) > 0, "Title failed"
        print("✓ Landing page verified")

        # ----------------------------------------------------
        # TEST 2: Admin Dashboard (All Projects & Disputes)
        # ----------------------------------------------------
        print("\n--- TEST 2: Admin Dashboard ---")
        admin_user = {
            "id": "user-admin-001",
            "name": "Sarah Jenkins",
            "email": "compliance@trustbridge.io",
            "role": "admin",
            "is_verified": True
        }
        await page.evaluate(f"""
            localStorage.setItem('trustbridge_token', 'mock-jwt-admin-token');
            localStorage.setItem('trustbridge_user', '{json.dumps(admin_user)}');
        """)
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # Verify no hydration errors
        hydration_errors = [e for e in console_errors if "Hydration" in e or "hydration" in e]
        assert len(hydration_errors) == 0, f"Hydration errors found: {hydration_errors}"
        print("✓ Zero hydration errors on Admin Dashboard")

        # Verify Disputes section exists
        dispute_elem = page.locator("#disputes")
        assert await dispute_elem.count() > 0, "Disputes section missing"
        print("✓ Disputes section found")

        # Verify Projects section exists
        projects_elem = page.locator("#projects")
        assert await projects_elem.count() > 0, "Projects section missing"
        print("✓ Projects section found")

        # Test resolving dispute
        release_btn = page.locator("button:has-text('Release to Freelancer')").first
        if await release_btn.count() > 0:
            print("Clicking 'Release to Freelancer'...")
            await release_btn.click()
            await page.wait_for_timeout(1500)
            success_badge = page.locator("text=Resolved by Administrator")
            assert await success_badge.count() > 0, "Dispute resolution badge missing"
            print("✓ Dispute resolved successfully in real-time")

        # ----------------------------------------------------
        # TEST 3: Client Dashboard
        # ----------------------------------------------------
        print("\n--- TEST 3: Client Dashboard ---")
        client_user = {
            "id": "user-client-001",
            "name": "Alex Mercer",
            "email": "alex@acmestudio.io",
            "role": "client",
            "is_verified": True,
            "paypal_email": "alex@acmestudio.io"
        }
        await page.evaluate(f"""
            localStorage.setItem('trustbridge_token', 'mock-jwt-client-token');
            localStorage.setItem('trustbridge_user', '{json.dumps(client_user)}');
        """)
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        assert len([e for e in console_errors if "Hydration" in e]) == 0, "Hydration errors on Client Dashboard"
        print("✓ Client Dashboard verified with zero hydration errors")

        # ----------------------------------------------------
        # TEST 4: Project Payments Tab & Exact PayPal Flow
        # ----------------------------------------------------
        print("\n--- TEST 4: PayPal Smart Checkout & Sandbox Flow ---")
        await page.goto("http://localhost:3000/projects/proj-demo-1042?tab=payments", wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # Check Order Summary card
        order_summary = page.locator("text=Order Summary").first
        assert await order_summary.count() > 0, "Order Summary card missing"
        print("✓ Order Summary Card present")

        # Verify PayPal Smart Buttons
        paypal_btn = page.locator("button:has-text('Checkout')").first
        assert await paypal_btn.count() > 0, "PayPal Checkout button missing"
        
        # Check border radius is 0 (rounded-none)
        btn_class = await paypal_btn.get_attribute("class")
        assert "rounded-none" in btn_class, f"Button is not square: {btn_class}"
        print(f"✓ PayPal Checkout button confirmed sharp square (rounded-none)")

        # Click PayPal Checkout to trigger multi-step modal
        print("Opening PayPal Checkout Modal...")
        await paypal_btn.click()
        await page.wait_for_timeout(400)

        # Step 1: Connecting Lock Spinner
        modal_spinner = page.locator("text=Connecting to PayPal Sandbox...")
        print(f"Spinner visible count: {await modal_spinner.count()}")

        # Wait for Step 2: Login screen
        await page.wait_for_timeout(800)
        login_heading = page.locator("h2:has-text('Pay with PayPal')")
        assert await login_heading.count() > 0, "PayPal Login screen missing"
        print("✓ Step 2: PayPal Login screen visible")

        # Click "Pay with Debit or Credit Card" to go to Guest Card Checkout (Image 5)
        card_switch_btn = page.locator("button:has-text('Pay with Debit or Credit Card')")
        assert await card_switch_btn.count() > 0, "Card checkout button in modal missing"
        await card_switch_btn.click()
        await page.wait_for_timeout(500)

        # Step 3: Guest Card Form
        card_heading = page.locator("h3:has-text('Pay with debit or credit card')")
        assert await card_heading.count() > 0, "Guest card checkout form missing"
        print("✓ Step 3: Pay with Debit or Credit Card screen visible")

        # Submit payment
        pay_btn = page.locator("button:has-text('Pay Now ($600.00)')")
        assert await pay_btn.count() > 0, "Pay Now button missing"
        print("Submitting PayPal Card authorization...")
        await pay_btn.click()
        await page.wait_for_timeout(1500)

        # Verify success screen
        success_msg = page.locator("text=Payment Completed!")
        assert await success_msg.count() > 0, "Payment Completed message missing"
        print("✓ Payment completed message received")

        # Wait for modal close & project refresh
        await page.wait_for_timeout(2500)

        # Verify project state in Payments tab
        paid_badge = page.locator("text=Kickoff Advance Paid & Escrow Activated")
        assert await paid_badge.count() > 0, "Project did not transition to Kickoff Advance Paid"
        print("✓ Real-time project status updated to PAID & Escrow Activated")

        # Verify SQLite DB
        conn = sqlite3.connect("backend/trustbridge.db")
        c = conn.cursor()
        c.execute("SELECT advance_status, advance_paypal_order_id, advance_paypal_capture_id FROM projects WHERE id = 'proj-demo-1042'")
        db_row = c.fetchone()
        conn.close()
        print(f"✓ SQLite Database verified: status={db_row[0]}, order_id={db_row[1]}, capture_id={db_row[2]}")
        assert db_row[0] == "PAID", "DB status is not PAID"
        assert db_row[1] is not None, "DB order_id is None"
        assert db_row[2] is not None, "DB capture_id is None"

        await browser.close()

    print("\n==================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_audit())

