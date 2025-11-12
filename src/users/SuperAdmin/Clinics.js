import React, { useEffect, useState } from "react";
import { db, auth } from "../../services/firebase";
import SuperAdminSidebar from "./SuperAdminSidebar";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

const Clinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("active"); // active, hold, all

  // Fetch clinics based on filter
  const fetchClinics = async () => {
    setLoading(true);
    try {
      let clinicsQuery;
      
      if (filter === "all") {
        // Get all clinics (excluding pending - those are in approval panel)
        clinicsQuery = query(
          collection(db, "clinics"),
          where("status", "in", ["active", "hold", "rejected"])
        );
      } else {
        // Get clinics by specific status
        clinicsQuery = query(
          collection(db, "clinics"),
          where("status", "==", filter)
        );
      }

      const clinicsSnapshot = await getDocs(clinicsQuery);

      // For each clinic, get the admin's details
      const clinicsWithAdminData = await Promise.all(
        clinicsSnapshot.docs.map(async (clinicDoc) => {
          const clinicData = { id: clinicDoc.id, ...clinicDoc.data() };
          
          // Fetch admin user data
          const adminDoc = await getDoc(doc(db, "users", clinicData.adminId));
          const adminData = adminDoc.exists() ? adminDoc.data() : {};

          // Count users in this clinic
          const usersSnapshot = await getDocs(
            collection(db, `clinics/${clinicDoc.id}/users`)
          );

          return {
            id: clinicData.id,
            name: clinicData.name,
            status: clinicData.status,
            adminId: clinicData.adminId,
            adminName: adminData.name || "N/A",
            adminEmail: adminData.email || "N/A",
            userCount: usersSnapshot.size,
            createdAt: clinicData.createdAt,
            approvedAt: clinicData.approvedAt,
          };
        })
      );

      // Sort by creation date (newest first)
      clinicsWithAdminData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setClinics(clinicsWithAdminData);
    } catch (err) {
      console.error("Error fetching clinics:", err);
      alert("Failed to load clinics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [filter]);

  // Resume/Activate clinic access
  const handleResume = async (clinic) => {
    const confirm = window.confirm(
      `Resume access for "${clinic.name}"?\n\nThis will allow the clinic to use the system again.`
    );
    if (!confirm) return;

    try {
      const superAdminUid = auth.currentUser?.uid;

      // Update clinic status
      await updateDoc(doc(db, "clinics", clinic.id), {
        status: "active",
        resumedAt: new Date(),
        resumedBy: superAdminUid || "unknown",
      });

      // Update admin user status
      await updateDoc(doc(db, "users", clinic.adminId), {
        status: "active",
      });

      alert(`✓ Clinic "${clinic.name}" access resumed.`);
      fetchClinics();
    } catch (err) {
      console.error("Resume error:", err);
      alert("Failed to resume clinic access.");
    }
  };

  // Put clinic on hold (suspend)
  const handleHold = async (clinic) => {
    const reason = window.prompt(
      `Put "${clinic.name}" on hold?\n\nOptional: Enter reason for suspension:`
    );
    
    if (reason === null) return; // User cancelled

    try {
      const superAdminUid = auth.currentUser?.uid;

      // Update clinic status
      await updateDoc(doc(db, "clinics", clinic.id), {
        status: "hold",
        heldAt: new Date(),
        heldBy: superAdminUid || "unknown",
        holdReason: reason || "No reason provided",
      });

      // Update admin user status
      await updateDoc(doc(db, "users", clinic.adminId), {
        status: "hold",
        holdReason: reason || "No reason provided",
      });

      alert(`✓ Clinic "${clinic.name}" access suspended.`);
      fetchClinics();

      // TODO: Send notification email to clinic admin
    } catch (err) {
      console.error("Hold error:", err);
      alert("Failed to suspend clinic.");
    }
  };

  // Delete clinic completely
  const handleDelete = async (clinic) => {
    const confirmText = window.prompt(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\n` +
      `You are about to permanently delete:\n` +
      `- Clinic: ${clinic.name}\n` +
      `- ${clinic.userCount} user(s)\n` +
      `- All associated data\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type "DELETE" to confirm:`
    );

    if (confirmText !== "DELETE") {
      alert("Deletion cancelled.");
      return;
    }

    try {
      // 1. Delete all users in clinic's subcollection
      const usersSnapshot = await getDocs(
        collection(db, `clinics/${clinic.id}/users`)
      );
      
      const userDeletionPromises = usersSnapshot.docs.map((userDoc) =>
        deleteDoc(doc(db, `clinics/${clinic.id}/users/${userDoc.id}`))
      );
      await Promise.all(userDeletionPromises);

      // 2. Delete all top-level user documents associated with this clinic
      const topLevelUsersQuery = query(
        collection(db, "users"),
        where("clinicId", "==", clinic.id)
      );
      const topLevelUsersSnapshot = await getDocs(topLevelUsersQuery);
      
      const topLevelUserDeletions = topLevelUsersSnapshot.docs.map((userDoc) =>
        deleteDoc(doc(db, "users", userDoc.id))
      );
      await Promise.all(topLevelUserDeletions);

      // 3. Delete clinic document
      await deleteDoc(doc(db, "clinics", clinic.id));

      alert(`✓ Clinic "${clinic.name}" permanently deleted.`);
      fetchClinics();

      // TODO: Delete Firebase Auth users via Cloud Function
      // TODO: Send notification email to clinic admin
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete clinic: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <SuperAdminSidebar />

      <div style={{ padding: "20px", flexGrow: 1 }}>
        <h2>Clinics Management</h2>

        {/* Filter Controls */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ marginRight: 10, fontWeight: "bold" }}>
            Filter by Status:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 14 }}
          >
            <option value="active">Active Clinics</option>
            <option value="hold">Suspended Clinics</option>
            <option value="rejected">Rejected Clinics</option>
            <option value="all">All Clinics</option>
          </select>
        </div>

        {loading ? (
          <p>Loading clinics...</p>
        ) : clinics.length === 0 ? (
          <p>No clinics found with status: {filter}</p>
        ) : (
          <div>
            <p style={{ marginBottom: 20, color: "#666" }}>
              Showing {clinics.length} clinic(s)
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #ddd",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Clinic Name
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Admin
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Email
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Users
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Status
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Created
                  </th>
                  <th style={{ padding: 10, border: "1px solid #ddd" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      <strong>{clinic.name}</strong>
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      {clinic.adminName}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      {clinic.adminEmail}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>
                      {clinic.userCount}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: "bold",
                          background:
                            clinic.status === "active"
                              ? "#d4edda"
                              : clinic.status === "hold"
                              ? "#fff3cd"
                              : "#f8d7da",
                          color:
                            clinic.status === "active"
                              ? "#155724"
                              : clinic.status === "hold"
                              ? "#856404"
                              : "#721c24",
                        }}
                      >
                        {clinic.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      {clinic.createdAt?.toDate
                        ? clinic.createdAt.toDate().toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>
                      {clinic.status === "hold" || clinic.status === "rejected" ? (
                        <button
                          onClick={() => handleResume(clinic)}
                          style={{
                            background: "green",
                            color: "white",
                            padding: "6px 12px",
                            marginRight: 5,
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHold(clinic)}
                          style={{
                            background: "orange",
                            color: "white",
                            padding: "6px 12px",
                            marginRight: 5,
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(clinic)}
                        style={{
                          background: "red",
                          color: "white",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clinics;