import json
from typing import Dict, Any, List, Optional
from ..services.ai_service import ai_service

class DealGuardianAgent:
    """Agent 2 — Deal Guardian: Analyzes contract proposals for ambiguity, unrealistic deadlines, and scope risks."""

    async def analyze_risks(
        self,
        project_title: str,
        brief: str,
        budget: float,
        milestones: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are the Deal Guardian AI for TrustBridge AI. "
            "Analyze a proposed freelance contract or brief to identify ambiguities, scope hazards, unrealistic timelines, "
            "and missing objective verification criteria. "
            "Protect both client and freelancer by identifying vague wording (e.g. 'clean design', 'fast app') and suggesting measurable clauses. "
            "Return JSON with: "
            "'risk_level' ('LOW' | 'MEDIUM' | 'HIGH'), "
            "'health_score' (0-100 integer), "
            "'ambiguities_detected' (list of strings), "
            "'scope_risks' (list of strings), "
            "'recommendations' (list of strings), "
            "'summary' (string)."
        )

        milestone_summary = ""
        if milestones:
            milestone_summary = "\nMilestones Proposed:\n" + "\n".join([
                f"- {m.get('title')}: ${m.get('amount')} (Criteria count: {len(m.get('criteria', []))})"
                for m in milestones
            ])

        user_prompt = (
            f"Project: {project_title}\n"
            f"Budget: ${budget}\n"
            f"Brief:\n{brief}\n"
            f"{milestone_summary}"
        )

        res = await ai_service.generate_structured_response(system_prompt, user_prompt)
        if res and "risk_level" in res and "health_score" in res:
            return res

        # Resilient heuristic risk evaluator
        brief_lower = brief.lower()
        ambiguous_terms = ["modern", "clean", "fast", "user-friendly", "intuitive", "bug-free", "scalable"]
        detected_ambiguities = [f"Subjective term '{term}' lacks quantifiable benchmark." for term in ambiguous_terms if term in brief_lower]

        risks = []
        if budget < 200:
            risks.append("Low budget relative to multi-milestone scope may increase abandonment risk.")
        if not milestones or len(milestones) < 2:
            risks.append("Single-payment milestone increases financial exposure; recommending phased milestones.")

        health_score = 88
        if detected_ambiguities:
            health_score -= len(detected_ambiguities) * 8
        if risks:
            health_score -= len(risks) * 10
        health_score = max(35, min(98, health_score))

        risk_level = "LOW" if health_score >= 80 else ("MEDIUM" if health_score >= 60 else "HIGH")

        return {
            "risk_level": risk_level,
            "health_score": health_score,
            "ambiguities_detected": detected_ambiguities or ["No critical subjective phrasing detected."],
            "scope_risks": risks or ["Scope appears well-bounded with testable expectations."],
            "recommendations": [
                "Ensure every milestone binds to at least one automated HTTP or browser test.",
                "Clarify revision limits (standard: up to 2 review cycles per milestone).",
                "Lock contract version prior to releasing advance PayPal funds."
            ],
            "summary": f"Deal Guardian verified contract health with {health_score}/100 score. Risk is {risk_level}."
        }

deal_guardian = DealGuardianAgent()
