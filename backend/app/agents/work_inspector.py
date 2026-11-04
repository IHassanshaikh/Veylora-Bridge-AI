from typing import Dict, Any, List
from ..services.ai_service import ai_service

class WorkInspectorAgent:
    """Agent 3 — Work Inspector: Reviews real automated test results and evidence, synthesizing an objective report without hallucinated passes."""

    async def inspect(self, submission_url: str, test_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        passed = [r for r in test_results if r.get("outcome") == "PASS"]
        failed = [r for r in test_results if r.get("outcome") == "FAIL"]
        review = [r for r in test_results if r.get("outcome") == "REVIEW"]

        total = len(test_results)
        passed_count = len(passed)
        failed_count = len(failed)
        review_count = len(review)

        # Build prompt for AI synthesis
        system_prompt = (
            "You are the Work Inspector AI for TrustBridge AI. "
            "Synthesize an objective completion finding based STRICTLY on concrete test results. "
            "Rule: Never invent or assume test results. Every statement must link to the test evidence. "
            "Return JSON with: 'summary', 'readiness' (APPROVED | REVISIONS_REQUIRED | BLOCKED), 'actionable_feedback' (list of strings)."
        )
        
        prompt = (
            f"Deliverable URL: {submission_url}\n"
            f"Total Tests: {total} | Passed: {passed_count} | Failed: {failed_count} | Needs Review: {review_count}\n"
            f"Test Details:\n"
        )
        for r in test_results:
            prompt += f"- Criterion: {r.get('criterion_id')} | Outcome: {r.get('outcome')} | Details: {r.get('details')}\n"

        ai_res = await ai_service.generate_structured_response(system_prompt, prompt)
        if ai_res and "summary" in ai_res:
            return {
                "summary": ai_res.get("summary"),
                "readiness": ai_res.get("readiness", "REVISIONS_REQUIRED" if failed_count > 0 else "APPROVED"),
                "actionable_feedback": ai_res.get("actionable_feedback", []),
                "passed_count": passed_count,
                "failed_count": failed_count,
                "review_count": review_count
            }

        # Deterministic evidence-backed synthesis
        if failed_count > 0:
            failed_reasons = [f"- {f.get('details', 'Requirement failed verification')}" for f in failed]
            summary = (
                f"Automated verification detected {failed_count} failing test(s). "
                f"The core functional flow does not satisfy agreed acceptance criteria. "
                f"Payment approval is held until revisions are submitted and reverified."
            )
            feedback = failed_reasons
            readiness = "REVISIONS_REQUIRED"
        elif review_count > 0:
            summary = f"All automated tests passed ({passed_count}/{total}), with {review_count} item(s) awaiting subjective stakeholder review."
            feedback = ["Review manually flagged deliverables before authorizing PayPal release."]
            readiness = "NEEDS_REVIEW"
        else:
            summary = f"All {passed_count} acceptance criteria independently verified via browser and HTTP probes. Ready for client milestone approval and PayPal payment."
            feedback = ["All criteria meet contract standards. Ready for client payment release."]
            readiness = "APPROVED"

        return {
            "summary": summary,
            "readiness": readiness,
            "actionable_feedback": feedback,
            "passed_count": passed_count,
            "failed_count": failed_count,
            "review_count": review_count
        }

work_inspector = WorkInspectorAgent()

