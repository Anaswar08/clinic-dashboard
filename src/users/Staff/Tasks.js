import React, { useState, useEffect } from "react";
import { auth, db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showLeaveInput, setShowLeaveInput] = useState(false);
  const [showHalfDayInput, setShowHalfDayInput] = useState(false);
  const [reason, setReason] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const staffId = auth.currentUser.uid;

    // Listen for tasks
    const q = query(
      collection(db, "tasks"),
      where("staffId", "==", staffId),
      orderBy("createdAt", "desc")
    );

    const unsubTasks = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasks(allTasks.filter((t) => t.status !== "completed"));
      setCompletedTasks(allTasks.filter((t) => t.status === "completed"));
    });

    // Listen for leave requests
    const leaveQ = query(
      collection(db, "leaveRequests"),
      where("staffId", "==", staffId),
      orderBy("createdAt", "desc")
    );

    const unsubLeaves = onSnapshot(leaveQ, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaveRequests(requests);
    });

    return () => {
      unsubTasks();
      unsubLeaves();
    };
  }, []);

  const handleComplete = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), { status: "completed" });
    } catch (error) {
      console.error("Error marking task as complete:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "most":
        return "red";
      case "mid":
        return "orange";
      case "least":
        return "green";
      default:
        return "gray";
    }
  };

  // --- Handle Leave Request Click ---
  const handleLeaveRequestClick = () => {
    setShowLeaveInput(true);
    setShowHalfDayInput(false);
    setReason("");
    setLeaveDate("");
  };

  // --- Handle Half Day Request Click ---
  const handleHalfDayRequestClick = () => {
    setShowHalfDayInput(true);
    setShowLeaveInput(false);
    setReason("");
    setLeaveDate("");
  };

  // --- Submit Leave / Half Day Request ---
  const handleSubmitRequest = async (type) => {
    if (!leaveDate) {
      alert("Please select a date.");
      return;
    }
    if (!reason.trim()) {
      alert("Please enter a reason before submitting.");
      return;
    }

    try {
      await addDoc(collection(db, "leaveRequests"), {
        staffId: auth.currentUser.uid,
        type, // 'Leave' or 'Half Day'
        reason,
        date: leaveDate,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      alert(`${type} request submitted successfully ✅`);
      setShowLeaveInput(false);
      setShowHalfDayInput(false);
      setReason("");
      setLeaveDate("");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
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
      <h2>My Tasks</h2>

      {/* Leave and Half Day Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleLeaveRequestClick}
          style={{
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          Leave
        </button>
        <button
          onClick={handleHalfDayRequestClick}
          style={{
            backgroundColor: "#28A745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Half Day
        </button>
      </div>

      {/* Request Form */}
      {(showLeaveInput || showHalfDayInput) && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "15px",
            marginBottom: "20px",
            backgroundColor: "#f9f9f9",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          <h4>
            {showLeaveInput ? "Leave Request 🏖️" : "Half-Day Request ☀️"}
          </h4>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Date:
          </label>
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            style={{
              padding: "6px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              width: "100%",
              marginBottom: "10px",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Reason:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            rows={4}
            style={{
              width: "100%",
              borderRadius: "4px",
              border: "1px solid #ccc",
              padding: "8px",
              resize: "none",
            }}
          ></textarea>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() =>
                handleSubmitRequest(showLeaveInput ? "Leave" : "Half Day")
              }
              style={{
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 14px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowLeaveInput(false);
                setShowHalfDayInput(false);
                setReason("");
                setLeaveDate("");
              }}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Leave Request History */}
      <h3>My Leave Requests</h3>
      {leaveRequests.length === 0 ? (
        <p>No leave requests submitted yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: "0" }}>
          {leaveRequests.map((req) => (
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
              <strong>{req.type}</strong> on{" "}
              <span>{req.date || "N/A"}</span>
              <p style={{ margin: "5px 0" }}>{req.reason}</p>
              <span
                style={{
                  backgroundColor: getStatusColor(req.status),
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  textTransform: "capitalize",
                }}
              >
                {req.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Pending Tasks */}
      <h3>Pending Tasks</h3>
      {tasks.length === 0 ? (
        <p>No pending tasks 🎉</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} style={{ marginBottom: "15px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getPriorityColor(task.priority),
                  marginRight: "8px",
                }}
              ></span>
              <strong>{task.task}</strong>
              <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                {task.description}
              </p>
              <button
                onClick={() => handleComplete(task.id)}
                style={{
                  backgroundColor: "#ffc107",
                  border: "none",
                  borderRadius: "4px",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Complete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Completed Tasks */}
      <h3>Completed Tasks</h3>
      {completedTasks.length === 0 ? (
        <p>No tasks completed yet.</p>
      ) : (
        <ul>
          {completedTasks.map((task) => (
            <li
              key={task.id}
              style={{
                marginBottom: "15px",
                textDecoration: "line-through",
                opacity: 0.6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getPriorityColor(task.priority),
                  marginRight: "8px",
                }}
              ></span>
              {task.task}
              <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                {task.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Tasks;
