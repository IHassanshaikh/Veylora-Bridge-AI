import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        # Go to landing page and click Alex Rivera (Client) Fast Pass
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.click("text=Alex Rivera")
        await page.wait_for_url("**/dashboard", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/06_client_empty_dashboard.png")
        print("Captured 06_client_empty_dashboard.png")

        # Also test Admin fast pass
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        await page.click("text=Admin")
        await page.wait_for_url("**/dashboard", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path="C:/Users/hassa/.gemini/antigravity/brain/31be1c57-89bd-4f1d-98b8-d0b02afbaa83/07_admin_empty_dashboard.png")
        print("Captured 07_admin_empty_dashboard.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
