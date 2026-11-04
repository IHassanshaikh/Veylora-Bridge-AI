from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/demo-store", tags=["Demo E-Commerce Target"])

# In-memory toggle state for the live hackathon demonstration
DEMO_STATE = {
    "checkout_bug_active": True,  # Starts in broken checkout state as per demo storyboard
    "cart": []
}

class ToggleBugRequest(BaseModel):
    bug_active: bool

class CheckoutRequest(BaseModel):
    items: List[Dict[str, Any]] = []
    customer_email: str = "customer@example.com"
    shipping_address: str = "123 Hackathon Ave, San Francisco, CA"

@router.get("/status")
def get_store_status():
    return {
        "store_name": "ApexStorefront Pro",
        "checkout_bug_active": DEMO_STATE["checkout_bug_active"],
        "status": "ONLINE",
        "cart_items_count": len(DEMO_STATE["cart"])
    }

@router.post("/toggle-bug")
def toggle_checkout_bug(req: ToggleBugRequest):
    DEMO_STATE["checkout_bug_active"] = req.bug_active
    return {
        "success": True,
        "checkout_bug_active": DEMO_STATE["checkout_bug_active"],
        "message": "Bug enabled (Checkout will fail test)" if req.bug_active else "Bug fixed (Checkout will pass test)"
    }

@router.get("/products")
def list_products():
    return [
        {
            "id": "prod-1",
            "name": "Neural Quantum Headset",
            "price": 299.00,
            "category": "Hardware",
            "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
            "description": "Spatial AI audio processing with low-latency neural cancellation."
        },
        {
            "id": "prod-2",
            "name": "Developer Mechanical Keyboard",
            "price": 185.00,
            "category": "Peripherals",
            "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
            "description": "Hot-swappable switches with gasket mount dampening."
        },
        {
            "id": "prod-3",
            "name": "Ultra-Wide Curve Monitor 34\"",
            "price": 649.00,
            "category": "Displays",
            "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80",
            "description": "144Hz refresh rate with 99% sRGB color gamut coverage."
        }
    ]

@router.post("/checkout")
def execute_checkout(req: CheckoutRequest):
    if DEMO_STATE["checkout_bug_active"]:
        raise HTTPException(
            status_code=500,
            detail="Uncaught TypeError: Cannot read properties of undefined (reading 'processPayment') in checkout.js:142. Transaction aborted."
        )

    DEMO_STATE["cart"] = []
    return {
        "status": "SUCCESS",
        "transaction_id": "APEX-TX-849182",
        "message": "Checkout completed successfully. Order dispatched to fulfillment pipeline.",
        "verified": True
    }

