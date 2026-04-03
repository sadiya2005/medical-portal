import React, { useState } from "react";
import API_URL from "../config";

function DoctorRegister({ onBack, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    specialty: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (!form.name || !form.username || !form.password) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/doctor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registration successful! You can now log in.");
        onRegisterSuccess();
      } else {
        alert(data.detail || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="patient-auth-bg">
      <div style={{ textAlign: "center", position: "relative", width: "100%", maxWidth: "450px", margin: "0 auto", padding: "40px", background: "white", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        
        <button className="back-btn" onClick={onBack} style={{ position: "absolute", top: "10px", left: "10px" }}>
          ← Back
        </button>

        <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>Medical Professional Registration</h2>
        <p style={{ color: "#7f8c8d", marginBottom: "30px", fontSize: "14px" }}>Join our diagnostic network</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
                type="text"
                name="name"
                placeholder="Full Name (Dr. ...)"
                value={form.name}
                onChange={handleChange}
                style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
            
            <input
                type="text"
                name="specialty"
                placeholder="Specialty (e.g. Radiologist)"
                value={form.specialty}
                onChange={handleChange}
                style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />

            <input
                type="email"
                name="email"
                placeholder="Professional Email Address"
                value={form.email}
                onChange={handleChange}
                style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />

            <input
                type="text"
                name="username"
                placeholder="Pick a Username"
                value={form.username}
                onChange={handleChange}
                style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />

            <input
                type="password"
                name="password"
                placeholder="Create Password"
                value={form.password}
                onChange={handleChange}
                style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
            />

            <button 
                onClick={handleRegister}
                style={{ padding: "12px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}
            >
                Complete Registration
            </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorRegister;
