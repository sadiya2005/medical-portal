import React, { useEffect, useState } from "react";
import API_URL from "../config";

function PatientRecords({ patientId, refresh }) {
  const [records, setRecords] = useState([]);

  // Fetch patient records
  const fetchRecords = async () => {
    try {
      const res = await fetch(
        `${API_URL}/patient/${patientId}/records`
      );
      const data = await res.json();
      console.log("Records:", data);
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Reload when patient changes OR refresh is triggered
  useEffect(() => {
    fetchRecords();
  }, [patientId, refresh]);

  // Delete a record
  const deleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`${API_URL}/record/${recordId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      alert(data.message);

      // Reload history after deletion
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record");
    }
  };

  return (
    <div style={{ marginTop: "30px", textAlign: "center" }}>
      <h2>Patient History</h2>

      {records.length === 0 ? (
        <p>No records found</p>
      ) : (
        <div className="history-container">
          {[...records].reverse().map((r) => (
            <div key={r.id} className="history-card">
              <p style={{ fontSize: "18px", color: "#1e3a8a" }}>
                <b>Finding:</b> <span style={{ color: r.is_critical ? "#ef4444" : "#22c55e", fontWeight: "bold" }}>{r.disease}</span>
              </p>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                <b>Date Analyzed:</b> {new Date(r.created_at).toLocaleString()}
              </p>

              <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "550px", margin: "20px auto" }}>
                <img
                  src={`${API_URL}/${r.image_path.replace(/\\/g, "/")}`}
                  alt="X-ray Analysis"
                  className="history-image"
                  style={{ width: "100%", borderRadius: "12px", boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
                />
              </div>

              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() => deleteRecord(r.id)}
                  style={{ 
                    padding: "8px 16px", 
                    background: "#fee2e2", 
                    color: "#ef4444", 
                    border: "1px solid #fecaca", 
                    borderRadius: "6px", 
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Delete This Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientRecords;
