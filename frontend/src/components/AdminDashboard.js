import React, { useState, useEffect } from "react";
import API_URL from "../config";
import Notification from "./Notification";

function AdminDashboard({ onLogout }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("patients");
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchPatients(), fetchDoctors()]);
    setLoading(false);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/patients`);
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/doctors`);
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Are you sure? This will delete the patient and all their medical records.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/patient/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setNotification({ message: "Patient deleted successfully", type: "success" });
        fetchPatients();
      } else {
        setNotification({ message: "Failed to delete patient", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Server error during deletion", type: "error" });
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to remove this doctor?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/doctor/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setNotification({ message: "Doctor removed successfully", type: "success" });
        fetchDoctors();
      } else {
        setNotification({ message: "Failed to delete doctor", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Server error during deletion", type: "error" });
    }
  };

  return (
    <div className="dashboard-bg" style={{ minHeight: "100vh", padding: "20px" }}>
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: "", type: "" })} 
      />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        
        <button 
          onClick={onLogout} 
          style={{ 
            position: "absolute", top: "0", right: "0", 
            background: "#ef4444", color: "white", border: "none", 
            padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Logout
        </button>

        <header style={{ textAlign: "left", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", color: "#1e3a8a", fontWeight: "800", margin: "0" }}>Admin Control Center</h1>
          <p style={{ color: "#64748b", fontSize: "16px", marginTop: "5px" }}>System Management Dashboard</p>
        </header>

        {/* TABS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button 
            onClick={() => setActiveTab("patients")}
            style={activeTab === "patients" ? activeTabStyle : inactiveTabStyle}
          >
            Patients ({patients.length})
          </button>
          <button 
            onClick={() => setActiveTab("doctors")}
            style={activeTab === "doctors" ? activeTabStyle : inactiveTabStyle}
          >
            Doctors ({doctors.length})
          </button>
        </div>

        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <div className="spinner"></div>
              <p>Synchronizing data...</p>
            </div>
          ) : (
            <>
              {activeTab === "patients" ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #f1f5f9" }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Patient Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Access Code</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                       <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No patients found</td></tr>
                    ) : (
                      patients.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}>#{p.id}</td>
                          <td style={tdStyle}><strong>{p.name}</strong></td>
                          <td style={tdStyle}>{p.email}</td>
                          <td style={tdStyle}><code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px" }}>{p.patient_code}</code></td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button onClick={() => deletePatient(p.id)} style={deleteBtnStyle}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #f1f5f9" }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Doctor Name</th>
                      <th style={thStyle}>Specialty</th>
                      <th style={thStyle}>Email</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.length === 0 ? (
                       <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No doctors found</td></tr>
                    ) : (
                      doctors.map(d => (
                        <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}>#{d.id}</td>
                          <td style={tdStyle}><strong>{d.name}</strong></td>
                          <td style={tdStyle}><span style={{ color: "#2563eb", fontWeight: "500" }}>{d.specialty}</span></td>
                          <td style={tdStyle}>{d.email}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button onClick={() => deleteDoctor(d.id)} style={deleteBtnStyle}>Remove</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: "15px", color: "#64748b", fontWeight: "600", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "18px 15px", color: "#1e293b", fontSize: "15px" };
const activeTabStyle = { padding: "12px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const inactiveTabStyle = { padding: "12px 24px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };
const deleteBtnStyle = { padding: "6px 14px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };

export default AdminDashboard;
