// ✅ utils/taskBalancer.js
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const PRIORITY_WEIGHTS = { High: 3, Medium: 2, Low: 1 };

export async function redistributeTasks(leaveFullIds = [], leaveHalfIds = [], clinicId = null) {
  try {
    console.log("🔄 Starting task redistribution...");
    console.log("Full leave staff:", leaveFullIds);
    console.log("Half-day staff:", leaveHalfIds);

    // 1️⃣ Get users and tasks
    const usersSnap = await getDocs(collection(db, "users"));
    const tasksSnap = await getDocs(collection(db, "tasks"));

    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const tasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 2️⃣ Filter ONLY users with role === "staff"
    const staff = users.filter(
      (u) => u.role && u.role.toLowerCase() === "staff"
    );

    console.log("👥 Active staff pool for redistribution:", staff.map(s => s.id));

    // 3️⃣ Compute workload for each staff (sum of priority weights)
    const staffLoad = {};
    for (const s of staff) {
      const assignedTasks = tasks.filter((t) => t.staffId === s.id);
      const totalLoad = assignedTasks.reduce(
        (sum, t) => sum + (PRIORITY_WEIGHTS[t.priority] || 1),
        0
      );
      staffLoad[s.id] = totalLoad;
    }

    // 4️⃣ Set availability (0 = full leave, 0.5 = half day, 1 = available)
    const staffAvail = {};
    for (const s of staff) {
      if (leaveFullIds.includes(s.id)) staffAvail[s.id] = 0.0;
      else if (leaveHalfIds.includes(s.id)) staffAvail[s.id] = 0.5;
      else staffAvail[s.id] = 1.0;
    }

    // 5️⃣ Gather tasks to redistribute
    let tasksToRedistribute = tasks.filter((t) => leaveFullIds.includes(t.staffId));
    let tasksRemaining = tasks.filter((t) => !leaveFullIds.includes(t.staffId));

    // Handle half-day leave staff — reassign half their tasks
    for (const sid of leaveHalfIds) {
      const halfTasks = tasks.filter((t) => t.staffId === sid);
      const toMove = Math.floor(halfTasks.length / 2);
      const shuffled = [...halfTasks].sort(() => 0.5 - Math.random());
      const redistributeHalf = shuffled.slice(0, toMove);

      tasksToRedistribute = tasksToRedistribute.concat(redistributeHalf);
      tasksRemaining = tasksRemaining.filter((t) => !redistributeHalf.some((x) => x.id === t.id));
    }

    // 6️⃣ Sort tasks by priority for fair redistribution
    tasksToRedistribute.sort(
      (a, b) => (PRIORITY_WEIGHTS[b.priority] || 1) - (PRIORITY_WEIGHTS[a.priority] || 1)
    );

    // 7️⃣ Define active staff (excluding full-leave)
    const activeStaff = staff.filter((s) => !leaveFullIds.includes(s.id));
    for (const leaveId of leaveFullIds) {
      delete staffLoad[leaveId];
    }

    // 8️⃣ Redistribute tasks among available staff
    for (const task of tasksToRedistribute) {
      const availableStaff = activeStaff.filter((s) => staffAvail[s.id] > 0);
      if (availableStaff.length === 0) continue; // Safety check

      const effectiveLoads = availableStaff.map((s) => ({
        id: s.id,
        effectiveLoad: staffLoad[s.id] / staffAvail[s.id],
      }));

      const target = effectiveLoads.reduce((min, s) =>
        s.effectiveLoad < min.effectiveLoad ? s : min
      );

      // ✅ Assign new staff and update workload
      task.staffId = target.id;
      staffLoad[target.id] =
        (staffLoad[target.id] || 0) + (PRIORITY_WEIGHTS[task.priority] || 1);

      // Update or add to tasksRemaining
      const existingIndex = tasksRemaining.findIndex((t) => t.id === task.id);
      if (existingIndex >= 0) tasksRemaining[existingIndex] = task;
      else tasksRemaining.push(task);
    }

    // 9️⃣ Batch update all redistributed tasks in Firestore
    const batch = writeBatch(db);
    for (const task of tasksRemaining) {
      const taskRef = doc(db, "tasks", task.id);
      batch.update(taskRef, {
        staffId: task.staffId,
        updatedAt: Timestamp.now(),
      });
      console.log(`🔁 Updating task: ${task.id} → New staff: ${task.staffId}`);
    }

    await batch.commit();
    console.log("✅ Firestore successfully updated with redistributed tasks.");

    // 🔟 Log redistribution event for analytics / ML
    await addDoc(collection(db, "taskRedistributionLogs"), {
      timestamp: Timestamp.now(),
      clinicId: clinicId || "defaultClinic",
      leaveFullIds,
      leaveHalfIds,
      tasksAfter: tasksRemaining.map((t) => ({
        id: t.id,
        staffId: t.staffId,
        priority: t.priority,
      })),
      staffLoadAfter: staffLoad,
    });

    console.log("📘 Redistribution logged successfully.");
    return { success: true };
  } catch (error) {
    console.error("❌ Error redistributing tasks:", error);
    return { success: false, error: error.message };
  }
}