from typing import Dict, Any, List, Optional
from ..services.ai_service import ai_service

class DisputeAnalystAgent:
    """
    Agent 4 — Dispute Analyst & Triage:
    Impartially evaluates disputes by contrasting agreed contract criteria, conversation logs,
    and Playwright test evidence. If the dispute is serious, automatically escalates to the
    Admin Dispute Department and synthesizes a full executive dossier.
    """

    async def analyze(
        self,
        contract_title: str,
        milestone_title: str,
        agreed_criteria: list,
        client_argument: str,
        freelancer_argument: str,
        contract_markdown: Optional[str] = None,
        comments_log: Optional[List[Dict[str, str]]] = None,
        verification_summary: Optional[str] = None,
        dispute_amount: float = 0.0
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are the Chief Dispute Arbiter AI for Veylora Bridge AI. "
            "Analyze freelance project disputes impartially by examining: "
            "1) Signed contract terms and acceptance criteria "
            "2) The client's complaint and freelancer's defense "
            "3) The project conversation history and negotiation comments "
            "4) Automated Playwright proof-of-work verification evidence. "
            "Determine the severity: LOW (minor defect or misunderstanding solvable by retest), "
            "MEDIUM, HIGH, or CRITICAL (irreconcilable deadlock, fraudulent claim, or contract breach). "
            "If severity is HIGH or CRITICAL, flag for the Dispute Department (Admin) and provide a definitive "
            "recommendation on who is justified and whether funds should be released to contractor or refunded to client. "
            "Return JSON with: 'neutral_analysis', 'scope_creep_detected' (bool), 'defect_confirmed' (bool), "
            "'severity' ('LOW'|'MEDIUM'|'HIGH'|'CRITICAL'), 'escalate_to_admin' (bool), "
            "'recommended_action', 'justified_party' ('freelancer'|'client'|'compromise'), "
            "'admin_dossier_summary' (detailed markdown summary for the administrator)."
        )

        comments_text = "\n".join([f"[{c.get('author_role', 'user')} - {c.get('author_name', '')}]: {c.get('message', '')}" for c in (comments_log or [])])

        prompt = (
            f"Project: {contract_title} | Milestone: {milestone_title} (Disputed Amount: ${dispute_amount} USD)\n"
            f"Signed Acceptance Criteria:\n" + "\n".join([f"- {c}" for c in agreed_criteria]) + "\n\n"
            f"Client Argument: {client_argument}\n\n"
            f"Freelancer Defense: {freelancer_argument}\n\n"
            f"Conversation & Comments Thread:\n{comments_text or 'No preceding negotiation comments.'}\n\n"
            f"Automated Test Execution Evidence:\n{verification_summary or 'No automated test runs submitted yet.'}\n"
        )

        res = await ai_service.generate_structured_response(system_prompt, prompt)
        client_lower = (client_argument or "").lower()
        scope_creep_signals = [
            "also wanted", "in addition", "didn't include", "new feature", "extra page", 
            "redesign", "native app", "mobile app", "ios", "android", "out of scope",
            "did not build a native", "did not include a native", "additional"
        ]
        if res and "neutral_analysis" in res:
            if any(w in client_lower for w in scope_creep_signals):
                res["scope_creep_detected"] = True
            return res

        # Deterministic Rule-Based Fallback
        client_lower = (client_argument or "").lower()
        freelancer_lower = (freelancer_argument or "").lower()

        scope_creep_signals = [
            "also wanted", "in addition", "didn't include", "new feature", "extra page", 
            "redesign", "native app", "mobile app", "ios", "android", "out of scope",
            "did not build a native", "did not include a native", "additional"
        ]
        serious_signals = [
            "fraud", "scam", "breach", "refused", "never delivered", "stole",
            "cancel contract", "lawyer", "legal action", "unacceptable", "broken code"
        ]

        has_scope_creep = any(w in client_lower for w in scope_creep_signals)
        is_serious = any(w in client_lower or w in freelancer_lower for w in serious_signals) or dispute_amount >= 300

        severity = "HIGH" if is_serious else ("MEDIUM" if not has_scope_creep else "LOW")
        escalate = is_serious

        if has_scope_creep:
            justified = "freelancer"
            analysis = (
                "The client's complaint introduces requirements (e.g. mobile app or secondary features) "
                "that were not enumerated in the signed milestone acceptance criteria. "
                "The contractor developed the deliverables specified in the baseline agreement."
            )
            action = (
                "Release disputed milestone funds to the freelancer. "
                "Client may initiate a new milestone contract for requested out-of-scope additions."
            )
        else:
            justified = "client"
            analysis = (
                "The client's complaint identifies defects or incomplete deliverables against agreed criteria. "
                "Headless Playwright test runs did not verify full functional completion."
            )
            action = (
                "Hold escrow funds. Require contractor to submit a working build within 48 hours, "
                "or refund disputed milestone funds back to client PayPal wallet."
            )

        dossier = (
            f"### Dispute Department Executive Dossier\n"
            f"**Project:** {contract_title} | **Milestone:** {milestone_title} (${dispute_amount} USD)\n\n"
            f"#### 1. Case Breakdown\n"
            f"- **Client Claim:** {client_argument}\n"
            f"- **Contractor Defense:** {freelancer_argument}\n\n"
            f"#### 2. Contractual Analysis\n"
            f"{analysis}\n\n"
            f"#### 3. AI Impartial Recommendation\n"
            f"**Justified Party:** {justified.capitalize()}\n"
            f"**Recommended Ruling:** {action}\n"
        )

        return {
            "neutral_analysis": analysis,
            "scope_creep_detected": has_scope_creep,
            "defect_confirmed": not has_scope_creep,
            "severity": severity,
            "escalate_to_admin": escalate,
            "recommended_action": action,
            "justified_party": justified,
            "admin_dossier_summary": dossier
        }

dispute_analyst = DisputeAnalystAgent()
