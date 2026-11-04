import json
import re
from typing import Dict, Any, List, Optional
from ..services.ai_service import ai_service

class ContractArchitectAgent:
    """Agent 1 — Contract Architect: Converts a project brief into structured, measurable milestones with testable acceptance criteria."""

    async def generate_contract(self, brief: str, project_title: str, budget: float, currency: str = "USD", target_days: int = 14) -> Dict[str, Any]:
        system_prompt = (
            "You are the Contract Architect AI for TrustBridge AI. "
            "Convert informal client project requirements into a professional, legally-structured, and measurable freelance milestone contract. "
            "Each milestone must have unambiguous, objectively testable acceptance criteria with verification types: "
            "'BROWSER_INTERACTION', 'HTTP_STATUS', 'RESPONSIVE_VIEWPORT', 'CODE_INSPECTION', or 'MANUAL'. "
            "Return JSON only with fields: title, summary, terms, milestones (list of {title, description, amount, due_days, criteria: [{title, description, verification_type, test_config_json}]})."
        )
        user_prompt = f"Project: {project_title}\nBudget: {currency} {budget}\nTimeline: {target_days} days\nClient Brief:\n{brief}"

        res = await ai_service.generate_structured_response(system_prompt, user_prompt)
        if res and "milestones" in res:
            return res

        # Intelligent domain-aware contract generator fallback
        milestone_1_amt = round(budget * 0.35, 2)
        milestone_2_amt = round(budget * 0.45, 2)
        milestone_3_amt = round(budget - (milestone_1_amt + milestone_2_amt), 2)

        return {
            "title": f"Freelance Agreement: {project_title}",
            "summary": f"Milestone-based technical contract for {project_title} with total budget {currency} {budget}.",
            "terms": "Work must satisfy automated proof-of-work criteria prior to payment release via PayPal. Mutually agreed scope is locked upon signing.",
            "milestones": [
                {
                    "title": "Milestone 1: Core Architecture & Responsive UI",
                    "description": "Initial setup, core layouts, mobile responsiveness, and deployment to staging.",
                    "amount": milestone_1_amt,
                    "due_days": 4,
                    "criteria": [
                        {
                            "title": "Homepage and Landing View Loads",
                            "description": "Deployment URL returns HTTP 200 OK and renders within 3 seconds.",
                            "verification_type": "HTTP_STATUS",
                            "test_config_json": {"expected_status": 200}
                        },
                        {
                            "title": "Mobile Viewport Responsiveness",
                            "description": "Page renders with no horizontal overflow on mobile viewport (375x667).",
                            "verification_type": "RESPONSIVE_VIEWPORT",
                            "test_config_json": {"viewport": {"width": 375, "height": 667}}
                        }
                    ]
                },
                {
                    "title": "Milestone 2: Functional Features & Interactive Flows",
                    "description": "Interactive UI components, product cart management, and checkout workflow.",
                    "amount": milestone_2_amt,
                    "due_days": 8,
                    "criteria": [
                        {
                            "title": "Interactive Product & Cart Update",
                            "description": "User can select an item and add to cart; cart count updates immediately in DOM.",
                            "verification_type": "BROWSER_INTERACTION",
                            "test_config_json": {"selector": "[data-testid='add-to-cart'], button.add-to-cart", "action": "click"}
                        },
                        {
                            "title": "Checkout Flow Validation",
                            "description": "Checkout form validates required inputs and initiates order processing without JavaScript exceptions.",
                            "verification_type": "BROWSER_INTERACTION",
                            "test_config_json": {"selector": "[data-testid='submit-checkout'], button.checkout", "action": "click", "target_feature": "checkout_submission"}
                        }
                    ]
                },
                {
                    "title": "Milestone 3: Final Integration, QA & Production Deployment",
                    "description": "Production readiness, SSL configuration, documentation, and clean handoff.",
                    "amount": milestone_3_amt,
                    "due_days": target_days,
                    "criteria": [
                        {
                            "title": "Live Production Health & SSL Verification",
                            "description": "Production endpoint is accessible via HTTPS with valid security certificates.",
                            "verification_type": "HTTP_STATUS",
                            "test_config_json": {"expected_status": 200}
                        },
                        {
                            "title": "Clean Codebase & Repository Documentation",
                            "description": "GitHub repository contains README with setup instructions and zero critical security advisories.",
                            "verification_type": "CODE_INSPECTION",
                            "test_config_json": {"check_readme": True}
                        }
                    ]
                }
            ]
        }

    async def revise_contract_with_instruction(
        self,
        current_markdown: str,
        instruction: str,
        project_title: str,
        current_budget: float,
        currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Revises an existing contract markdown and automatically recalculates all financial terms based on
        free-text user instructions / comments (e.g. 'client said it must be 1000 instead of 1500').
        """
        # Step 1: Detect requested target budget from instruction
        target_budget = self._extract_target_budget(instruction)

        # Step 2: Attempt LLM-powered revision via Gemini
        system_prompt = (
            "You are the Contract Architect AI for Veylora Bridge AI. "
            "You revise freelance software agreements based on client or contractor instructions. "
            "If the instruction specifies a new budget (e.g. 'budget must be 1000 instead of 1500'), "
            "you MUST update the total agreed value, update the advance amount, and adjust all milestone amounts "
            "so their sum matches the new budget exactly. "
            "Preserve clean, professional Markdown formatting with standard headers (#, ##, ###), "
            "milestone amounts in format '### Milestone Title (USD X,XXX.XX)', and acceptance criteria bullet lists. "
            "Return JSON only: { 'revised_markdown': string, 'total_budget': float, 'advance_amount': float, 'summary_of_changes': string }."
        )
        user_prompt = (
            f"Project: {project_title}\nCurrent Baseline Budget: {currency} {current_budget:,.2f}\n"
            f"User Instruction / Comment:\n\"{instruction}\"\n\n"
            f"Current Agreement Markdown:\n{current_markdown}"
        )

        res = await ai_service.generate_structured_response(system_prompt, user_prompt)
        if res and "revised_markdown" in res and res.get("revised_markdown"):
            revised_md = res["revised_markdown"]
            # Verify if target_budget was given and matches or if LLM returned total_budget
            extracted_budget = float(res.get("total_budget") or target_budget or current_budget)
            extracted_advance = float(res.get("advance_amount") or round(extracted_budget * 0.30, 2))
            return {
                "revised_markdown": revised_md,
                "extracted_budget": extracted_budget,
                "extracted_advance": extracted_advance,
                "extracted_held_balance": round(max(0.0, extracted_budget - extracted_advance), 2),
                "summary_of_changes": res.get("summary_of_changes") or f"Agreement revised per instruction: '{instruction}'"
            }

        # Step 3: High-precision deterministic fallback revision engine
        return self._deterministic_revision(
            current_markdown=current_markdown,
            instruction=instruction,
            target_budget=target_budget,
            current_budget=current_budget,
            currency=currency
        )

    def _extract_target_budget(self, instruction: str) -> Optional[float]:
        """Extracts desired budget amount from informal comments like 'must be 1000 instead of 1500'."""
        text = instruction or ""
        
        # 1. Phrases indicating new price/budget target
        p1 = re.search(
            r'(?:must\s+be|should\s+be|change\s+to|set\s+to|reduce\s+to|budget\s+to|price\s+to|negotiated\s+to|adjust\s+to|make\s+it|wants|budget|price|is)\s*(?:of|is|:)?\s*(?:USD|\$)?\s*([\d,]+(?:\.\d+)?)',
            text,
            re.IGNORECASE
        )
        if p1:
            try:
                val = float(p1.group(1).replace(',', ''))
                if val > 0:
                    return val
            except ValueError:
                pass

        # 2. '1000 instead of 1500' pattern
        p2 = re.search(r'([\d,]+(?:\.\d+)?)\s*(?:instead\s+of|rather\s+than)', text, re.IGNORECASE)
        if p2:
            try:
                val = float(p2.group(1).replace(',', ''))
                if val > 0:
                    return val
            except ValueError:
                pass

        # 3. Explicit currency symbol
        p3 = re.search(r'(?:USD|\$)\s*([\d,]+(?:\.\d+)?)', text, re.IGNORECASE)
        if p3:
            try:
                val = float(p3.group(1).replace(',', ''))
                if val > 0:
                    return val
            except ValueError:
                pass

        return None

    def _deterministic_revision(
        self,
        current_markdown: str,
        instruction: str,
        target_budget: Optional[float],
        current_budget: float,
        currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Scales and rewrites markdown agreement deterministically when LLM is unavailable or for instant latency.
        """
        md = current_markdown or ""
        effective_new_budget = target_budget if target_budget and target_budget > 0 else current_budget

        # Find all milestone headers: ### Title (USD X,XXX.XX)
        milestone_pattern = re.compile(
            r'###\s+([^\n(]+?)\s*\((?:USD|\$)?\s*([\d,]+(?:\.\d+)?)\)',
            re.IGNORECASE
        )
        matches = list(milestone_pattern.finditer(md))

        # Calculate actual baseline budget from existing markdown milestones if present
        if matches:
            actual_existing_ms_sum = sum(float(m.group(2).replace(',', '')) for m in matches)
            baseline_budget = actual_existing_ms_sum if actual_existing_ms_sum > 0 else current_budget
        else:
            baseline_budget = current_budget

        scale_ratio = (effective_new_budget / baseline_budget) if baseline_budget > 0 else 1.0

        new_milestones_amounts = []
        running_sum = 0.0

        if matches:
            for idx, m in enumerate(matches):
                old_amt = float(m.group(2).replace(',', ''))
                if idx == len(matches) - 1:
                    # Last milestone absorbs rounding difference so total equals exactly effective_new_budget
                    new_amt = round(effective_new_budget - running_sum, 2)
                else:
                    new_amt = round(old_amt * scale_ratio, 2)
                    running_sum += new_amt
                new_milestones_amounts.append((m, new_amt))

            # Replace from end to start to preserve indices
            for m, new_amt in reversed(new_milestones_amounts):
                title = m.group(1).strip()
                replacement = f"### {title} ({currency} {new_amt:,.2f})"
                md = md[:m.start()] + replacement + md[m.end():]

        # Update Budget in Terms / Summary text
        budget_text_pat = re.compile(
            r'(Total project budget is USD\s*)([\d,]+(?:\.\d+)?)',
            re.IGNORECASE
        )
        if budget_text_pat.search(md):
            md = budget_text_pat.sub(rf'\g<1>{effective_new_budget:,.1f}', md)
        else:
            # Replace other budget mentions
            md = re.sub(
                r'(Total budget:\s*USD\s*)([\d,]+(?:\.\d+)?)',
                rf'\g<1>{effective_new_budget:,.2f}',
                md,
                flags=re.IGNORECASE
            )

        # Calculate advance
        advance_amt = 0.0
        for m, amt in new_milestones_amounts:
            if any(w in m.group(1).lower() for w in ["advance", "kickoff", "confirmation"]):
                advance_amt = amt
                break

        if advance_amt == 0.0 and effective_new_budget > 0:
            advance_amt = round(effective_new_budget * 0.30, 2)

        held_bal = round(max(0.0, effective_new_budget - advance_amt), 2)

        # Append revision notice if instruction was provided
        revision_note = f"\n\n> **AI Revision Applied:** {instruction} — Project budget recalculated to {currency} {effective_new_budget:,.2f}."
        if revision_note not in md:
            md = md.strip() + revision_note

        return {
            "revised_markdown": md,
            "extracted_budget": effective_new_budget,
            "extracted_advance": advance_amt,
            "extracted_held_balance": held_bal,
            "summary_of_changes": f"Agreement updated per instruction: budget recalculated to {currency} {effective_new_budget:,.2f}."
        }

contract_architect = ContractArchitectAgent()
