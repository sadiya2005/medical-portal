import React, { useState } from "react";
import API_URL from "../config";

function PatientAuth({ setPatientId, onBack }) {
  const [isRegister, setIsRegister] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const url = isRegister
      ? `${API_URL}/patient/register`
      : `${API_URL}/patient/login`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.patient_code) {
          alert(
            `${data.message}\n\nYour 5-Digit Access Code: ${data.patient_code}\n\nIMPORTANT: Save this code! You need it to log in and access results.`
          );
        } else {
          alert(data.message || "Operation successful!");
        }

        // Store patient details
        localStorage.setItem("patientId", data.patient_id);
        if (data.patient_code) localStorage.setItem("patientCode", data.patient_code);
        localStorage.setItem("role", "patient");

        setPatientId(data.patient_id);
      } else {
        // Show specific error from backend
        alert(data.detail || data.message || "Error: " + response.statusText);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Connection failed. Please check your internet or if the backend is awake.");
    }
  };

  return (
    <div className="patient-auth-bg">
      <div style={{ textAlign: "center", position: "relative" }}>
        
        {/* BACK BUTTON */}
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <h2>{isRegister ? "Patient Registration" : "Patient Login"}</h2>

        {isRegister && (
          <>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
            />
            <br />
            <br />
          </>
        )}

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <br />
        <br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <br />
        <br />

        <button onClick={handleSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p
          style={{ cursor: "pointer", color: "blue", marginTop: "10px" }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New patient? Register"}
        </p>
      </div>
    </div>
  );
}

export default PatientAuth;
