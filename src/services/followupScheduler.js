import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase"; // adjust path if needed

// Helper: check if appointment is 1 hour away
function isOneHourAway(appointmentTime) {
  const now = new Date();
  const appt = new Date(appointmentTime);
  const diff = appt - now; // milliseconds
  return diff > 0 && diff <= 60 * 60 * 1000; // within 1 hour
}

// Main scheduler
export async function startFollowupScheduler() {
  console.log("Follow-up scheduler started...");

  setInterval(async () => {
    console.log("Checking appointments...");

    const querySnapshot = await getDocs(collection(db, "appointments"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.appointmentTime && isOneHourAway(data.appointmentTime)) {
        console.log(`Sending follow-up for ${data.patientName} at ${data.appointmentTime}`);
        // Later: send email/SMS here
      }
    });
  }, 60 * 1000); // run every 1 minute for testing
}
