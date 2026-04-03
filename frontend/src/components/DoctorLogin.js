import React, { useState } from "react";
import API_URL from "../config";

function DoctorLogin({ setDoctorLoggedIn, onBack, onRegister }) {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/doctor/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        // 🔥 Store info for the dashboard
        localStorage.setItem("doctorName", data.doctor_name);
        localStorage.setItem("doctorSpecialty", data.specialty);
        localStorage.setItem("doctorLoggedIn", "true");
        setDoctorLoggedIn(true);
      } else {
        alert(data.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="patient-auth-bg">
      <div style={{ textAlign: "center", position: "relative", width: "100%", maxWidth: "400px", margin: "0 auto", padding: "40px", background: "white", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        
        <button className="back-btn" onClick={onBack} style={{ position: "absolute", top: "10px", left: "10px" }}>
          ← Back
        </button>

        <h2 style={{ color: "#2c3e50", marginBottom: "30px" }}>Medical Portal Login</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="text"
            name="username"
            placeholder="Doctor Username"
            value={form.username}
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #ddd" }}
          />

          <button 
            onClick={handleLogin}
            style={{ padding: "12px", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
          >
            Login
          </button>

          <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
            New professional? <span onClick={onRegister} style={{ color: "#3498db", cursor: "pointer", fontWeight: "bold" }}>Register here</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;
