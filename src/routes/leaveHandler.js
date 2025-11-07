// import express from "express";
// import { redistributeTasks } from "../utils/taskBalancer.js";

// const router = express.Router();

// router.post("/approve-leave", async (req, res) => {
//   try {
//     const { fullLeaveStaff, halfLeaveStaff, clinicId } = req.body;

//     // ✅ Step 1: Update Firestore to mark these staff as on leave
//     // (Your existing leave approval logic goes here)

//     // ✅ Step 2: Trigger task redistribution
//     const result = await redistributeTasks(fullLeaveStaff, halfLeaveStaff, clinicId);

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error approving leave:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// export default router;
