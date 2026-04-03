import React, { useState, useEffect } from "react";
import API_URL from "../config";

function AdminDashboard({ onLogout }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/patients`);
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients);
      } else {
        alert("Failed to load patients");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient and all their diagnostic records? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/patient/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Patient deleted successfully");
        fetchPatients(); // Refresh list
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during deletion");
    }
  };

  return (
    <div className="dashboard-bg">
      <div style={{ textAlign: "center", padding: "40px" }}>
        
        <button className="logout-btn" onClick={onLogout} style={{ position: "absolute", top: "20px", right: "20px", background: "#c0392b" }}>
          Admin Logout
        </button>

        <h1 style={{ marginBottom: "10px" }}>Admin Command Center</h1>
        <p style={{ color: "#7f8c8d", marginBottom: "40px" }}>Manage system users and patient records</p>

        {loading ? (
          <p>Loading database...</p>
        ) : (
          <div style={{ maxWidth: "900px", margin: "0 auto", background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Name</th>
                  <th style={{ padding: "12px" }}>Email</th>
                  <th style={{ padding: "12px" }}>Patient Code</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No patients registered yet.</td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>#{p.id}</td>
                      <td style={{ padding: "12px" }}><b>{p.name}</b></td>
                      <td style={{ padding: "12px" }}>{p.email}</td>
                      <td style={{ padding: "12px" }}><code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>{p.patient_code}</code></td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button 
                          onClick={() => deletePatient(p.id)}
                          style={{ padding: "6px 12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Delete User
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
