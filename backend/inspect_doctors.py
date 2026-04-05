from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os

DB_URL = "sqlite:///medical.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_doctors():
    db = SessionLocal()
    try:
        doctors = db.query(models.Doctor).all()
        if not doctors:
            print("No doctors found in the database.")
            return

        print(f"{'ID':<5} | {'Name':<20} | {'Username':<20} | {'Specialty':<20} | {'Email':<30}")
        print("-" * 105)
        for dr in doctors:
            print(f"{dr.id:<5} | {dr.name:<20} | {dr.username:<20} | {dr.specialty or 'N/A':<20} | {dr.email:<30}")
    finally:
        db.close()

if __name__ == "__main__":
    list_doctors()
