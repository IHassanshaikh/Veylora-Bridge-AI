import sqlite3
from pathlib import Path
from app.database import engine, Base
import app.models.models  # ensure models are loaded

db_path = Path(__file__).resolve().parent / "trustbridge.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables in SQLite
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
existing_tables = set(row[0] for row in cursor.fetchall())

for table_name, table in Base.metadata.tables.items():
    if table_name in existing_tables:
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = set(row[1] for row in cursor.fetchall())
        for col in table.columns:
            if col.name not in existing_cols:
                col_type = "TEXT"
                type_str = str(col.type).upper()
                if "INT" in type_str:
                    col_type = "INTEGER"
                elif "FLOAT" in type_str or "NUMERIC" in type_str:
                    col_type = "FLOAT"
                elif "BOOL" in type_str:
                    col_type = "BOOLEAN"
                elif "DATETIME" in type_str:
                    col_type = "DATETIME"
                print(f"Adding missing column: {table_name}.{col.name} ({col_type})")
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}")

conn.commit()
conn.close()
print("All SQLAlchemy tables synchronized with SQLite!")
