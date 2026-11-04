from app.database import engine, Base
from app import models
import sqlite3

Base.metadata.create_all(bind=engine)

conn = sqlite3.connect('trustbridge.db')
c = conn.cursor()
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Current DB Tables:", tables)
assert "invoices" in tables, "invoices table missing!"
assert "contract_comments" in tables, "contract_comments table missing!"
print("All tables successfully verified!")
