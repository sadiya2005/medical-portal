from fastapi.testclient import TestClient
from app import app, get_db
import models
from database import SessionLocal, Base, engine

client = TestClient(app)

def test_patient_duplicate_registration():
    # Setup: Ensure the email is not in the DB initially (or use a random one)
    import random
    email = f"test_{random.randint(1000, 9999)}@example.com"
    payload = {
        "name": "Test User",
        "email": email,
        "password": "Password123"
    }

    # First registration should succeed
    response = client.post("/patient/register", json=payload)
    assert response.status_code == 200
    print(f"First registration for {email} succeeded.")

    # Second registration with same email should fail with 400
    response = client.post("/patient/register", json=payload)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]
    print(f"Second registration for {email} failed as expected (400).")

def test_doctor_duplicate_registration():
    import random
    suffix = random.randint(1000, 9999)
    email = f"doctor_{suffix}@example.com"
    username = f"dr_test_{suffix}"
    payload = {
        "name": "Dr. Test",
        "email": email,
        "username": username,
        "password": "Password123",
        "specialty": "General"
    }

    # First registration should succeed
    response = client.post("/doctor/register", json=payload)
    assert response.status_code == 200
    print(f"First doctor registration ({username}) succeeded.")

    # Second registration with same email should fail
    payload_diff_username = payload.copy()
    payload_diff_username["username"] = f"other_{suffix}"
    response = client.post("/doctor/register", json=payload_diff_username)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]
    print(f"Second doctor registration (same email, diff username) failed as expected.")

    # Third registration with same username should fail
    payload_diff_email = payload.copy()
    payload_diff_email["email"] = f"other_{suffix}@example.com"
    response = client.post("/doctor/register", json=payload_diff_email)
    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]
    print(f"Third doctor registration (diff email, same username) failed as expected.")

if __name__ == "__main__":
    try:
        test_patient_duplicate_registration()
        test_doctor_duplicate_registration()
        print("\nAll registration tests PASSED!")
    except Exception as e:
        print(f"\nTests FAILED: {e}")
        import traceback
        traceback.print_exc()
