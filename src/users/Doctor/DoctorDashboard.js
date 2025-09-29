import React, { useEffect, useState } from "react";
import { db, auth } from "../../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from "firebase/firestore";

// Helper function to get today's date range
const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));
  const end = new Date(now.setHours(23, 59, 59, 999));
  return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
};

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    newAppointments: 0,
    urgentCases: 0,
  });

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const doctorId = auth.currentUser.uid;
    const { start, end } = getTodayRange();

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorId),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let total = 0;
      let completed = 0;
      let urgent = 0;
      let newAdded = 0;

      const todayAppointments = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;

        if (data.status === "completed") completed++;
        if (data.isUrgent) urgent++;
        if (data.createdAt?.toDate() >= start.toDate()) newAdded++;

        todayAppointments.push({
          id: doc.id,
          ...data,
        });
      });

      setStats({
        totalAppointments: total,
        completedAppointments: completed,
        urgentCases: urgent,
        newAppointments: newAdded,
      });

      setAppointments(todayAppointments);
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Doctor Dashboard</h2>
      <p>Today's Stats</p>

      {/* Stats Boxes */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={boxStyle("#2563eb")}>
          <h3>{stats.totalAppointments}</h3>
          <p>Total Appointments</p>
        </div>

        <div style={boxStyle("#16a34a")}>
          <h3>{stats.completedAppointments}</h3>
          <p>Completed</p>
        </div>

        <div style={boxStyle("#f59e0b")}>
          <h3>{stats.newAppointments}</h3>
          <p>New Appointments</p>
        </div>

        <div style={boxStyle("#dc2626")}>
          <h3>{stats.urgentCases}</h3>
          <p>Urgent Cases</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div style={{ marginTop: "40px" }}>
        <h3>Today's Appointments</h3>
        {appointments.length === 0 ? (
          <p>No appointments scheduled for today.</p>
        ) : (
          <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={thStyle}>Patient Name</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Procedure</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const apptTime = appt.date?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={appt.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{appt.patientName}</td>
                    <td style={tdStyle}>{apptTime}</td>
                    <td style={tdStyle}>{appt.procedure || "N/A"}</td>
                    <td style={tdStyle}>
                      {appt.status === "completed" ? "✅ Completed" : "⏳ Pending"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const boxStyle = (bgColor) => ({
  flex: 1,
  background: bgColor,
  color: "white",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
});

const thStyle = {
  padding: "10px",
  borderBottom: "2px solid #e5e7eb",
};

const tdStyle = {
  padding: "10px",
};

export default DoctorDashboard;
