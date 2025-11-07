import { useState } from "react";
import { db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function SendAnnouncement({ superAdminId }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("Normal");

  const handleSend = async () => {
    if (!title || !message) return alert("Please fill all fields");

    try {
      await addDoc(collection(db, "announcements"), {
        title,
        message,
        priority,
        targetRole: "admin",   // All admins
        createdAt: serverTimestamp(),
        sentBy: superAdminId || "superAdmin01",
        readBy: []             // track read admins
      });

      setTitle("");
      setMessage("");
      setPriority("Normal");

      alert("Announcement sent to all admins!");
    } catch (error) {
      console.error("Error sending announcement:", error);
      alert("Failed to send announcement. Try again.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Send Announcement</h2>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="border p-2 mb-2 w-full"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <select
        className="border p-2 mb-2 w-full"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="Normal">Normal</option>
        <option value="High">High</option>
      </select>
      <button
        className="bg-blue-500 text-white p-2 w-full"
        onClick={handleSend}
      >
        Send
      </button>
    </div>
  );
}

export default SendAnnouncement;
