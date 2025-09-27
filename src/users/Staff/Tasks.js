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
} from "firebase/firestore";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const staffId = auth.currentUser.uid;

    const q = query(
      collection(db, "tasks"),
      where("staffId", "==", staffId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasks(allTasks.filter((t) => t.status !== "completed"));
      setCompletedTasks(allTasks.filter((t) => t.status === "completed"));
    });

    return () => unsub();
  }, []);

  const handleComplete = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), {
        status: "completed",
      });
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Tasks</h2>

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
              <button onClick={() => handleComplete(task.id)}>Complete</button>
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
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Tasks;
