import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'medical.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. It will be created automatically when you run the app.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current columns in 'doctors'
        cursor.execute("PRAGMA table_info(doctors)")
        columns = [info[1] for info in cursor.fetchall()]
        
        print(f"Current columns in 'doctors': {columns}")

        # Add missing columns safely
        if 'name' not in columns:
            print("Adding 'name' column...")
            cursor.execute("ALTER TABLE doctors ADD COLUMN name TEXT DEFAULT 'Healthcare Professional'")
            
        if 'email' not in columns:
            print("Adding 'email' column...")
            cursor.execute("ALTER TABLE doctors ADD COLUMN email TEXT")
            # Fill with a dummy to satisfy unique/not-null if needed
            cursor.execute("UPDATE doctors SET email = username || '@hospital.com' WHERE email IS NULL")

        conn.commit()
        conn.close()
        print("Migration successful! Your database is now ready for the new features.")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
