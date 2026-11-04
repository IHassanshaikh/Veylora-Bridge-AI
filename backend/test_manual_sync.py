import requests

BASE_URL = 'http://localhost:8000/api'
proj_id = 'af202923-136e-48b9-afaf-8df32a6f87b5'
proj = requests.get(f'{BASE_URL}/projects/{proj_id}').json()
contract_id = proj['contracts'][0]['id']

manual_markdown = """# Cloud Native API Gateway Agreement (Manual Revision)

**Summary:** API gateway implementation.
**Terms & Policy:** Total project budget is USD 800.0 structured across 3 milestones.

## Agreed Milestones & Testable Acceptance Criteria

### Milestone 1: Setup & Kickoff (USD 200.00)
Setup initial repo and infra.
**Acceptance Criteria:**
- `[HTTP_STATUS]` **Health Check**: Deployment URL returns 200 OK.

### Milestone 2: Core Routing Engine (USD 300.00)
Proxy routing and JWT auth.
**Acceptance Criteria:**
- `[BROWSER_INTERACTION]` **Routing Test**: Test endpoint routing.

### Milestone 3: Production Deployment (USD 300.00)
Final production handover.
**Acceptance Criteria:**
- `[CODE_INSPECTION]` **Code Quality**: Check zero vulnerabilities.
"""

print('---> Saving manual contract edit...')
res = requests.put(
    f'{BASE_URL}/contracts/{contract_id}?role=freelancer&user_id=user-freelancer-001',
    json={'content_markdown': manual_markdown}
)
assert res.status_code == 200, f'Manual edit failed: {res.text}'

updated = requests.get(f'{BASE_URL}/projects/{proj_id}').json()
print('Manual Edit Synced Budget:', updated['budget'])
print('Manual Edit Synced Advance:', updated['advance_amount'])
print('Manual Edit Synced Held:', updated['held_balance'])
assert updated['budget'] == 800.0
assert updated['advance_amount'] == 200.0
assert updated['held_balance'] == 600.0

invoices = requests.get(f'{BASE_URL}/invoices/projects/{proj_id}').json()
print('Invoices synced count:', len(invoices))
for inv in invoices:
    print(f"  {inv['invoice_number']}: ${inv['amount']} USD")
print('MANUAL EDIT SYNC PASSED!')

