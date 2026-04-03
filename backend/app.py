from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import re, os, random
from datetime import datetime
from pydantic import BaseModel
from dotenv import load_dotenv

from real_model import predict, send_email_alert
from database import engine, SessionLocal, Base
import models

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 🔥 In production, you can restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================
# Request Models
# ============================
class PatientRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class PatientLoginRequest(BaseModel):
    email: str
    password: str


class DoctorVerifyRequest(BaseModel):
    patient_id: int
    patient_code: str


class DoctorLoginRequest(BaseModel):
    username: str
    password: str


class DoctorRegisterRequest(BaseModel):
    name: str
    email: str
    username: str
    password: str
    specialty: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


# ============================
# Helpers
# ============================
def validate_email(email: str):
    return re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email)


def validate_password(password: str):
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True


@app.get("/")
def home():
    return {"message": "Backend is running"}


# ============================
# Patient Register
# ============================
@app.post("/patient/register")
def register_patient(data: PatientRegisterRequest, db: Session = Depends(get_db)):
    if not validate_email(data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if not validate_password(data.password):
        raise HTTPException(status_code=400, detail="Weak password")

    while True:
        patient_code = str(random.randint(10000, 99999))
        if not db.query(models.Patient).filter(models.Patient.patient_code == patient_code).first():
            break

    new_patient = models.Patient(
        name=data.name.strip(),
        email=data.email.strip(),
        password=data.password,
        patient_code=patient_code
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "message": "Patient registered successfully",
        "patient_id": new_patient.id,
        "patient_code": patient_code
    }


# ============================
# Patient Login
# ============================
@app.post("/patient/login")
def login_patient(data: PatientLoginRequest, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(
        models.Patient.email == data.email,
        models.Patient.password == data.password
    ).first()

    if not patient:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "patient_id": patient.id,
        "name": patient.name,
        "patient_code": patient.patient_code
    }


# ============================
# Doctor Register
# ============================
@app.post("/doctor/register")
def register_doctor(data: DoctorRegisterRequest, db: Session = Depends(get_db)):
    # Check if username exists
    existing = db.query(models.Doctor).filter(models.Doctor.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_doctor = models.Doctor(
        name=data.name.strip(),
        email=data.email.strip(),
        username=data.username.strip(),
        password=data.password,
        specialty=data.specialty.strip()
    )
    db.add(new_doctor)
    db.commit()
    return {"message": "Doctor registered successfully"}


# ============================
# Doctor Login
# ============================
@app.post("/doctor/login")
def doctor_login(data: DoctorLoginRequest, db: Session = Depends(get_db)):
    # 🏥 Smart & Secure Login: Case-insensitive and space-resistant
    from sqlalchemy import func
    search_term = data.username.strip().lower()
    
    doctor = db.query(models.Doctor).filter(
        (func.lower(models.Doctor.username) == search_term) | 
        (func.lower(models.Doctor.email) == search_term),
        models.Doctor.password == data.password
    ).first()

    if not doctor:
        raise HTTPException(status_code=401, detail="Invalid doctor credentials")
    
    return {
        "message": "Doctor login successful",
        "doctor_name": doctor.name,
        "specialty": doctor.specialty
    }




# ============================
# Doctor: Get Patients
# ============================
@app.get("/doctor/patients")
def get_all_patients(db: Session = Depends(get_db)):
    patients = db.query(models.Patient).all()
    # Doctors see names only for coordination
    return {"patients": [{"id": p.id, "name": p.name} for p in patients]}


# ============================
# Doctor: Verify Patient Code (Manual selection)
# ============================
@app.post("/doctor/verify-patient")
def verify_patient_code(data: DoctorVerifyRequest, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == data.patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if patient.patient_code != data.patient_code:
        raise HTTPException(status_code=401, detail="Invalid code. Please check and try again.")

    return {"message": "Patient verified successfully"}


# ============================
# Doctor: Verify by Code Directly (Quick Access)
# ============================
class QuickVerifyRequest(BaseModel):
    patient_code: str

@app.post("/doctor/verify-by-code")
def verify_by_code(data: QuickVerifyRequest, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.patient_code == data.patient_code).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Invalid/Unknown Patient Code")

    return {
        "message": "Access Granted",
        "patient_id": patient.id,
        "patient_name": patient.name
    }


# ============================
# Doctor: Get Patient Records
# ============================
@app.get("/doctor/patient/{patient_id}/records")
def doctor_get_patient_records(patient_id: int, db: Session = Depends(get_db)):
    records = db.query(models.Record).filter(models.Record.patient_id == patient_id).all()
    return {
        "records": [
            {
                "id": r.id,   # 🔥 Needed for delete feature
                "image": f"http://127.0.0.1:8000/{r.image_path.replace(os.sep,'/')}",
                "disease": r.disease,
                "confidence": r.confidence,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for r in records
        ]
    }



# ============================
# Admin: Login
# ============================
@app.post("/admin/login")
def admin_login(data: AdminLoginRequest):
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
    
    if data.username == admin_user and data.password == admin_pass:
        return {"message": "Admin login successful"}
    raise HTTPException(status_code=401, detail="Invalid admin credentials")


# ============================
# Admin: Get All Patients (Detailed)
# ============================
@app.get("/admin/patients")
def admin_get_all_patients(db: Session = Depends(get_db)):
    patients = db.query(models.Patient).all()
    return {
        "patients": [
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "patient_code": "****"  # 🔥 Masked for admin privacy
            }
            for p in patients
        ]
    }


# ============================
# Admin: Delete Patient
# ============================
@app.delete("/admin/patient/{patient_id}")
def admin_delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Image deletion from disk (optional but good practice)
    records = db.query(models.Record).filter(models.Record.patient_id == patient_id).all()
    for r in records:
        if os.path.exists(r.image_path):
            os.remove(r.image_path)

    db.delete(patient)
    db.commit()
    return {"message": "Patient and all records deleted successfully"}



# ============================
# 🔥 Patient Upload & Predict
# ============================
@app.post("/patient/upload")
def upload_xray(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        filename = f"{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        disease, confidence, heatmap_path, is_critical = predict(file_path, patient_id)

        # 🏥 Smart Alerting: Send email to the specific patient if critical
        if is_critical:
            patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
            if patient and patient.email:
                send_email_alert(disease, patient_id, recipient_email=patient.email)

        new_record = models.Record(
            patient_id=patient_id,
            image_path=heatmap_path, # 🔥 Store the heatmap instead of original
            disease=disease,
            confidence=confidence
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "message": "Prediction successful",
            "disease": disease,
            "confidence": confidence,
            "image_path": heatmap_path,
            "is_critical": is_critical
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================
# Delete Record
# ============================
@app.delete("/record/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Record).filter(models.Record.id == record_id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Delete image file from disk
    if os.path.exists(record.image_path):
        os.remove(record.image_path)

    db.delete(record)
    db.commit()

    return {"message": "Record deleted successfully"}

# ============================
# Patient: Get Own Records
# ============================
@app.get("/patient/{patient_id}/records")
def get_patient_records(patient_id: int, db: Session = Depends(get_db)):
    records = db.query(models.Record).filter(models.Record.patient_id == patient_id).all()

    return {
        "records": [
            {
                "id": r.id,
                "image_path": r.image_path,
                "disease": r.disease,
                "confidence": r.confidence,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for r in records
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

