import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

function SentAnnouncements() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return { backgroundColor: "#ffe5e5", color: "#d32f2f" };
      case "Normal":
      default:
        return { backgroundColor: "#e0f0ff", color: "#0277bd" };
    }
  };

  // Inline CSS styles
  const styles = {
    container: {
      maxWidth: "900px",
      margin: "40px auto",
      padding: "20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "30px",
      textAlign: "center",
    },
    noAnnouncements: {
      textAlign: "center",
      color: "#777",
      fontSize: "1.1rem",
      marginTop: "20px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
    },
    card: {
      backgroundColor: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    cardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    cardTitle: {
      fontSize: "1.2rem",
      fontWeight: 600,
      color: "#222",
    },
    cardMessage: {
      fontSize: "1rem",
      color: "#555",
      marginBottom: "15px",
    },
    cardDate: {
      fontSize: "0.8rem",
      color: "#999",
    },
    priority: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sent Announcements</h1>

      {messages.length === 0 && (
        <p style={styles.noAnnouncements}>No announcements sent yet.</p>
      )}

      <div style={styles.grid}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={styles.card}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-5px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{msg.title}</h2>
              <span style={{ ...styles.priority, ...getPriorityStyle(msg.priority) }}>
                {msg.priority}
              </span>
            </div>
            <p style={styles.cardMessage}>{msg.message}</p>
            <small style={styles.cardDate}>
              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : ""}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SentAnnouncements;
