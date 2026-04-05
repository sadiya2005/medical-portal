from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os

DB_URL = "sqlite:///medical.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_patients():
    db = SessionLocal()
    try:
        patients = db.query(models.Patient).all()
        if not patients:
            print("No patients found in the database.")
            return

        print(f"{'ID':<5} | {'Name':<20} | {'Email':<30} | {'Code':<10}")
        print("-" * 75)
        for p in patients:
            print(f"{p.id:<5} | {p.name:<20} | {p.email:<30} | '{p.patient_code}'")
    finally:
        db.close()

if __name__ == "__main__":
    list_patients()
