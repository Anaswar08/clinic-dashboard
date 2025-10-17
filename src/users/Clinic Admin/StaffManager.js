import React, { useState, useEffect } from "react";
import { db, auth } from "../../services/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  updateDoc,
  orderBy,
} from "firebase/firestore";

const StaffManager = () => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [inviteList, setInviteList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [inviteLinks, setInviteLinks] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [staffMap, setStaffMap] = useState({}); // 🔹 For quick staff lookup

  // --- Load pending staff invites ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staffInvites"), (snapshot) => {
      const invites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInviteList(invites);

      // Generate invite links
      const links = {};
      invites.forEach((staff) => {
        links[staff.id] = `${window.location.origin}/staff-register?inviteId=${staff.id}`;
      });
      setInviteLinks(links);
    });

    return () => unsub();
  }, []);

  // --- Load active staff (registered users) ---
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["staff", "doctor"])
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActiveStaff(staff);

      // 🔹 Create a lookup map for staff info
      const map = {};
      staff.forEach((s) => {
        map[s.id] = { name: s.name || "Unnamed", email: s.email || "" };
      });
      setStaffMap(map);
    });

    return () => unsub();
  }, []);

  // --- Load all leave requests ---
  useEffect(() => {
    const q = query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaveRequests(requests);
    });

    return () => unsub();
  }, []);

  // --- Add new staff invite ---
  const handleAddStaff = async () => {
    if (!staffName || !staffEmail) {
      alert("Please fill in both name and email");
      return;
    }

    try {
      await addDoc(collection(db, "staffInvites"), {
        name: staffName,
        email: staffEmail,
        role: selectedRole,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "pending",
      });

      setStaffName("");
      setStaffEmail("");
      setSelectedRole("staff");
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Failed to add staff");
    }
  };

  // --- Remove staff invite ---
  const handleRemoveInvite = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff invite?")) {
      try {
        await deleteDoc(doc(db, "staffInvites", id));
      } catch (error) {
        console.error("Error removing staff invite:", error);
      }
    }
  };

  // --- Remove active staff ---
  const handleRemoveActiveStaff = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        await deleteDoc(doc(db, "users", id));

        if (auth.currentUser && auth.currentUser.uid === id) {
          await auth.signOut();
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error removing active staff:", error);
      }
    }
  };

  // --- Approve leave request ---
  const handleApproveLeave = async (id) => {
    try {
      await updateDoc(doc(db, "leaveRequests", id), { status: "approved" });
    } catch (error) {
      console.error("Error approving leave:", error);
    }
  };

  // --- Reject leave request ---
  const handleRejectLeave = async (id) => {
    try {
      await updateDoc(doc(db, "leaveRequests", id), { status: "rejected" });
    } catch (error) {
      console.error("Error rejecting leave:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "pending":
      default:
        return "#ffc107";
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Staff Manager</h2>

      {/* Add Staff Form */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Full Name"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={staffEmail}
          onChange={(e) => setStaffEmail(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="staff">Staff</option>
          <option value="doctor">Doctor</option>
        </select>
        <button onClick={handleAddStaff}>Add Staff</button>
      </div>

      {/* Pending Invites */}
      <h3>Pending Invites</h3>
      <ul>
        {inviteList.map((staff) => (
          <li key={staff.id} style={{ marginBottom: "10px" }}>
            <strong>{staff.name}</strong> ({staff.email}) - {staff.role}
            <br />
            Invite Link:{" "}
            <input
              type="text"
              readOnly
              value={inviteLinks[staff.id] || ""}
              style={{ width: "300px", marginRight: "10px" }}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLinks[staff.id]);
                alert("Invite link copied!");
              }}
            >
              Copy
            </button>
            <button
              onClick={() => handleRemoveInvite(staff.id)}
              style={{
                marginLeft: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* Active Staff */}
      <h3>Active Staff</h3>
      <ul>
        {activeStaff.map((staff) => (
          <li key={staff.id} style={{ marginBottom: "10px" }}>
            <strong>{staff.name}</strong> ({staff.email}), {staff.role}
            <button
              onClick={() => handleRemoveActiveStaff(staff.id)}
              style={{
                marginLeft: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* Leave Requests Management */}
      <h3 style={{ marginTop: "30px" }}>Leave Requests</h3>
      {leaveRequests.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: "0" }}>
          {leaveRequests.map((req) => {
            const staffInfo = staffMap[req.staffId] || {};
            return (
              <li
                key={req.id}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                }}
              >
                <strong>{req.type}</strong> request for{" "}
                <span>{req.date || "N/A"}</span>
                <p style={{ margin: "5px 0" }}>
                  <em>{req.reason}</em>
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                  From:{" "}
                  <strong>
                    {staffInfo.name || "Unknown"} ({staffInfo.email || req.staffId})
                  </strong>
                </p>
                <span
                  style={{
                    backgroundColor: getStatusColor(req.status),
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    marginRight: "10px",
                    textTransform: "capitalize",
                  }}
                >
                  {req.status}
                </span>

                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApproveLeave(req.id)}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        marginRight: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(req.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StaffManager;
