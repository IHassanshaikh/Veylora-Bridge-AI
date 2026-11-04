import requests
import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8000/api"
PROJECT_ID = "af202923-136e-48b9-afaf-8df32a6f87b5"
ARTIFACT_DIR = r"C:\Users\hassa\.gemini\antigravity\brain\31be1c57-89bd-4f1d-98b8-d0b02afbaa83\evidence"

USER_AGREEMENT_MARKDOWN = """# Modern E-Commerce Storefront Development Agreement

**Summary:** Development of a complete, responsive e-commerce web application for a clothing brand including product catalog, cart, checkout, payment gateway integration, admin dashboard, and order management systems.

**Terms & Policy:** This Agreement is entered into by and between TrustBridge AI (Contractor) and the Client for the development of a Modern E-Commerce Storefront. Total project budget is USD 15,000.0 (converted from local currency equivalent per project terms) structured across 4 distinct milestones. The Client shall provide all necessary branding assets, logos, and content. Regular progress updates will be shared. Delivery timeline is set to approximately 180 days.

## Agreed Milestones & Testable Acceptance Criteria

### Project Confirmation and Advance (USD 4,500.00)
Project kickoff, architectural setup, UI/UX wireframes, database schema design, and responsive frontend layout for the homepage and product pages.

**Acceptance Criteria:**
- `[RESPONSIVE_VIEWPORT]` **Responsive Viewport Layout Check**: Verify homepage layout renders correctly across mobile, tablet, and desktop viewports.
- `[HTTP_STATUS]` **Homepage HTTP Status**: Ensure homepage endpoints return successful HTTP status codes.

### Core E-Commerce Features Development (USD 3,000.00)
Implementation of customer registration and login, product catalog, shopping cart functionality, and initial checkout system.

**Acceptance Criteria:**
- `[BROWSER_INTERACTION]` **Customer Registration Flow**: Test user registration and login forms via automated browser interaction.
- `[HTTP_STATUS]` **Cart API Status**: Verify shopping cart endpoints are active and responding correctly.

### Advanced Features and Admin Dashboard (USD 3,000.00)
Integration of payment gateway, Cash on Delivery option, discount coupons, email notifications, order tracking, and comprehensive admin dashboard for managing products, orders, and inventory.

**Acceptance Criteria:**
- `[CODE_INSPECTION]` **Admin Dashboard Inspection**: Inspect codebase for robust role-based access control and admin inventory management modules.
- `[BROWSER_INTERACTION]` **Checkout Flow Verification**: Simulate end-to-end checkout with coupon application and payment option selection.

### Final Testing, Optimization, and Deployment (USD 4,500.00)
Complete end-to-end testing, SEO-friendly structure implementation, basic performance optimization, client review, and final project handover.

**Acceptance Criteria:**
- `[MANUAL]` **Final Acceptance Review**: Manual review and sign-off by the client of all deliverables against initial project requirements.
- `[HTTP_STATUS]` **Production Deployment Health Check**: Verify production environment returns 200 OK and meets performance standards.
"""

def test_user_agreement_rendering():
    # 1. Update contract with user's exact markdown
    proj = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}").json()
    contract_id = proj["contracts"][-1]["id"]
    res = requests.put(f"{BASE_URL}/contracts/{contract_id}", json={
        "content_markdown": USER_AGREEMENT_MARKDOWN,
        "editor_id": "user-freelancer-001"
    })
    assert res.status_code == 200, f"Update contract failed: {res.text}"
    print("[OK] Contract updated with user's exact markdown")

    # 2. Render in Playwright and capture screenshot
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
        import json
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.evaluate(f"""() => {{
            localStorage.setItem('trustbridge_token', 'demo-token-client-001');
            localStorage.setItem('trustbridge_user', '{json.dumps(client_user)}');
        }}""")

        # Go to Contract Tab
        page.goto(f"http://localhost:3000/projects/{PROJECT_ID}?tab=contract", wait_until="networkidle")
        time.sleep(2)
        screenshot_path = os.path.join(ARTIFACT_DIR, "11_user_agreement_rendered.png")
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"[SUCCESS] Screenshot saved to: {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    test_user_agreement_rendering()

