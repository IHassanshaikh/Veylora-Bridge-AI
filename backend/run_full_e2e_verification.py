import asyncio
import os
import sqlite3
from playwright.async_api import async_playwright

async def run_verification():
    print("=== STARTING FULL E2E GOAL VERIFICATION ===")
    
    # Reset DB to initial test state
    conn = sqlite3.connect("backend/trustbridge.db")
    conn.execute("UPDATE projects SET advance_status='PENDING', advance_paypal_order_id=NULL, advance_paypal_capture_id=NULL WHERE id='proj-demo-1042'")
    conn.execute("UPDATE disputes SET status='OPEN', resolved_at=NULL WHERE id='disp-d360ebcd'")
    conn.commit()
    conn.close()
    print("Database reset to PENDING and OPEN.")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 960})
        page = await context.new_page()

        artifacts_dir = r"C:\Users\hassa\.gemini\antigravity\brain\31be1c57-89bd-4f1d-98b8-d0b02afbaa83\verification"
        os.makedirs(artifacts_dir, exist_ok=True)

        # Log in as Client via the 1-click preset button
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        alex_btn = page.locator("button:has-text('Alex (Client)')")
        if await alex_btn.count() > 0:
            await alex_btn.click()
            await page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # STEP 1: Verify Payments Tab
        # -------------------------------------------------------------
        print("\n--- Step 1: Checking Payments Tab ---")
        await page.goto("http://localhost:3000/projects/proj-demo-1042?tab=payments", wait_until="networkidle")
        await page.wait_for_timeout(1200)

        # Confirm no duplicate top yellow bar button
        top_bar_btn = await page.locator("button:has-text('AUTHORIZE $600 KICKOFF ADVANCE')").count()
        top_bar_btn_2 = await page.locator("button:has-text('Authorize $600 Kickoff Advance')").count()
        print(f"Top yellow bar buttons found: {top_bar_btn + top_bar_btn_2} (Expected: 0)")
        assert (top_bar_btn + top_bar_btn_2) == 0, "Duplicate top-wide button still exists!"

        # Confirm Venmo / Pay Later / Card buttons are NOT on storefront
        venmo_btn = await page.locator("button:has-text('venmo')").count()
        paylater_btn = await page.locator("button:has-text('Pay Later')").count()
        print(f"Venmo buttons on storefront: {venmo_btn} (Expected: 0)")
        print(f"Pay Later buttons on storefront: {paylater_btn} (Expected: 0)")
        assert venmo_btn == 0, "Venmo button should not exist on storefront"
        assert paylater_btn == 0, "Pay Later button should not exist on storefront"

        # Confirm single official PayPal Checkout button exists
        paypal_checkout_btn = page.locator("button:has-text('Checkout')")
        btn_count = await paypal_checkout_btn.count()
        print(f"PayPal Checkout buttons on storefront: {btn_count} (Expected: 1)")
        assert btn_count == 1, "Expected exactly 1 PayPal Checkout button"

        # Check PayPal logo inside checkout button
        logo_img = paypal_checkout_btn.locator("img[alt='PayPal']")
        logo_class = await logo_img.get_attribute("class")
        print(f"PayPal logo classes in button: '{logo_class}' (Contains 'h-9')")
        assert "h-9" in logo_class, "PayPal logo should be h-9 (36px)"

        # Take screenshot of Payments Tab
        tab_screenshot = os.path.join(artifacts_dir, "01_payments_tab_verified.png")
        await page.screenshot(path=tab_screenshot, full_page=True)
        print(f"Saved screenshot: {tab_screenshot}")

        # -------------------------------------------------------------
        # STEP 2: Open PayPal Sandbox Modal & Complete Checkout
        # -------------------------------------------------------------
        print("\n--- Step 2: Testing PayPal Sandbox Modal ---")
        await paypal_checkout_btn.click()
        await page.wait_for_timeout(1200) # Modal opens with lock spinner then login screen

        modal_login = os.path.join(artifacts_dir, "02_paypal_modal_login.png")
        await page.screenshot(path=modal_login)
        print(f"Saved screenshot: {modal_login}")

        # Verify email input & Next button
        email_input = page.locator("input[placeholder='Email or mobile number']")
        next_btn = page.locator("button:has-text('Next')")
        assert await email_input.count() > 0, "PayPal Modal email input not found"
        assert await next_btn.count() > 0, "PayPal Modal Next button not found"

        # Click Next to advance to Guest / Card screen
        await next_btn.click()
        await page.wait_for_timeout(800)

        modal_card = os.path.join(artifacts_dir, "03_paypal_modal_card.png")
        await page.screenshot(path=modal_card)
        print(f"Saved screenshot: {modal_card}")

        # Verify Card screen fields
        card_num_input = page.locator("input[placeholder='Card number']")
        cvv_input = page.locator("input[placeholder='CVV']")
        pay_now_btn = page.locator("button[type='submit']:has-text('Pay Now')")
        assert await card_num_input.count() > 0, "Card number input not found"
        assert await cvv_input.count() > 0, "CVV input not found"
        assert await pay_now_btn.count() > 0, "Pay Now button not found"

        # Fill card info and pay
        await card_num_input.fill("4242 4242 4242 4242")
        await page.locator("input[placeholder='Expiration date']").fill("12/28")
        await cvv_input.fill("888")

        print("Submitting Payment in Modal...")
        await pay_now_btn.click()
        await page.wait_for_timeout(3000) # Wait for processing -> success -> modal close -> state refresh

        # Verify project state updated to PAID in DB
        conn = sqlite3.connect("backend/trustbridge.db")
        proj_row = conn.execute("SELECT advance_status, advance_paypal_order_id, advance_paypal_capture_id FROM projects WHERE id='proj-demo-1042'").fetchone()
        conn.close()
        print(f"Project Database Status: {proj_row}")
        assert proj_row[0] == "PAID", f"Expected advance_status to be PAID, got {proj_row[0]}"
        assert proj_row[1] is not None and "SANDBOX-ORD" in proj_row[1], "Valid PayPal Order ID should be stored"
        assert proj_row[2] is not None and "SANDBOX-CAP" in proj_row[2], "Valid PayPal Capture ID should be stored"

        paid_tab_screenshot = os.path.join(artifacts_dir, "04_payments_tab_paid.png")
        await page.screenshot(path=paid_tab_screenshot, full_page=True)
        print(f"Saved screenshot: {paid_tab_screenshot}")

        # -------------------------------------------------------------
        # STEP 3: Verify Admin Dashboard & Dispute Resolution
        # -------------------------------------------------------------
        print("\n--- Step 3: Testing Admin Dashboard & Dispute Resolution ---")
        await page.evaluate("() => localStorage.setItem('trustbridge_user', JSON.stringify({id: 'u-admin', email: 'admin@veylora.com', name: 'Admin Master', role: 'admin'}))")
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        admin_screenshot = os.path.join(artifacts_dir, "05_admin_dashboard.png")
        await page.screenshot(path=admin_screenshot, full_page=True)
        print(f"Saved screenshot: {admin_screenshot}")

        # Verify Disputes table is visible
        disputes_heading = page.locator(":has-text('All Disputes & Resolution')")
        assert await disputes_heading.count() > 0, "Disputes heading missing from Admin Dashboard"

        # Check for Release to Freelancer or Refund to Client button
        resolve_freelancer_btn = page.locator("button:has-text('Release to Freelancer')")
        if await resolve_freelancer_btn.count() > 0:
            print("Resolving dispute via Admin Dashboard: 'Release to Freelancer'...")
            await resolve_freelancer_btn.first.click()
            await page.wait_for_timeout(1500)

            # Check DB dispute status
            conn = sqlite3.connect("backend/trustbridge.db")
            disp_row = conn.execute("SELECT id, status, resolved_at FROM disputes WHERE id='disp-d360ebcd'").fetchone()
            conn.close()
            print(f"Dispute Database Status: {disp_row}")
            assert disp_row[1] == "RESOLVED", f"Expected dispute to be RESOLVED, got {disp_row[1]}"

        admin_resolved_screenshot = os.path.join(artifacts_dir, "06_admin_dashboard_resolved.png")
        await page.screenshot(path=admin_resolved_screenshot, full_page=True)
        print(f"Saved screenshot: {admin_resolved_screenshot}")

        await browser.close()
        print("\n=== ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
