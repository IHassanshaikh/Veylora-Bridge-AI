import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        # 1. Landing Page
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/01_landing_page.png")
        print("Captured 01_landing_page.png")

        # 2. Contact Page
        await page.goto("http://localhost:3000/contact", wait_until="networkidle")
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/02_contact_page.png")
        print("Captured 02_contact_page.png")

        # 3. Privacy Page
        await page.goto("http://localhost:3000/privacy", wait_until="networkidle")
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/03_privacy_page.png")
        print("Captured 03_privacy_page.png")

        # 4. Terms Page
        await page.goto("http://localhost:3000/terms", wait_until="networkidle")
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/04_terms_page.png")
        print("Captured 04_terms_page.png")

        # 5. Dashboard (Empty state)
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/05_empty_dashboard.png")
        print("Captured 05_empty_dashboard.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

