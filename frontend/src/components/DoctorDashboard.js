import React, { useEffect, useState } from "react";
import API_URL from "../config";

function DoctorDashboard({ onLogout }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientCode, setPatientCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [records, setRecords] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Load doctor and patient info
  useEffect(() => {
    fetch(`${API_URL}/doctor/patients`)
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []))
      .catch((err) => console.error(err));

    const name = localStorage.getItem("doctorName");
    const specialty = localStorage.getItem("doctorSpecialty");
    if (name) setDoctorInfo({ name, specialty });
  }, []);

  // Quick Find & Verify
  const handleQuickVerify = async () => {
    if (!patientCode) {
      alert("Please enter a 5-digit Access Code.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/doctor/verify-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_code: patientCode.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Access Granted to ${data.patient_name}`);
        setSelectedPatient({ id: data.patient_id, name: data.patient_name });
        setVerified(true);
        fetchPatientRecords(data.patient_id);
      } else {
        alert(data.detail || "Invalid Code.");
      }
    } catch (err) {
      alert("Error finding patient.");
    }
  };
  // Verify patient (Privacy Selection via List)
  const handleVerify = async () => {
    if (!selectedPatient || !patientCode) {
      alert("Please select a patient and enter their 5-digit Access Code.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/doctor/verify-patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          patient_code: patientCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Access Granted: Records Unlocked.");
        setVerified(true);
        fetchPatientRecords(selectedPatient.id);
      } else {
        alert(data.detail || "Incorrect Code. Access Denied.");
      }
    } catch (err) {
      alert("Verification error.");
    }
  };

  const fetchPatientRecords = async (patientId) => {
    try {
      const res = await fetch(`${API_URL}/doctor/patient/${patientId}/records`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-bg">
      <div style={{ textAlign: "center", width: "100%" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 40px" }}>
          <h2>Medical Portal</h2>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>

        {doctorInfo && (
          <div style={{ marginBottom: "20px" }}>
            <p>Dr. <b>{doctorInfo.name}</b> | {doctorInfo.specialty}</p>
          </div>
        )}

        <div style={{ maxWidth: "600px", margin: "20px auto", background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
            <h4 style={{ color: "#34495e", marginBottom: "10px" }}>Quick Access</h4>
            <div style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Enter Patient Code (e.g. 12345)" 
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
              />
              <button 
                onClick={handleQuickVerify} 
                style={{ padding: "10px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                Find & Unlock
              </button>
            </div>
          </div>

          <h3>Patient Registry</h3>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Select from the list or use Quick Access above.
          </p>

          <select 
            onChange={(e) => {
              const p = patients.find(p => p.id === parseInt(e.target.value));
              setSelectedPatient(p);
              setVerified(false);
              setRecords([]);
              setPatientCode("");
            }}
            value={selectedPatient?.id || ""}
            style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px" }}
          >
            <option value="">-- Select Patient Name --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
            ))}
          </select>

          {selectedPatient && !verified && (
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
              <h4>Unlock Records for {selectedPatient.name}</h4>
              <input
                type="text"
                maxLength="5"
                placeholder="Enter 5-digit Access Code"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }}
              />
              <button onClick={handleVerify} style={{ width: "100%", padding: "10px", background: "#3498db", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>
                Verify & Unlock
              </button>
            </div>
          )}
        </div>

        {/* Patient Records */}
        {verified && (
          <div style={{ marginTop: "40px" }}>
            <h3>Medical Records: {selectedPatient?.name}</h3>
            
            {/* 🔥 CRITICAL FINDING ALERT FOR DOCTOR */}
            {records.some(r => ["Pneumothorax", "Edema", "Consolidation"].includes(r.disease)) && (
              <div style={{ 
                background: "#e74c3c", 
                color: "white", 
                padding: "15px", 
                borderRadius: "8px", 
                marginBottom: "25px",
                fontWeight: "bold",
                animation: "pulse 1.5s infinite"
              }}>
                🚨 CLINICAL ALERT: This patient has high-risk findings (Pneumothorax/Edema) in their history!
              </div>
            )}

            {records.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <div className="history-container">
                {records.map((r, i) => (
                  <div key={i} className="record-card shadow-sm">
                    <p><b>Diagnostic Finding:</b> {r.disease}</p>
                    <p><b>Date:</b> {r.date}</p>
                    <img src={r.image} alt="Grad-CAM Heatmap" style={{ width: "100%", borderRadius: "8px" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;
