from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os

DB_URL = "sqlite:///medical.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_records():
    db = SessionLocal()
    try:
        # Get all patients first
        patients = db.query(models.Patient).all()
        if not patients:
            print("No patients found.")
            return

        for p in patients:
            records = db.query(models.Record).filter(models.Record.patient_id == p.id).all()
            print(f"\nPatient: {p.name} (ID: {p.id})")
            print(f"{'ID':<5} | {'Disease':<20} | {'Confidence':<10} | {'Date':<20}")
            print("-" * 65)
            if not records:
                print("No records found for this patient.")
            for r in records:
                date_str = r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "N/A"
                print(f"{r.id:<5} | {r.disease:<20} | {r.confidence:<10.2f} | {date_str}")
    finally:
        db.close()

if __name__ == "__main__":
    list_records()
