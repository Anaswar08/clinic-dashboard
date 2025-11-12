// src/pages/staff/LeaveRequest.js

import React, { useState, useEffect } from "react";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, onSnapshot } from "firebase/firestore";

const LeaveRequest = () => {
  const [leaveType, setLeaveType] = useState("Full day");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ Staff info for automatic linking
  const [staffData, setStaffData] = useState(null);
  const [myLeaveRequests, setMyLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch staff data on mount
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("Not logged in.");
          return;
        }

        const staffRef = doc(db, "users", currentUser.uid);
        const staffSnap = await getDoc(staffRef);

        if (!staffSnap.exists()) {
          alert("User data not found.");
          return;
        }

        setStaffData({ id: currentUser.uid, ...staffSnap.data() });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching staff data:", error);
        alert("Failed to load user information.");
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  // ✅ Load this staff member's leave requests
  useEffect(() => {
    if (!staffData) return;

    const leaveQuery = query(
      collection(db, "leaveRequests"),
      where("staffId", "==", staffData.id)
    );

    const unsub = onSnapshot(leaveQuery, (snapshot) => {
      const leaves = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by date (newest first)
      leaves.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setMyLeaveRequests(leaves);
    });

    return () => unsub();
  }, [staffData]);

  // ✅ Submit leave request with automatic clinic linking
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !reason.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    if (!staffData || !staffData.clinicId) {
      alert("Clinic information not found. Please contact your admin.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "leaveRequests"), {
        staffId: staffData.id,
        staffName: staffData.name,
        staffEmail: staffData.email,
        clinicId: staffData.clinicId,        // ✅ Automatically linked to clinic
        role: staffData.role,
        leaveType: leaveType,
        date: date,
        reason: reason,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Leave request submitted successfully! 🎉");

      // Reset form
      setDate("");
      setReason("");
      setLeaveType("Full day");
      setSubmitting(false);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("Failed to submit leave request: " + error.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!staffData) {
    return <div style={{ padding: "20px" }}>Unable to load user information.</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Request Leave</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Logged in as: <strong>{staffData.name}</strong> ({staffData.role})
      </p>

      {/* Submit New Leave Request */}
      <form 
        onSubmit={handleSubmit}
        style={{ 
          padding: "20px", 
          border: "1px solid #ddd", 
          borderRadius: "5px",
          marginBottom: "30px",
          background: "#f9f9f9"
        }}
      >
        <h3>Submit New Leave Request</h3>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Leave Type *
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          >
            <option value="Full day">Full Day</option>
            <option value="Half day">Half Day</option>
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]} // Prevent past dates
            required
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for your leave..."
            required
            rows={4}
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 24px",
            background: submitting ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Submitting..." : "Submit Leave Request"}
        </button>
      </form>

      {/* My Leave Requests History */}
      <div>
        <h3>My Leave Requests ({myLeaveRequests.length})</h3>
        
        {myLeaveRequests.length === 0 ? (
          <p style={{ color: "#666" }}>You haven't submitted any leave requests yet.</p>
        ) : (
          <div>
            {myLeaveRequests.map((leave) => (
              <div
                key={leave.id}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  background: 
                    leave.status === "approved" ? "#E8F5E9" :
                    leave.status === "rejected" ? "#FFEBEE" :
                    "#FFF9C4"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ fontSize: "16px" }}>{leave.leaveType}</strong>
                      <span style={{ marginLeft: 10, color: "#666" }}>
                        📅 {new Date(leave.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ marginBottom: 5, fontSize: "14px" }}>
                      <strong>Reason:</strong> {leave.reason}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Submitted: {leave.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        background:
                          leave.status === "approved"
                            ? "#4CAF50"
                            : leave.status === "rejected"
                            ? "#f44336"
                            : "#FFC107",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "12px",
                        textTransform: "uppercase"
                      }}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>

                {leave.status === "rejected" && leave.rejectionReason && (
                  <div style={{ 
                    marginTop: 10, 
                    padding: "10px", 
                    background: "#FFCDD2", 
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}>
                    <strong>Rejection Reason:</strong> {leave.rejectionReason}
                  </div>
                )}

                {leave.status === "approved" && leave.approvedAt && (
                  <div style={{ 
                    marginTop: 10, 
                    fontSize: "12px", 
                    color: "#2E7D32"
                  }}>
                    ✓ Approved on {leave.approvedAt?.toDate?.()?.toLocaleString()}
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

export default LeaveRequest;