// src/pages/admin/StaffManager.js

import React, { useState, useEffect } from "react";
import { auth, db } from "../../services/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  getDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { redistributeTasks } from "../../utils/taskBalancer";

const StaffManager = () => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [inviteList, setInviteList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [inviteLinks, setInviteLinks] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  // ✅ Store admin's clinic data
  const [adminClinicId, setAdminClinicId] = useState(null);
  const [adminClinicName, setAdminClinicName] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch admin's clinic information on mount
  useEffect(() => {
    const fetchAdminClinic = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("No admin logged in.");
          return;
        }

        const adminRef = doc(db, "users", currentUser.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          alert("Admin data not found.");
          return;
        }

        const adminData = adminSnap.data();
        
        if (!adminData.clinicId) {
          alert("Clinic information missing for this admin account.");
          return;
        }

        setAdminClinicId(adminData.clinicId);

        // Get clinic name from clinics collection
        const clinicRef = doc(db, "clinics", adminData.clinicId);
        const clinicSnap = await getDoc(clinicRef);
        
        if (clinicSnap.exists()) {
          setAdminClinicName(clinicSnap.data().name);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin clinic:", error);
        alert("Failed to load clinic information.");
        setLoading(false);
      }
    };

    fetchAdminClinic();
  }, []);

  // ✅ Load pending invites - ONLY for this clinic
  useEffect(() => {
    if (!adminClinicId) return;

    const invitesQuery = query(
      collection(db, "staffInvites"),
      where("clinicId", "==", adminClinicId)
    );

    const unsub = onSnapshot(invitesQuery, (snapshot) => {
      const invites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInviteList(invites);

      const links = {};
      invites.forEach((staff) => {
        links[staff.id] = `${window.location.origin}/staff-register?inviteId=${staff.id}`;
      });
      setInviteLinks(links);
    });

    return () => unsub();
  }, [adminClinicId]);

  // ✅ Load active staff - ONLY for this clinic
  useEffect(() => {
    if (!adminClinicId) return;

    const staffQuery = query(
      collection(db, "users"),
      where("clinicId", "==", adminClinicId),
      where("role", "in", ["staff", "doctor"])
    );

    const unsub = onSnapshot(staffQuery, (snapshot) => {
      const staff = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActiveStaff(staff);
    });

    return () => unsub();
  }, [adminClinicId]);

  // ✅ Load leave requests - ONLY for this clinic
  useEffect(() => {
    if (!adminClinicId) return;

    const leaveQuery = query(
      collection(db, "leaveRequests"),
      where("clinicId", "==", adminClinicId)
    );

    const unsub = onSnapshot(leaveQuery, (snapshot) => {
      const leaves = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaveRequests(leaves);
    });

    return () => unsub();
  }, [adminClinicId]);

  // ✅ Add new staff with clinic linking
  const handleAddStaff = async () => {
    if (!staffName || !staffEmail) {
      alert("Please fill in both name and email");
      return;
    }

    if (!adminClinicId) {
      alert("Clinic information not loaded yet. Please wait.");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("No admin logged in.");
        return;
      }

      // ✅ Create staff invite with clinicId
      await addDoc(collection(db, "staffInvites"), {
        name: staffName,
        email: staffEmail,
        role: selectedRole,
        clinicId: adminClinicId,           // ✅ Clinic ID for filtering
        clinicName: adminClinicName,       // ✅ Clinic name for display
        invitedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "pending",
      });

      // Reset form
      setStaffName("");
      setStaffEmail("");
      setSelectedRole("staff");

      alert(`Invite sent successfully to ${staffName} at ${adminClinicName}.`);
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Failed to add staff: " + error.message);
    }
  };

  // ✅ Remove invite
  const handleRemoveInvite = async (id) => {
    if (window.confirm("Remove this staff invite?")) {
      try {
        await deleteDoc(doc(db, "staffInvites", id));
        alert("Invite removed successfully.");
      } catch (error) {
        console.error("Error removing invite:", error);
        alert("Failed to remove invite.");
      }
    }
  };

  // ✅ Remove active staff - also remove from clinic's subcollection
  const handleRemoveActiveStaff = async (staffId, staffName) => {
    if (!window.confirm(`Remove ${staffName} from your clinic?`)) return;

    try {
      // 1. Delete from top-level users collection
      await deleteDoc(doc(db, "users", staffId));

      // 2. Delete from clinic's users subcollection
      await deleteDoc(doc(db, `clinics/${adminClinicId}/users/${staffId}`));

      alert(`${staffName} removed successfully.`);

      // TODO: Optionally delete from Firebase Auth via Cloud Function
      // TODO: Redistribute their tasks if they had any assigned
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("Failed to remove staff: " + error.message);
    }
  };

  // ✅ Approve leave + trigger task balancer
  const handleApproveLeave = async (leave) => {
    if (!window.confirm(`Approve ${leave.leaveType} leave for ${leave.staffName}?`)) return;

    try {
      const leaveRef = doc(db, "leaveRequests", leave.id);
      await updateDoc(leaveRef, { 
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid,
      });

      // 🔄 Trigger task redistribution
      await redistributeTasks(
        leave.leaveType === "Full day" ? [leave.staffId] : [],
        leave.leaveType === "Half day" ? [leave.staffId] : []
      );

      alert("Leave approved and tasks redistributed successfully ✅");
    } catch (error) {
      console.error("Error approving leave:", error);
      alert("Failed to approve leave: " + error.message);
    }
  };

  // ❌ Reject leave
  const handleRejectLeave = async (leave) => {
    const reason = window.prompt(`Reject leave for ${leave.staffName}?\n\nOptional: Enter rejection reason:`);
    
    if (reason === null) return; // User cancelled

    try {
      const leaveRef = doc(db, "leaveRequests", leave.id);
      await updateDoc(leaveRef, { 
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedBy: auth.currentUser?.uid,
        rejectionReason: reason || "No reason provided",
      });
      
      alert("Leave rejected ❌");
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert("Failed to reject leave: " + error.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading clinic information...</div>;
  }

  if (!adminClinicId) {
    return <div style={{ padding: "20px" }}>Unable to load clinic information. Please contact support.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Staff Manager - {adminClinicName}</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Managing staff for <strong>{adminClinicName}</strong>
      </p>

      {/* ➕ Add Staff */}
      <div style={{ marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
        <h3>Invite New Staff</h3>
        <input
          type="text"
          placeholder="Full Name"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "200px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={staffEmail}
          onChange={(e) => setStaffEmail(e.target.value)}
          style={{ marginRight: "10px", padding: "8px", width: "250px" }}
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        >
          <option value="staff">Staff</option>
          <option value="doctor">Doctor</option>
        </select>
        <button 
          onClick={handleAddStaff}
          style={{ padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Send Invite
        </button>
      </div>

      {/* 📨 Pending Invites */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Pending Invites ({inviteList.length})</h3>
        {inviteList.length === 0 ? (
          <p style={{ color: "#666" }}>No pending invites.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {inviteList.map((staff) => (
              <li 
                key={staff.id}
                style={{ 
                  padding: "15px", 
                  marginBottom: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "5px",
                  background: "#f9f9f9"
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <strong>{staff.name}</strong> ({staff.email}) - <em>{staff.role}</em>
                  <br />
                  <small style={{ color: "#666" }}>
                    Expires: {staff.expiresAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="text"
                    readOnly
                    value={inviteLinks[staff.id] || ""}
                    style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLinks[staff.id]);
                      alert("Invite link copied!");
                    }}
                    style={{ padding: "8px 16px", background: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleRemoveInvite(staff.id)}
                    style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 👩‍⚕️ Active Staff */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Active Staff ({activeStaff.length})</h3>
        {activeStaff.length === 0 ? (
          <p style={{ color: "#666" }}>No active staff members yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Name</th>
                <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Email</th>
                <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Role</th>
                <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeStaff.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <strong>{staff.name}</strong>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{staff.email}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      background: staff.role === "doctor" ? "#E3F2FD" : "#FFF3E0",
                      color: staff.role === "doctor" ? "#1976D2" : "#F57C00",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {staff.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      background: staff.status === "active" ? "#C8E6C9" : "#FFCDD2",
                      color: staff.status === "active" ? "#2E7D32" : "#C62828",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {staff.status?.toUpperCase() || "ACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                    <button
                      onClick={() => handleRemoveActiveStaff(staff.id, staff.name)}
                      style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🗓 Leave Requests */}
      <div>
        <h3>Leave Requests ({leaveRequests.filter(l => l.status === "pending").length} pending)</h3>
        {leaveRequests.length === 0 ? (
          <p style={{ color: "#666" }}>No leave requests yet.</p>
        ) : (
          <div>
            {leaveRequests.map((leave) => (
              <div
                key={leave.id}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  background: leave.status === "pending" ? "#FFF9C4" : "#f9f9f9"
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <strong>{leave.staffName}</strong> — {leave.leaveType} leave
                  <br />
                  <strong>Date:</strong> {leave.date}
                  <br />
                  <strong>Reason:</strong> {leave.reason}
                  <br />
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background:
                        leave.status === "approved"
                          ? "#C8E6C9"
                          : leave.status === "rejected"
                          ? "#FFCDD2"
                          : "#FFE082",
                      color:
                        leave.status === "approved"
                          ? "#2E7D32"
                          : leave.status === "rejected"
                          ? "#C62828"
                          : "#F57F17",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}
                  >
                    {leave.status.toUpperCase()}
                  </span>
                </div>
                {leave.status === "pending" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleApproveLeave(leave)}
                      style={{ padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(leave)}
                      style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {leave.status === "rejected" && leave.rejectionReason && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
                    <strong>Rejection Reason:</strong> {leave.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;