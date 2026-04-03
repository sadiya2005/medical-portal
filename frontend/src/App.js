import React, { useState, useEffect } from "react";
import RoleSelect from "./components/RoleSelect";
import PatientAuth from "./components/PatientAuth";
import XrayUpload from "./components/XrayUpload";
import DoctorLogin from "./components/DoctorLogin";
import DoctorRegister from "./components/DoctorRegister";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";   // make sure this is imported

function App() {
  const [role, setRole] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [doctorLoggedIn, setDoctorLoggedIn] = useState(false);
  const [isDoctorRegistering, setIsDoctorRegistering] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);


  // 🔁 Restore session
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const savedPatientId = localStorage.getItem("patientId");
    const savedDoctor = localStorage.getItem("doctorLoggedIn");
    const savedAdmin = localStorage.getItem("adminLoggedIn");

    if (savedRole) setRole(savedRole);
    if (savedRole === "patient" && savedPatientId) setPatientId(savedPatientId);
    if (savedRole === "doctor" && savedDoctor === "true") setDoctorLoggedIn(true);
    if (savedRole === "admin" && savedAdmin === "true") setAdminLoggedIn(true);
  }, []);

  // 🔥 Full logout (clears everything)
  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setPatientId(null);
    setDoctorLoggedIn(false);
    setAdminLoggedIn(false);
  };

  // 🔙 Go back to Role Selection only
  const goBackToRole = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("patientId");
    localStorage.removeItem("doctorLoggedIn");
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("doctorName");
    localStorage.removeItem("doctorSpecialty");

    setRole(null);
    setPatientId(null);
    setDoctorLoggedIn(false);
    setAdminLoggedIn(false);
    setIsDoctorRegistering(false);
  };

  let content = null;

  // ---------------------------
  // Role selection
  // ---------------------------
  if (!role) {
    content = (
      <RoleSelect
        setRole={(r) => {
          localStorage.setItem("role", r);
          setRole(r);
        }}
      />
    );
  }

  // ---------------------------
  // Patient Flow
  // ---------------------------
  else if (role === "patient" && !patientId) {
    content = (
      <PatientAuth
        setPatientId={(id) => {
          localStorage.setItem("patientId", id);
          setPatientId(id);
        }}
        onBack={goBackToRole}
      />
    );
  }

  else if (role === "patient" && patientId) {
    content = (
      <XrayUpload
        patientId={patientId}
        onLogout={handleLogout}
      />
    );
  }

  // ---------------------------
  // Doctor Flow (Privacy Hardened)
  // ---------------------------
  else if (role === "doctor" && !doctorLoggedIn) {
    if (isDoctorRegistering) {
      content = (
        <DoctorRegister 
          onBack={() => setIsDoctorRegistering(false)} 
          onRegisterSuccess={() => setIsDoctorRegistering(false)} 
        />
      );
    } else {
      content = (
        <DoctorLogin 
          setDoctorLoggedIn={setDoctorLoggedIn} 
          onBack={goBackToRole} 
          onRegister={() => setIsDoctorRegistering(true)}
        />
      );
    }
  }

  else if (role === "doctor" && doctorLoggedIn) {
    content = <DoctorDashboard onLogout={handleLogout} />;
  }

  // ---------------------------
  // Admin Flow
  // ---------------------------
  else if (role === "admin" && !adminLoggedIn) {
    content = (
      <AdminLogin
        setAdminLoggedIn={() => {
          localStorage.setItem("adminLoggedIn", "true");
          setAdminLoggedIn(true);
        }}
        onBack={goBackToRole}
      />
    );
  }

  else if (role === "admin" && adminLoggedIn) {
    content = <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="app-background">
      <div className="app-container">
        {content}
      </div>
    </div>
  );
}

export default App;
