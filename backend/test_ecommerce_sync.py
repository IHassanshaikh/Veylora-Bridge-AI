import requests

BASE_URL = 'http://localhost:8000/api'
proj_id = '8b3045b9-c163-45bd-99a6-337922ae4ae2'
proj = requests.get(f'{BASE_URL}/projects/{proj_id}').json()
print('Title:', proj['title'])
print('Initial DB Budget:', proj['budget'], 'Advance:', proj['advance_amount'])
contract_id = proj['contracts'][0]['id']

# Revise with AI instruction: 'client said it must be 1000 instead of 1500'
print("\n---> Calling AI edit...")
ai_res = requests.post(
    f'{BASE_URL}/contracts/{contract_id}/ai-edit',
    json={'instruction': 'client said it must be 1000 instead of 1500', 'role': 'freelancer', 'user_id': 'user-freelancer-001'}
).json()

print('AI Extracted Budget:', ai_res['extracted_budget'])
print('AI Extracted Advance:', ai_res['extracted_advance'])
print('AI Extracted Held Escrow:', ai_res['extracted_held_balance'])

# Save
print("\n---> Saving revised contract...")
save_res = requests.put(
    f'{BASE_URL}/contracts/{contract_id}?role=freelancer&user_id=user-freelancer-001',
    json={'content_markdown': ai_res['revised_markdown']}
).json()

# Verify
updated = requests.get(f'{BASE_URL}/projects/{proj_id}').json()
print('\n---> Universal Synchronization Results:')
print('Project Budget:', updated['budget'], 'USD')
print('Kickoff Advance:', updated['advance_amount'], 'USD')
print('Secured Held Escrow:', updated['held_balance'], 'USD')
for m in updated['milestones']:
    print(f"  Milestone: {m['title']} -> ${m['amount']} USD")

invoices = requests.get(f'{BASE_URL}/invoices/projects/{proj_id}').json()
for inv in invoices:
    print(f"  Invoice: {inv['invoice_number']} ({inv['invoice_type']}) -> ${inv['amount']} USD")

assert updated['budget'] == 1000.0, f"Budget is {updated['budget']}"
print("\nALL VERIFICATIONS PASSED FOR MODERN E-COMMERCE STOREFRONT!")

