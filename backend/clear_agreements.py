import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "trustbridge.db")
print(f"Connecting to database at: {db_path}")

conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Clean out all agreements and dynamic data
tables_to_clear = [
    "evidence",
    "verification_results",
    "verification_runs",
    "submissions",
    "acceptance_criteria",
    "milestones",
    "contracts",
    "payments",
    "disputes",
    "invitations",
    "audit_events",
    "projects",
]

for table in tables_to_clear:
    try:
        count_before = c.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        c.execute(f"DELETE FROM {table}")
        print(f"Cleared {count_before} rows from table '{table}'")
    except Exception as e:
        print(f"Error clearing {table}: {e}")

# 2. Ensure users table has hassanshaikh9717@gmail.com
# Check if hassanshaikh9717@gmail.com exists
existing = c.execute("SELECT id, email, name FROM users WHERE email = 'hassanshaikh9717@gmail.com'").fetchone()
if not existing:
    # Update hassanoffice9717@gmail.com if it exists, or insert new
    h_office = c.execute("SELECT id FROM users WHERE email = 'hassanoffice9717@gmail.com'").fetchone()
    if h_office:
        c.execute("UPDATE users SET email = 'hassanshaikh9717@gmail.com', paypal_email = 'hassanshaikh9717@gmail.com' WHERE email = 'hassanoffice9717@gmail.com'")
        print("Updated hassanoffice9717@gmail.com -> hassanshaikh9717@gmail.com")
    else:
        from app.api.auth import hash_password
        pwd = hash_password("Password123!")
        c.execute("""
            INSERT INTO users (id, name, email, role, password_hash, auth_provider, paypal_email)
            VALUES ('user-hassan-001', 'Hassan', 'hassanshaikh9717@gmail.com', 'client', ?, 'email', 'hassanshaikh9717@gmail.com')
        """, (pwd,))
        print("Inserted new user hassanshaikh9717@gmail.com")

conn.commit()

# Report final state
print("\n--- Current Database State ---")
print("Users:", c.execute("SELECT id, email, role, name FROM users").fetchall())
print("Projects count:", c.execute("SELECT COUNT(*) FROM projects").fetchone()[0])
print("Contracts count:", c.execute("SELECT COUNT(*) FROM contracts").fetchone()[0])
print("Disputes count:", c.execute("SELECT COUNT(*) FROM disputes").fetchone()[0])
conn.close()

