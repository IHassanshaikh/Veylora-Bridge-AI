import requests
import json
import sqlite3

BASE_URL = "http://localhost:8000/api"

def run_test():
    # 1. Fetch all projects
    res = requests.get(f"{BASE_URL}/projects")
    assert res.status_code == 200, f"Failed to list projects: {res.text}"
    projects = res.json()
    assert len(projects) > 0, "No projects found"

    # Select project 'af202923-136e-48b9-afaf-8df32a6f87b5' or the first one
    proj = next((p for p in projects if p["id"] == "af202923-136e-48b9-afaf-8df32a6f87b5"), projects[0])
    project_id = proj["id"]
    print(f"Testing on project: {project_id} ('{proj['title']}')")
    print(f"Initial DB Budget: ${proj['budget']}, Advance: ${proj['advance_amount']}, Held: ${proj['held_balance']}")

    contract = proj["contracts"][0] if proj.get("contracts") else None
    assert contract is not None, "Project has no contracts"
    contract_id = contract["id"]

    # 2. Test AI Revision Endpoint with comment: 'client said it must be 1000 instead of 1500'
    instruction = "client said it must be 1000 instead of 1500"
    print(f"\n---> Calling AI Revision endpoint with: '{instruction}'...")
    ai_res = requests.post(
        f"{BASE_URL}/contracts/{contract_id}/ai-edit",
        json={"instruction": instruction, "role": "freelancer", "user_id": "user-freelancer-001"}
    )
    assert ai_res.status_code == 200, f"AI Edit failed: {ai_res.text}"
    ai_data = ai_res.json()

    print(f"AI Extracted Budget: ${ai_data['extracted_budget']}")
    print(f"AI Extracted Advance: ${ai_data['extracted_advance']}")
    print(f"AI Extracted Held Escrow: ${ai_data['extracted_held_balance']}")
    print(f"AI Summary of Changes: {ai_data['summary_of_changes']}")
    assert ai_data["extracted_budget"] == 1000.0, f"Expected 1000.0, got {ai_data['extracted_budget']}"

    # 3. Save the revised contract
    print(f"\n---> Saving revised contract (PUT /api/contracts/{contract_id})...")
    save_res = requests.put(
        f"{BASE_URL}/contracts/{contract_id}?role=freelancer&user_id=user-freelancer-001",
        json={"content_markdown": ai_data["revised_markdown"]}
    )
    assert save_res.status_code == 200, f"Contract update failed: {save_res.text}"

    # 4. Fetch updated project and verify synchronization everywhere
    print("\n---> Verifying universal synchronization on Project...")
    proj_res = requests.get(f"{BASE_URL}/projects/{project_id}")
    assert proj_res.status_code == 200
    updated_proj = proj_res.json()

    print(f"Updated Project Budget: ${updated_proj['budget']} USD (Expected 1000.0)")
    print(f"Updated Kickoff Advance: ${updated_proj['advance_amount']} USD")
    print(f"Updated Held Escrow: ${updated_proj['held_balance']} USD")
    assert updated_proj["budget"] == 1000.0
    assert round(updated_proj["advance_amount"] + updated_proj["held_balance"], 2) == 1000.0

    # 5. Verify Milestones
    print("\n---> Verifying Milestones...")
    milestones = updated_proj["milestones"]
    print(f"Milestones Count: {len(milestones)}")
    for m in milestones:
        print(f"  - {m['title']}: ${m['amount']} USD (Status: {m['status']})")
    ms_sum = sum(m["amount"] for m in milestones)
    print(f"Milestones Sum: ${ms_sum} USD")
    assert ms_sum in (updated_proj["held_balance"], updated_proj["budget"])

    # 6. Verify Invoices
    print("\n---> Verifying Invoices...")
    inv_res = requests.get(f"{BASE_URL}/invoices/projects/{project_id}")
    assert inv_res.status_code == 200
    invoices = inv_res.json()
    print(f"Invoices Count: {len(invoices)}")
    for inv in invoices:
        print(f"  - {inv['invoice_number']} ({inv['invoice_type']}): ${inv['amount']} USD - {inv['title']}")
        if inv["invoice_type"] == "ADVANCE":
            assert inv["amount"] == updated_proj["advance_amount"], f"Advance invoice amount {inv['amount']} != {updated_proj['advance_amount']}"

    print("\n=======================================================")
    print("ALL TESTS PASSED: UNIVERSAL FINANCIAL SYNC VERIFIED OK!")
    print("=======================================================")

if __name__ == "__main__":
    run_test()
