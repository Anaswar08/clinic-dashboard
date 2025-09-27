import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import SuperAdminSidebar from "./SuperAdminSidebar";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

const SuperAdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "pendingClinicRequests"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(list);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request) => {
    try {
      if (!request.uid) {
        alert("UID is missing for this request.");
        return;
      }

      const userRef = doc(db, "users", request.uid);
      const existingUser = await getDoc(userRef);

      if (existingUser.exists()) {
        alert("User already approved.");
        return;
      }

      await setDoc(userRef, {
        name: request.name,
        email: request.email,
        clinic: request.clinic,
        role: "admin",
      });

      await deleteDoc(doc(db, "pendingClinicRequests", request.id));

      alert("User approved successfully.");
      fetchRequests();
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve user.");
    }
  };

  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, "pendingClinicRequests", id));
      alert("Request rejected and removed.");
      fetchRequests();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject request.");
    }
  };

  return (
    <div className="dashboard-container">
      <SuperAdminSidebar />

      <main className="dashboard-content">
        <h2 className="dashboard-title">Admin Approval Panel</h2>

        {loading ? (
          <p className="loading">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No pending clinic registrations.</p>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Admin Name</th>
                <th>Email</th>
                <th>Approve</th>
                <th>Reject</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.clinic}</td>
                  <td>{req.name}</td>
                  <td>{req.email}</td>
                  <td>
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </button>
                  </td>
                  <td>
                    <button
                      className="reject-btn"
                      onClick={() => handleReject(req.id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
