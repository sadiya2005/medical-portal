import React, { useState } from "react";
import API_URL from "../config";
import Notification from "./Notification";

function DoctorRegister({ onBack, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    specialty: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (!form.name || !form.username || !form.password) {
      setNotification({ message: "Please fill in all required fields.", type: "error" });
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
        setNotification({ message: "Registration successful! You can now log in.", type: "success" });
        setTimeout(() => onRegisterSuccess(), 2000);
      } else {
        setNotification({ message: data.detail || "Registration failed", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Server error", type: "error" });
    }
  };

  return (
    <div className="patient-auth-bg" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: "", type: "" })} 
      />
      
      <div style={{ textAlign: "center", position: "relative", width: "100%", maxWidth: "500px", margin: "0 auto", padding: "40px", background: "white", borderRadius: "15px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        
        <button 
          onClick={onBack} 
          style={{ position: "absolute", top: "15px", left: "15px", background: "#f1f5f9", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: "#64748b" }}
        >
          ← Back
        </button>

        <h2 style={{ color: "#1e3a8a", marginBottom: "10px", fontSize: "24px", fontWeight: "700" }}>Professional Registration</h2>
        <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "14px" }}>Join our diagnostic network</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
                id="doc-reg-name"
                type="text"
                name="name"
                placeholder="Full Name (Dr. ...)"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="new-password"
            />
            
            <input
                id="doc-reg-specialty"
                type="text"
                name="specialty"
                placeholder="Specialty (e.g. Radiologist)"
                value={form.specialty}
                onChange={handleChange}
                style={inputStyle}
            />

            <input
                id="doc-reg-email"
                type="email"
                name="email"
                placeholder="Professional Email Address"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="username"
            />

            <input
                id="doc-reg-user"
                type="text"
                name="username"
                placeholder="Pick a Username"
                value={form.username}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="username"
            />

            <div style={{ position: "relative" }}>
              <input
                  id="doc-reg-pass"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create Password"
                  value={form.password}
                  onChange={handleChange}
                  style={inputStyle}
                  autoComplete="new-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <button 
                onClick={handleRegister}
                style={{ padding: "14px", background: "#3498db", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}
            >
                Complete Registration
            </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "16px",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left"
};

export default DoctorRegister;
