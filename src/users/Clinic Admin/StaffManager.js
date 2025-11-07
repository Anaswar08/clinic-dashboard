// src/pages/admin/StaffManager.js

import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
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
} from "firebase/firestore";
import { redistributeTasks } from "../../utils/taskBalancer"; // ✅ import the algorithm

const StaffManager = () => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [inviteList, setInviteList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [inviteLinks, setInviteLinks] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]); // ✅ store leave requests

  // Load pending invites
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staffInvites"), (snapshot) => {
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
  }, []);

  // Load active staff
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["staff", "doctor"]));
    const unsub = onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActiveStaff(staff);
    });
    return () => unsub();
  }, []);

  // ✅ Load all leave requests
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const leaves = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaveRequests(leaves);
    });
    return () => unsub();
  }, []);

  // --- Add new staff ---
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

  // --- Remove invite ---
  const handleRemoveInvite = async (id) => {
    if (window.confirm("Remove this staff invite?")) {
      await deleteDoc(doc(db, "staffInvites", id));
    }
  };

  // --- Remove active staff ---
  const handleRemoveActiveStaff = async (id) => {
    if (window.confirm("Remove this staff member?")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  // ✅ Approve leave + trigger task balancer
  const handleApproveLeave = async (leave) => {
    if (!window.confirm(`Approve ${leave.leaveType} leave for ${leave.staffName}?`)) return;

    try {
      const leaveRef = doc(db, "leaveRequests", leave.id);
      await updateDoc(leaveRef, { status: "approved" });

      // 🔄 Trigger task redistribution
      await redistributeTasks(
        leave.leaveType === "Full day" ? [leave.staffId] : [],
        leave.leaveType === "Half day" ? [leave.staffId] : []
      );

      alert("Leave approved and tasks redistributed successfully ✅");
    } catch (error) {
      console.error("Error approving leave:", error);
      alert("Failed to approve leave");
    }
  };

  // ❌ Reject leave
  const handleRejectLeave = async (leave) => {
    if (!window.confirm(`Reject leave for ${leave.staffName}?`)) return;

    try {
      const leaveRef = doc(db, "leaveRequests", leave.id);
      await updateDoc(leaveRef, { status: "rejected" });
      alert("Leave rejected ❌");
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert("Failed to reject leave");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Staff Manager</h2>

      {/* ➕ Add Staff */}
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

      {/* 📨 Pending Invites */}
      <h3>Pending Invites</h3>
      <ul>
        {inviteList.map((staff) => (
          <li key={staff.id}>
            <strong>{staff.name}</strong> ({staff.email}) - {staff.role}
            <br />
            Invite Link:{" "}
            <input
              type="text"
              readOnly
              value={inviteLinks[staff.id] || ""}
              style={{ width: "300px" }}
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
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* 👩‍⚕️ Active Staff */}
      <h3>Active Staff</h3>
      <ul>
        {activeStaff.map((staff) => (
          <li key={staff.id}>
            <strong>{staff.name}</strong> ({staff.email}) - {staff.role}
            <button
              onClick={() => handleRemoveActiveStaff(staff.id)}
              style={{
                marginLeft: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* 🗓 Leave Requests */}
      <h3>Leave Requests</h3>
      {leaveRequests.length === 0 ? (
        <p>No leave requests yet.</p>
      ) : (
        <ul>
          {leaveRequests.map((leave) => (
            <li
              key={leave.id}
              style={{
                borderBottom: "1px solid #ddd",
                marginBottom: "10px",
                paddingBottom: "5px",
              }}
            >
              <strong>{leave.staffName}</strong> — {leave.leaveType} leave <br />
              Date: {leave.date} <br />
              Reason: {leave.reason} <br />
              Status:{" "}
              <span
                style={{
                  color:
                    leave.status === "approved"
                      ? "green"
                      : leave.status === "rejected"
                      ? "red"
                      : "orange",
                }}
              >
                {leave.status}
              </span>
              {leave.status === "pending" && (
                <>
                  <br />
                  <button
                    onClick={() => handleApproveLeave(leave)}
                    style={{
                      marginTop: "5px",
                      marginRight: "10px",
                      background: "green",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectLeave(leave)}
                    style={{
                      marginTop: "5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StaffManager;