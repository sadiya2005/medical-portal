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
          {records.map((r) => (
            <div key={r.id} className="history-card">
              <p>
                <b>Disease:</b> {r.disease}
              </p>
              <p>
                <b>Date:</b> {r.created_at}
              </p>

              <img
                src={`${API_URL}/${r.image_path.replace(/\\/g, "/")}`}
                alt="X-ray"
                className="history-image"
              />

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteRecord(r.id)}
                className="delete-btn"
              >
                Delete Record
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientRecords;
