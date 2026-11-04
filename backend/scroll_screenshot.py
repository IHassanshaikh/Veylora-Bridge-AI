import time
import os
import json
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\hassa\.gemini\antigravity\brain\31be1c57-89bd-4f1d-98b8-d0b02afbaa83\evidence"
PROJECT_ID = "af202923-136e-48b9-afaf-8df32a6f87b5"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 950})
    page = context.new_page()

    client_user = {
        "id": "user-client-001",
        "name": "Alex Rivera",
        "email": "alex@acmestudio.io",
        "role": "client"
    }
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    page.evaluate(f"""() => {{
        localStorage.setItem('trustbridge_token', 'demo-token-client-001');
        localStorage.setItem('trustbridge_user', '{json.dumps(client_user)}');
    }}""")

    page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=contract", wait_until="networkidle")
    time.sleep(2)
    
    # Scroll down the contract container
    page.evaluate("""() => {
        const container = document.querySelector('.prose-clean')?.parentElement;
        if (container) {
            container.scrollTop = 320;
        }
    }""")
    time.sleep(1)
    
    screenshot_path = os.path.join(ARTIFACT_DIR, "12_user_agreement_criteria_badges.png")
    page.screenshot(path=screenshot_path, full_page=False)
    print(f"[SUCCESS] Scrolled screenshot saved: {screenshot_path}")
    browser.close()

