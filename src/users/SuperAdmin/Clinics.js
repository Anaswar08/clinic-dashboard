import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import SuperAdminSidebar from "./SuperAdminSidebar";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const Clinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all approved clinics
  const fetchClinics = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClinics(list);
    } catch (err) {
      console.error("Error fetching clinics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Approve access
  const handleApprove = async (id) => {
    try {
      const clinicRef = doc(db, "clinics", id);
      await updateDoc(clinicRef, { status: "approved" });
      alert("Clinic access approved.");
      fetchClinics();
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve clinic.");
    }
  };

  // Hold access
  const handleHold = async (id) => {
    try {
      const clinicRef = doc(db, "clinics", id);
      await updateDoc(clinicRef, { status: "hold" });
      alert("Clinic access put on hold.");
      fetchClinics();
    } catch (err) {
      console.error("Hold error:", err);
      alert("Failed to update clinic status.");
    }
  };

  // Delete clinic
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "clinics", id));
      alert("Clinic deleted.");
      fetchClinics();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete clinic.");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <div style={{ padding: "20px", flexGrow: 1 }}>
        <h2>Clinics Management</h2>
        {loading ? (
          <p>Loading clinics...</p>
        ) : clinics.length === 0 ? (
          <p>No clinics available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Approve</th>
                <th>Hold</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td>{clinic.name}</td>
                  <td>{clinic.status || "pending"}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(clinic.id)}
                      style={{ background: "green", color: "white" }}
                    >
                      Resume
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleHold(clinic.id)}
                      style={{ background: "orange", color: "white" }}
                    >
                      Hold
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(clinic.id)}
                      style={{ background: "red", color: "white" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Clinics;
