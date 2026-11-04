from typing import Dict, Any, Optional
from ..services.ai_service import ai_service

class PaymentExplanationAssistantAgent:
    """Agent 7 — Payment Explanation Assistant: Explains advance deposits, held-balance escrow, milestone releases, and deduction logic in clear, accessible language."""

    async def explain_payment_status(
        self,
        project_title: str,
        total_budget: float,
        advance_amount: float,
        advance_status: str,
        held_balance: float,
        held_balance_status: str,
        milestones: list,
        user_question: Optional[str] = None
    ) -> Dict[str, Any]:
        released_amount = sum(
            m.get("amount", 0.0) for m in milestones 
            if m.get("status") in ["APPROVED", "PAID"]
        )
        pending_amount = max(0.0, total_budget - advance_amount - released_amount)

        system_prompt = (
            "You are the Payment Explanation Assistant for TrustBridge AI (PayFlow). "
            "Explain financial state machines clearly to clients and freelancers. "
            "Clarify how the hybrid model operates: "
            "1. Advance Deposit (paid via PayPal to commence kickoff) "
            "2. Held Balance (secured balance allocated across milestones, released only upon verified proof-of-work) "
            "3. Milestone Disbursements (triggered following client signoff or automated test approval). "
            "Maintain transparency: remind users that TrustBridge coordinates payment approvals via PayPal, "
            "and milestone funds remain secured until test criteria are verified. "
            "Return JSON with: 'summary', 'breakdown_explanation', 'next_action', 'faq_answers' (list of strings)."
        )

        user_prompt = (
            f"Project: {project_title}\n"
            f"Total Budget: ${total_budget}\n"
            f"Advance Deposit: ${advance_amount} (Status: {advance_status})\n"
            f"Secured Held Escrow: ${held_balance} (Status: {held_balance_status})\n"
            f"Milestones Released: ${released_amount}\n"
            f"Remaining Milestone Balance: ${pending_amount}\n"
            f"User Query: {user_question or 'Please explain the financial status of this project.'}"
        )

        res = await ai_service.generate_structured_response(system_prompt, user_prompt)
        if res and "summary" in res:
            return {
                **res,
                "financial_metrics": {
                    "total_budget": total_budget,
                    "advance_amount": advance_amount,
                    "advance_status": advance_status,
                    "held_balance": held_balance,
                    "held_balance_status": held_balance_status,
                    "released_amount": released_amount,
                    "pending_amount": pending_amount
                }
            }

        # Deterministic financial explanation
        summary = (
            f"Of the ${total_budget} total project value, ${advance_amount} is allocated as an upfront kickoff deposit "
            f"({advance_status}). The remaining ${total_budget - advance_amount} is secured across {len(milestones)} milestones, "
            f"with ${released_amount} disbursed to date."
        )

        breakdown = (
            f"• Upfront Advance: ${advance_amount} — {advance_status}. Released directly to activate freelancer onboarding.\n"
            f"• Milestone Held Balance: ${held_balance} — {held_balance_status}. Locked until automated verification passes.\n"
            f"• Disbursed to Date: ${released_amount} across verified milestones.\n"
            f"• Remaining to Release: ${pending_amount} upon criteria fulfillment."
        )

        next_action = "Review active milestone deliverables and run verification test suite."
        if advance_status == "PENDING":
            next_action = "Client needs to authorize the upfront PayPal kickoff deposit."
        elif pending_amount == 0 and advance_status == "PAID":
            next_action = "All contract milestones have been funded and disbursed."

        return {
            "summary": summary,
            "breakdown_explanation": breakdown,
            "next_action": next_action,
            "faq_answers": [
                "Funds are never arbitrarily transferred without verified criteria or explicit approval.",
                "Advance payments are captured immediately via PayPal Orders v2.",
                "Held escrow releases require both test suite certification and client sign-off."
            ],
            "financial_metrics": {
                "total_budget": total_budget,
                "advance_amount": advance_amount,
                "advance_status": advance_status,
                "held_balance": held_balance,
                "held_balance_status": held_balance_status,
                "released_amount": released_amount,
                "pending_amount": pending_amount
            }
        }

payment_explanation_assistant = PaymentExplanationAssistantAgent()

