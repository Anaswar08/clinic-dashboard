import React, { useEffect, useState } from "react";
import { db, auth } from "../../services/firebase";
import SuperAdminSidebar from "./SuperAdminSidebar";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

const SuperAdminDashboard = () => {
  const [pendingClinics, setPendingClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      // Query clinics with "pending" status
      const clinicsQuery = query(
        collection(db, "clinics"),
        where("status", "==", "pending")
      );
      const clinicsSnapshot = await getDocs(clinicsQuery);

      // For each pending clinic, get the admin's details from users collection
      const clinicsWithAdminData = await Promise.all(
        clinicsSnapshot.docs.map(async (clinicDoc) => {
          const clinicData = { id: clinicDoc.id, ...clinicDoc.data() };
          
          // Fetch admin user data
          const adminDoc = await getDoc(doc(db, "users", clinicData.adminId));
          const adminData = adminDoc.exists() ? adminDoc.data() : {};

          return {
            clinicId: clinicData.id,
            clinicName: clinicData.name,
            adminId: clinicData.adminId,
            adminName: adminData.name || "N/A",
            adminEmail: adminData.email || "N/A",
            emailVerified: adminData.emailVerified || false,
            createdAt: clinicData.createdAt,
          };
        })
      );

      setPendingClinics(clinicsWithAdminData);
    } catch (err) {
      console.error("Error fetching pending registrations:", err);
      alert("Failed to load pending registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const handleApprove = async (clinic) => {
    try {
      // Check if email is verified before approving
      const userDoc = await getDoc(doc(db, "users", clinic.adminId));
      const userData = userDoc.data();

      if (!userData.emailVerified) {
        const confirmApprove = window.confirm(
          "Warning: This user hasn't verified their email yet. Approve anyway?"
        );
        if (!confirmApprove) return;
      }

      const superAdminUid = auth.currentUser?.uid;

      // 1. Update clinic status to "active"
      await updateDoc(doc(db, "clinics", clinic.clinicId), {
        status: "active",
        approvedAt: new Date(),
        approvedBy: superAdminUid || "unknown",
      });

      // 2. Update user status to "active"
      await updateDoc(doc(db, "users", clinic.adminId), {
        status: "active",
        approvedAt: new Date(),
      });

      alert(`✓ Clinic "${clinic.clinicName}" approved successfully!`);
      
      // Refresh the list
      fetchPendingRegistrations();

      // TODO: Send approval email to clinic admin
      // You can implement email notification here using a Cloud Function
    } catch (err) {
      console.error("Approval error:", err);
      alert("Failed to approve clinic: " + err.message);
    }
  };

  const handleReject = async (clinic) => {
    const reason = window.prompt(
      `Reject "${clinic.clinicName}"?\n\nOptional: Enter rejection reason:`
    );
    
    // User cancelled
    if (reason === null) return;

    try {
      const confirmDelete = window.confirm(
        "Do you want to permanently delete this registration?\n\n" +
        "YES = Delete completely\n" +
        "NO = Mark as rejected (keep records)"
      );

      if (confirmDelete) {
        // Hard delete: Remove all traces
        
        // 1. Delete user from clinic's subcollection
        await deleteDoc(doc(db, `clinics/${clinic.clinicId}/users/${clinic.adminId}`));
        
        // 2. Delete clinic document
        await deleteDoc(doc(db, "clinics", clinic.clinicId));
        
        // 3. Delete user document
        await deleteDoc(doc(db, "users", clinic.adminId));
        
        // TODO: Delete user from Firebase Auth
        // This requires Admin SDK - implement via Cloud Function
        // await deleteAuthUser(clinic.adminId);

        alert("✓ Registration permanently deleted.");
      } else {
        // Soft delete: Mark as rejected
        const superAdminUid = auth.currentUser?.uid;

        await updateDoc(doc(db, "clinics", clinic.clinicId), {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: superAdminUid || "unknown",
          rejectionReason: reason || "No reason provided",
        });

        await updateDoc(doc(db, "users", clinic.adminId), {
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: reason || "No reason provided",
        });

        alert("✓ Registration marked as rejected.");
      }

      // Refresh the list
      fetchPendingRegistrations();

      // TODO: Send rejection email to clinic admin
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Failed to reject registration: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <SuperAdminSidebar />

      <main className="dashboard-content">
        <h2 className="dashboard-title">Pending Clinic Registrations</h2>

        {loading ? (
          <p className="loading">Loading pending registrations...</p>
        ) : pendingClinics.length === 0 ? (
          <p>No pending clinic registrations.</p>
        ) : (
          <div>
            <p style={{ marginBottom: 20, color: "#666" }}>
              {pendingClinics.length} registration(s) awaiting approval
            </p>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Clinic Name</th>
                  <th>Admin Name</th>
                  <th>Email</th>
                  <th>Email Verified</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingClinics.map((clinic) => (
                  <tr key={clinic.clinicId}>
                    <td>{clinic.clinicName}</td>
                    <td>{clinic.adminName}</td>
                    <td>{clinic.adminEmail}</td>
                    <td>
                      <span
                        style={{
                          color: clinic.emailVerified ? "green" : "orange",
                          fontWeight: "bold",
                        }}
                      >
                        {clinic.emailVerified ? "✓ Yes" : "✗ No"}
                      </span>
                    </td>
                    <td>
                      {clinic.createdAt?.toDate
                        ? clinic.createdAt.toDate().toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(clinic)}
                        style={{ marginRight: 8 }}
                      >
                        Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(clinic)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;