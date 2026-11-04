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
        context = await browser.new_context(viewport={"width": 1400, "height": 950})
        page = await context.new_page()

        # Set localStorage for authenticated client
        await page.goto("http://localhost:3000")
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

        # 1. Project Overview showing Connected PayPal Accounts Bar
        print("Navigating to project overview...")
        await page.goto(f"http://localhost:3000/projects/{PROJ_ID}")
        await page.wait_for_selector("text=Connected Accounts:", timeout=15000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "19_connected_paypal_accounts_bar.png"))
        print("Captured 19_connected_paypal_accounts_bar.png")

        # 2. Invoices Tab with Connected Accounts & Beautiful Typography
        print("Switching to Invoices tab...")
        await page.click("button:has-text('Invoices')")
        await page.wait_for_selector("text=Sequential Invoices", timeout=15000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "20_invoices_cadence_and_accounts.png"))
        print("Captured 20_invoices_cadence_and_accounts.png")

        # 3. View Gorgeous Redesigned Printable Invoice
        print("Opening redesigned invoice document...")
        view_inv_btn = page.locator("button:has-text('View Invoice')").first
        await view_inv_btn.click()
        await page.wait_for_selector("text=Itemized Milestone Deliverables", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "21_gorgeous_redesigned_invoice.png"))
        print("Captured 21_gorgeous_redesigned_invoice.png")

        # Close invoice
        await page.click("button:has-text('Close')")
        await page.wait_for_timeout(500)

        # 4. Open PayPal Payouts Modal (Disbursement to Contractor Wallet)
        print("Opening PayPal Payouts modal...")
        release_btn = page.locator("button:has-text('Release via PayPal')").first
        if await release_btn.count() > 0:
            await release_btn.click()
            await page.wait_for_selector("text=PayPal Payouts v1", timeout=10000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "22_paypal_payout_disbursement_modal.png"))
            print("Captured 22_paypal_payout_disbursement_modal.png")

        await browser.close()
        print("\nAll PayPal & Invoice evidence captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_views())

