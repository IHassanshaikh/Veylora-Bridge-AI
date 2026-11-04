from typing import Dict, Any, Optional
from ..services.paypal_service import paypal_service

class PaymentCoordinatorAgent:
    """Agent 5 — Payment Coordinator: Evaluates milestone verification status, checks payment readiness, and coordinates PayPal Orders v2 transactions."""

    def check_payment_readiness(self, milestone_status: str, passed_count: int, failed_count: int) -> Dict[str, Any]:
        """Validates whether a milestone is legitimately eligible for payment initiation."""
        if failed_count > 0:
            return {
                "ready": False,
                "reason": f"Payment blocked: {failed_count} failing acceptance criteria detected.",
                "allowed_actions": ["REQUEST_REVISION", "DISPUTE"]
            }
        
        if passed_count == 0:
            return {
                "ready": False,
                "reason": "Payment blocked: No automated proof of work has been certified yet.",
                "allowed_actions": ["RUN_VERIFICATION"]
            }

        return {
            "ready": True,
            "reason": f"Payment authorized: All {passed_count} acceptance criteria certified via tamper-evident proof of work.",
            "allowed_actions": ["APPROVE_AND_PAY"]
        }

    async def initiate_milestone_payment(self, milestone_id: str, amount: float, currency: str, milestone_title: str) -> Dict[str, Any]:
        """Prepares PayPal order for the verified milestone."""
        order_res = await paypal_service.create_order(
            milestone_id=milestone_id,
            amount=amount,
            currency=currency,
            description=f"TrustBridge Verified Milestone: {milestone_title}"
        )
        return order_res

    async def finalize_milestone_payment(self, paypal_order_id: str) -> Dict[str, Any]:
        """Executes server-side PayPal order capture."""
        capture_res = await paypal_service.capture_order(order_id=paypal_order_id)
        return capture_res

payment_coordinator = PaymentCoordinatorAgent()

