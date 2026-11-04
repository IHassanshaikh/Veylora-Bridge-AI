import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\hassa\.gemini\antigravity\brain\31be1c57-89bd-4f1d-98b8-d0b02afbaa83\evidence"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

PROJECT_ID = "af202923-136e-48b9-afaf-8df32a6f87b5"
INVITE_TOKEN = "3-76U34J7veJfkOBBLO3utVd9mXKSRg6"

def run_visual_verification():
    print("[INFO] Launching Chromium for visual verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        # 1. Landing Page
        print("[1/10] Capturing Landing Page...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "01_landing_clean.png"), full_page=False)

        # 2. Contact Page (Verify hassanshaikh9717@gmail.com and +923101022778)
        print("[2/10] Capturing Contact Page...")
        page.goto("http://localhost:3000/contact", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "02_contact_info.png"), full_page=False)

        # 3. Unauthenticated Invite Page (Verify prompt to Login or Sign Up)
        print("[3/10] Capturing Unauthenticated Invite Prompt...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.evaluate("() => { localStorage.clear(); }")
        page.goto(f"http://localhost:3000/invite/{INVITE_TOKEN}", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "03_unauth_invite.png"), full_page=False)

        # 4. Set Client Auth Session
        print("[4/10] Authenticating as Client...")
        client_user = {
            "id": "user-client-001",
            "name": "Alex Rivera",
            "email": "alex@acmestudio.io",
            "role": "client"
        }
        client_user_json = json.dumps(client_user)
        page.evaluate(f"""() => {{
            localStorage.setItem('trustbridge_token', 'demo-token-client-001');
            localStorage.setItem('trustbridge_user', '{client_user_json}');
        }}""")

        # 5. Authenticated Invite Page (Review Agreement & Financials)
        print("[5/10] Capturing Authenticated Invite Agreement Review...")
        page.goto(f"http://localhost:3000/invite/{INVITE_TOKEN}", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "04_auth_invite_review.png"), full_page=False)

        # 6. Client Dashboard (Clean Action Cards)
        print("[6/10] Capturing Client Dashboard...")
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "05_client_dashboard.png"), full_page=False)

        # 7. Project Room - Overview Tab (No AI Clutter)
        print("[7/10] Capturing Project Overview Tab...")
        page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=overview", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "06_project_overview.png"), full_page=False)

        # 8. Project Room - Contract Tab (Inline Editor & Comments Panel)
        print("[8/10] Capturing Contract Tab with Editor & Comments...")
        page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=contract", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "07_contract_editor_and_comments.png"), full_page=False)

        # 9. Project Room - Invoices & Sequential Escrow Tab
        print("[9/10] Capturing Invoices & Escrow Tab...")
        page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=invoices", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "08_invoices_sequential_escrow.png"), full_page=False)

        # 10. Project Room - Payments Tab (Single Official PayPal Checkout)
        print("[10/11] Capturing Official PayPal Checkout...")
        page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=payments", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "09_official_paypal_checkout.png"), full_page=False)

        # 11. Admin Dashboard & Dispute Dossier Modal
        print("[11/11] Capturing Admin Dashboard & Dispute Dossier Modal...")
        admin_user = {
            "id": "admin-root-001",
            "name": "Dispute Administrator",
            "email": "compliance@veylora.bridge",
            "role": "admin"
        }
        admin_user_json = json.dumps(admin_user)
        page.evaluate(f"""() => {{
            localStorage.setItem('trustbridge_token', 'demo-token-admin-001');
            localStorage.setItem('trustbridge_user', '{admin_user_json}');
        }}""")
        page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        time.sleep(2)
        
        # Click "Review AI Dossier" or "View Dossier Record"
        dossier_btn = page.locator("button:has-text('Dossier')").first
        if dossier_btn.count() > 0:
            print("Found Dossier button, clicking to open modal...")
            dossier_btn.click()
            time.sleep(1.5)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "10_admin_disputes_dossier_modal.png"), full_page=False)

        browser.close()
        print("[SUCCESS] All visual verification screenshots captured successfully!")

if __name__ == "__main__":
    run_visual_verification()
