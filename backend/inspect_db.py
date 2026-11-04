import sqlite3

conn = sqlite3.connect('backend/trustbridge.db')
cur = conn.cursor()

print("INVOICES COLUMNS:")
cur.execute('PRAGMA table_info(invoices)')
for col in cur.fetchall():
    print(col[1], col[2])

print("\nINVOICES for ad9110:")
cur.execute('SELECT * FROM invoices WHERE project_id LIKE "%ad9110%"')
cols = [c[0] for c in cur.description]
for inv in cur.fetchall():
    print(dict(zip(cols, inv)))

print("\nMILESTONES for ad9110:")
cur.execute('SELECT * FROM milestones WHERE project_id LIKE "%ad9110%"')
cols_m = [c[0] for c in cur.description]
for m in cur.fetchall():
    print(dict(zip(cols_m, m)))
