import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { followUpTemplates } from '../../components/messageTemplates';

export default function FollowUpSystem() {
  const [appointments, setAppointments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(followUpTemplates[0]);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    async function fetchAppointments() {
      const snapshot = await getDocs(collection(db, "appointments"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    }
    fetchAppointments();
  }, []);

  function fillTemplate(template, { name, treatment, time, phone }) {
    return template
      .replace("{{name}}", name)
      .replace("{{treatment}}", treatment)
      .replace("{{time}}", time)
      .replace("{{phone}}", phone);
  }

  function handleSendReminder(appointment) {
    const formattedMessage = fillTemplate(
      selectedTemplate || customText,
      {
        name: appointment.patientName,
        treatment: appointment.treatment,
        time: appointment.time,
        phone: appointment.phone
      }
    );
    // Call backend or Twilio API to send message
    console.log("Sending:", formattedMessage);
  }

  function handleCancelReminder(appointmentId) {
    // Here you would call your backend to cancel the scheduled reminder
    console.log(`Canceling reminder for appointment ID: ${appointmentId}`);
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Follow-Up System</h2>
      <div className="my-4">
        <label>Choose Template:</label>
        <select
          className="border p-2 w-full"
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {followUpTemplates.map((template, idx) => (
            <option key={idx} value={template}>{template}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {selectedTemplate === "custom" && (
          <textarea
            className="border mt-2 w-full p-2"
            placeholder="Enter custom message"
            onChange={(e) => setCustomText(e.target.value)}
          ></textarea>
        )}
      </div>
      <div>
        {appointments.map((apt) => (
          <div key={apt.id} className="border p-4 mb-2 rounded shadow">
            <p><strong>Patient:</strong> {apt.patientName}</p>
            <p><strong>Treatment:</strong> {apt.treatment}</p>
            <p><strong>Time:</strong> {apt.time}</p>
            <p><strong>Phone:</strong> {apt.phone}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSendReminder(apt)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send Reminder Now
              </button>
              <button
                onClick={() => handleCancelReminder(apt.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancel Reminder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
