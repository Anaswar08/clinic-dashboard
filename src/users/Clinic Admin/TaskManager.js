import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const TaskManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("least");
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Load staff list
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "staff")),
      (snapshot) => {
        const staffData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStaffList(staffData);
      }
    );
    return () => unsub();
  }, []);

  // Load tasks for selected staff
  useEffect(() => {
    if (!selectedStaff) return;

    const unsub = onSnapshot(
      query(
        collection(db, "tasks"),
        where("staffId", "==", selectedStaff),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const allTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingTasks(allTasks.filter((t) => t.status !== "completed"));
        setCompletedTasks(allTasks.filter((t) => t.status === "completed"));
      }
    );
    return () => unsub();
  }, [selectedStaff]);

  // Add task
  const handleAddTask = async () => {
    if (!selectedStaff || !task) {
      alert("Please select staff and enter a task.");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        staffId: selectedStaff,
        task,
        description,
        priority,
        status: "pending", // default status
        createdAt: serverTimestamp(),
      });

      setTask("");
      setDescription("");
      setPriority("least");
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task");
    }
  };

  // Priority colors
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Manager</h2>

      {/* Staff Selector */}
      <div style={{ marginBottom: "15px" }}>
        <label>Select Staff: </label>
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="">-- Choose Staff --</option>
          {staffList.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name} ({staff.email})
            </option>
          ))}
        </select>
      </div>

      {/* Add Task */}
      {selectedStaff && (
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Enter task title"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            style={{ marginRight: "10px", width: "300px", marginBottom: "10px" }}
          />
          <br />
          <textarea
            placeholder="Enter task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "400px", height: "80px", marginBottom: "10px" }}
          />
          <br />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ marginRight: "10px" }}
          >
            <option value="most">Most Important</option>
            <option value="mid">Mid Priority</option>
            <option value="least">Least Priority</option>
          </select>
          <button onClick={handleAddTask}>Add Task</button>
        </div>
      )}

      {/* Pending Tasks */}
      {selectedStaff && (
        <div style={{ marginBottom: "30px" }}>
          <h3>Tasks for Selected Staff</h3>
          {pendingTasks.length === 0 ? (
            <p>No pending tasks.</p>
          ) : (
            <ul>
              {pendingTasks.map((t) => (
                <li key={t.id} style={{ marginBottom: "15px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: getPriorityColor(t.priority),
                      marginRight: "8px",
                    }}
                  ></span>
                  <strong>{t.task}</strong>
                  <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                    {t.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Completed Tasks */}
      {selectedStaff && (
        <div>
          <h3>Tasks Completed</h3>
          {completedTasks.length === 0 ? (
            <p>No tasks completed yet.</p>
          ) : (
            <ul>
              {completedTasks.map((t) => (
                <li
                  key={t.id}
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
                      backgroundColor: getPriorityColor(t.priority),
                      marginRight: "8px",
                    }}
                  ></span>
                  {t.task}
                  <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskManager;
