import requests

r = requests.get('http://localhost:8000/api/invoices/projects/ad911049-9a2c-4055-b945-93fefa0313fa')
invoices = r.json()
print(f"Total Invoices: {len(invoices)}")
for inv in invoices:
    print(inv.get('invoice_number'), inv.get('title'), inv.get('amount'), inv.get('status'))

