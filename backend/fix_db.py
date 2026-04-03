import sqlite3
import os

def fix_database():
    db_path = os.path.join(os.path.dirname(__file__), 'medical.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. No fix needed yet as it will be created fresh.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current columns in 'doctors'
        cursor.execute("PRAGMA table_info(doctors)")
        columns = [info[1] for info in cursor.fetchall()]
        
        print(f"Current columns in 'doctors' table: {columns}")

        # Add 'name' if missing
        if 'name' not in columns:
            print("Adding 'name' column...")
            cursor.execute("ALTER TABLE doctors ADD COLUMN name TEXT DEFAULT 'Unknown Doctor'")
        
        # Add 'specialty' if missing
        if 'specialty' not in columns:
            print("Adding 'specialty' column...")
            cursor.execute("ALTER TABLE doctors ADD COLUMN specialty TEXT DEFAULT 'General'")

        conn.commit()
        print("Database schema updated successfully!")
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    fix_database()
