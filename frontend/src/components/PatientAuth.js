import React, { useState } from "react";
import API_URL from "../config";
import Notification from "./Notification";

function PatientAuth({ setPatientId, onBack }) {
  const [isRegister, setIsRegister] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

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
          setNotification({
            message: `Success! Your 5-Digit Access Code: ${data.patient_code}. PLEASE SAVE THIS!`,
            type: "success"
          });
          // Wait a bit to let them see the code before switching
          setTimeout(() => {
             localStorage.setItem("patientId", data.patient_id);
             localStorage.setItem("patientCode", data.patient_code);
             localStorage.setItem("role", "patient");
             setPatientId(data.patient_id);
          }, 3000);
        } else {
          setNotification({ message: data.message || "Login successful!", type: "success" });
          localStorage.setItem("patientId", data.patient_id);
          localStorage.setItem("role", "patient");
          setTimeout(() => setPatientId(data.patient_id), 1000);
        }
      } else {
        setNotification({ message: data.detail || data.message || "Error occurred", type: "error" });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setNotification({ message: "Connection failed. Is the backend running?", type: "error" });
    }
  };

  return (
    <div className="patient-auth-bg" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: "", type: "" })} 
      />
      
      <div style={{ 
        background: "white", 
        borderRadius: "15px", 
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)", 
        width: "100%", 
        maxWidth: "450px", 
        overflow: "hidden",
        position: "relative"
      }}>
        
        {/* TOP BACK BAR */}
        <button 
          onClick={onBack}
          style={{ 
            width: "100%", 
            padding: "12px", 
            background: "#2563eb", 
            color: "white", 
            border: "none", 
            cursor: "pointer", 
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          ← Back
        </button>

        <div style={{ padding: "40px" }}>
          <h2 style={{ color: "#1e3a8a", marginBottom: "30px", fontSize: "28px", fontWeight: "700" }}>
            {isRegister ? "Medical Portal Register" : "Medical Portal Login"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {isRegister && (
              <input
                id="p-name"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="new-password"
              />
            )}

            <input
              id="p-email"
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              autoComplete="username"
            />

            <div style={{ position: "relative" }}>
              <input
                id="p-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="current-password"
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
                  fontSize: "18px",
                  color: "#64748b"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <button 
              onClick={handleSubmit}
              style={{
                width: "100%",
                padding: "16px",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "10px",
                boxShadow: "0 4px 6px rgba(34, 197, 94, 0.2)",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.target.style.background = "#16a34a"}
              onMouseOut={(e) => e.target.style.background = "#22c55e"}
            >
              {isRegister ? "Register" : "Login"}
            </button>

            <p style={{ marginTop: "20px", color: "#64748b" }}>
              {isRegister ? "Already have an account?" : "New patient?"}{" "}
              <span 
                style={{ cursor: "pointer", color: "#2563eb", fontWeight: "600" }}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setNotification({ message: "", type: "" });
                }}
              >
                {isRegister ? "Login here" : "Register here"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#eff6ff",
  fontSize: "16px",
  color: "#1e293b",
  boxSizing: "border-box"
};

export default PatientAuth;
