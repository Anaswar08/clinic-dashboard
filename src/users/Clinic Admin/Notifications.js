import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get logged-in admin UID
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setAdminId(user.uid);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch all announcements for admin
  useEffect(() => {
    if (!adminId) return;

    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminNotifications = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => msg.targetRole === "admin");
      setNotifications(adminNotifications);
    });

    return () => unsubscribe();
  }, [adminId]);

  // Mark all unread notifications as read when page is opened
  useEffect(() => {
    if (!adminId || notifications.length === 0) return;

    notifications.forEach(async (msg) => {
      if (!msg.readBy?.includes(adminId)) {
        const docRef = doc(db, "announcements", msg.id);
        await updateDoc(docRef, {
          readBy: arrayUnion(adminId),
        });
      }
    });
  }, [adminId, notifications]);

  // Inline styles
  const styles = {
    container: {
      maxWidth: "600px",
      margin: "40px auto",
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "20px",
      textAlign: "center",
    },
    card: {
      border: "1px solid #e0e0e0",
      padding: "15px",
      marginBottom: "15px",
      borderRadius: "10px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    cardTitle: {
      fontSize: "1.1rem",
      fontWeight: 600,
      marginBottom: "5px",
      color: "#222",
    },
    cardMessage: {
      fontSize: "0.95rem",
      color: "#555",
      marginBottom: "8px",
    },
    cardSmall: {
      fontSize: "0.8rem",
      color: "#999",
    },
  };

  if (loading) return <p style={{ textAlign: "center", color: "#777" }}>Loading notifications...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Notifications</h2>
      {notifications.length === 0 && <p style={{ textAlign: "center", color: "#777" }}>No notifications yet.</p>}
      {notifications.map(msg => (
        <div key={msg.id} style={styles.card}>
          <h3 style={styles.cardTitle}>{msg.title}</h3>
          <p style={styles.cardMessage}>{msg.message}</p>
          <small style={styles.cardSmall}>Priority: {msg.priority}</small>
        </div>
      ))}
    </div>
  );
}

export default Notifications;
