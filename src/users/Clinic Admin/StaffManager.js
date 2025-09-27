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
} from "firebase/firestore";

const StaffManager = () => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [inviteList, setInviteList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [inviteLinks, setInviteLinks] = useState({});

  // Load pending staff invites
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

  // Load active staff (registered in `users` collection)
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

  // Add new staff invite
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
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

  // Remove staff invite
  const handleRemoveInvite = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff invite?")) {
      try {
        await deleteDoc(doc(db, "staffInvites", id));
      } catch (error) {
        console.error("Error removing staff invite:", error);
      }
    }
  };

  // Remove active staff (delete from `users`)
  const handleRemoveActiveStaff = async (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      try {
        // 1. Delete Firestore record
        await deleteDoc(doc(db, "users", id));

        // 2. Optional: Force logout if current user is removed
        if (auth.currentUser && auth.currentUser.uid === id) {
          await auth.signOut(); 
          window.location.href = "/"; // redirect to login
        }

        // 3. NOTE: For full deletion from Firebase Auth, 
        // this must be done with Firebase Admin SDK (backend/Cloud Function).
      } catch (error) {
        console.error("Error removing active staff:", error);
      }
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
            <strong>{staff.name}</strong> ({staff.email}),{staff.role}
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
    </div>
  );
};

export default StaffManager;
