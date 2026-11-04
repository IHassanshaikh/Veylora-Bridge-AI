import asyncio
import os
import json
from playwright.async_api import async_playwright

OUTPUT_DIR = r"C:\Users\hassa\.gemini\antigravity\brain\31be1c57-89bd-4f1d-98b8-d0b02afbaa83\evidence"
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROJ_ID = "8b3045b9-c163-45bd-99a6-337922ae4ae2"

async def capture_views():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        # Set localStorage for authenticated contractor / freelancer
        await page.goto("http://localhost:3000")
        freelancer_user = {
            "id": "user-freelancer-001",
            "name": "Elena Rostova",
            "email": "elena@craftdev.io",
            "role": "freelancer",
            "paypal_email": "elena-seller@craftdev.io"
        }
        await page.evaluate(f"""() => {{
            localStorage.setItem('trustbridge_user', '{json.dumps(freelancer_user)}');
            localStorage.setItem('trustbridge_token', 'mock-jwt-freelancer-token');
        }}""")

        # 1. Project Overview with updated $1,000 budget everywhere
        print("Navigating to project overview...")
        await page.goto(f"http://localhost:3000/projects/{PROJ_ID}")
        await page.wait_for_selector("text=Modern E-Commerce Storefront", timeout=15000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "13_project_overview_synced_1000.png"))
        print("Captured 13_project_overview_synced_1000.png")

        # 2. Click "Contract" tab and open "Edit Agreement" modal to show AI Assistant
        print("Opening contract tab and edit modal...")
        await page.click("button:has-text('Contract')")
        await page.wait_for_timeout(1000)
        
        # Click "Edit Agreement" button
        edit_btn = page.locator("button:has-text('Edit Agreement')")
        if await edit_btn.count() > 0:
            await edit_btn.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "14_ai_revision_modal_with_comments.png"))
            print("Captured 14_ai_revision_modal_with_comments.png")
            # Close modal
            close_btn = page.locator("button:has-text('Cancel')")
            if await close_btn.count() > 0:
                await close_btn.first.click()
                await page.wait_for_timeout(500)

        # 3. Milestones Tab
        print("Capturing milestones tab...")
        await page.click("button:has-text('Milestones')")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "15_milestones_tab_synced_amounts.png"))
        print("Captured 15_milestones_tab_synced_amounts.png")

        # 4. Invoices Tab
        print("Capturing invoices tab...")
        await page.click("button:has-text('Invoices')")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "16_invoices_tab_synced_amounts.png"))
        print("Captured 16_invoices_tab_synced_amounts.png")

        # 5. Switch to Client role to inspect Payments Tab and PayPal Checkout
        client_user = {
            "id": "user-client-001",
            "name": "Alex Rivera",
            "email": "alex@acmestudio.io",
            "role": "client",
            "paypal_email": "alex-buyer@acmestudio.io"
        }
        await page.evaluate(f"""() => {{
            localStorage.setItem('trustbridge_user', '{json.dumps(client_user)}');
            localStorage.setItem('trustbridge_token', 'mock-jwt-client-token');
        }}""")

        print("Capturing payments tab from client view...")
        await page.goto(f"http://localhost:3000/projects/{PROJ_ID}?tab=payments")
        await page.wait_for_selector("text=Upfront Kickoff Advance Deposit", timeout=15000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "17_payments_tab_synced_advance.png"))
        print("Captured 17_payments_tab_synced_advance.png")

        # 6. Client Dashboard with updated Action Required
        print("Capturing client dashboard...")
        await page.goto("http://localhost:3000/dashboard")
        await page.wait_for_selector("text=Kickoff Advance Payments Pending", timeout=15000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "18_dashboard_synced_advance.png"))
        print("Captured 18_dashboard_synced_advance.png")

        await browser.close()
        print("\nAll evidence screenshots successfully saved!")

if __name__ == "__main__":
    asyncio.run(capture_views())

