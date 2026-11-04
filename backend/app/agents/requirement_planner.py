from typing import Dict, Any, List

class RequirementPlannerAgent:
    """Agent 2 — Requirement Planner: Maps each acceptance criterion to an exact automated verification method."""

    def plan_verification(self, criteria: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        plan = []
        for c in criteria:
            v_type = c.get("verification_type", "BROWSER_INTERACTION")
            cfg = c.get("test_config_json") or {}
            
            method_desc = ""
            if v_type == "HTTP_STATUS":
                method_desc = f"HTTP probe checking target response status {cfg.get('expected_status', 200)} with timeout 8s."
            elif v_type == "RESPONSIVE_VIEWPORT":
                method_desc = "Playwright headless viewport test (375x667 mobile) verifying zero horizontal scroll overflow."
            elif v_type == "BROWSER_INTERACTION":
                method_desc = f"Playwright headless browser simulating user click on '{cfg.get('selector', 'button')}' and asserting DOM update."
            elif v_type == "CODE_INSPECTION":
                method_desc = "Repository static inspector verifying codebase structure, dependency lockfiles, and README."
            else:
                method_desc = "Cryptographically signed manual review checklist by project parties."

            plan.append({
                "criterion_id": c.get("id"),
                "criterion_title": c.get("title"),
                "verification_type": v_type,
                "strategy": method_desc,
                "automated": v_type != "MANUAL"
            })
        return plan

requirement_planner = RequirementPlannerAgent()

