from typing import Dict, Any, List, Optional
from ..services.ai_service import ai_service

class ScopeChangeAnalystAgent:
    """Agent 3 — Scope Change Analyst: Compares communication or revision requests against baseline contract to detect scope creep and draft formal amendments."""

    async def analyze_scope(
        self,
        contract_title: str,
        baseline_milestones: List[Dict[str, Any]],
        message_or_request: str
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are the Scope Change Analyst AI for TrustBridge AI. "
            "Evaluate whether an incoming client request or revision is covered by the baseline locked contract, "
            "or constitutes out-of-scope feature expansion ('scope creep'). "
            "If out-of-scope, draft a structured contract amendment proposal with suggested compensation and additional days. "
            "Return JSON with: "
            "'classification' ('WITHIN_SCOPE' | 'MINOR_ADJUSTMENT' | 'SCOPE_CREEP'), "
            "'is_out_of_scope' (bool), "
            "'analysis' (string explanation), "
            "'amendment_proposal': { 'title': str, 'suggested_amount': float, 'suggested_days': int, 'deliverables': list of str } or null."
        )

        milestones_desc = "\n".join([
            f"- Milestone: {m.get('title')} (Description: {m.get('description', '')})"
            for m in baseline_milestones
        ])

        user_prompt = (
            f"Contract: {contract_title}\n"
            f"Baseline Milestones:\n{milestones_desc}\n\n"
            f"New Request/Message to Analyze:\n\"{message_or_request}\""
        )

        res = await ai_service.generate_structured_response(system_prompt, user_prompt)
        if res and "classification" in res and "analysis" in res:
            return res

        # Resilient fallback analysis
        req_lower = message_or_request.lower()
        expansion_signals = [
            "also add", "new page", "mobile app", "native app", "extra feature",
            "different color scheme", "complete redesign", "backend database",
            "push notifications", "multi-language", "stripe integration", "payment gateway"
        ]

        is_expansion = any(s in req_lower for s in expansion_signals)

        if is_expansion:
            return {
                "classification": "SCOPE_CREEP",
                "is_out_of_scope": True,
                "analysis": (
                    "The client's message introduces deliverables that were not specified in the signed agreement. "
                    "While valuable, incorporating these elements requires extending the project timeline and budget."
                ),
                "amendment_proposal": {
                    "title": "Addendum Milestone: Supplementary Feature Scope",
                    "suggested_amount": 250.0,
                    "suggested_days": 3,
                    "deliverables": [
                        "Implementation of supplementary requested feature",
                        "Integration testing and responsive layout verification",
                        "Updated deployment and documentation handoff"
                    ]
                }
            }
        else:
            return {
                "classification": "WITHIN_SCOPE",
                "is_out_of_scope": False,
                "analysis": (
                    "The request falls within standard clarification and refinement of the existing milestone deliverables. "
                    "No formal contract amendment or budget increase is required."
                ),
                "amendment_proposal": None
            }

scope_change_analyst = ScopeChangeAnalystAgent()

