import React, { useState } from "react";
import API_URL from "../config";
import Notification from "./Notification";

function AdminLogin({ setAdminLoggedIn, onBack }) {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({ message: "Admin Login Successful", type: "success" });
        setTimeout(() => setAdminLoggedIn(true), 1000);
      } else {
        setNotification({ message: data.detail || "Login failed", type: "error" });
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
      
      <div style={{ textAlign: "center", position: "relative", width: "100%", maxWidth: "450px", margin: "0 auto", padding: "40px", background: "white", borderRadius: "15px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        
        <button 
          onClick={onBack} 
          style={{ 
            position: "absolute", top: "15px", left: "15px", 
            background: "#f1f5f9", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: "#64748b" 
          }}
        >
          ← Back
        </button>

        <h2 style={{ color: "#1e3a8a", marginBottom: "30px", fontSize: "24px", fontWeight: "700" }}>Admin Access</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              id="admin-username"
              type="text"
              name="username"
              placeholder="Admin Username"
              value={form.username}
              onChange={handleChange}
              style={inputStyle}
              autoComplete="off"
            />

            <div style={{ position: "relative" }}>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                style={inputStyle}
                autoComplete="off"
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
                onClick={handleLogin}
                style={{ padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}
            >
              Secure Login
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
  boxSizing: "border-box"
};

export default AdminLogin;
