import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SuperAdminDashboard from "./users/SuperAdmin/SuperAdminDashboard";
import AdminDashboard from "./users/Clinic Admin/AdminDashboard";
import StaffRegister from "./pages/StaffRegister";
import StaffDashboard from "./users/Staff/StaffDashboard";
import DoctorDashboard from "./users/Doctor/DoctorHub";

// Components
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Super Admin dashboard (protected) */}
        <Route
          path="/super-admin-dashboard/*"
          element={
            <PrivateRoute allowedRole="super-admin">
              <SuperAdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Admin dashboard (protected) */}
        <Route
          path="/admin-dashboard/*"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Staff dashboard (protected, optional role check if needed) */}
        <Route
          path="/staff-dashboard/*"
          element={
            <PrivateRoute allowedRole="staff">
              <StaffDashboard />
            </PrivateRoute>
          }
        />

        {/* Doctor dashboard (protected, optional role check if needed) */}
        <Route
          path="/doctor-hub/*"
          element={
            <PrivateRoute allowedRole="doctor">
              <DoctorDashboard />
            </PrivateRoute>
          }
        />

        {/* Staff invitation registration (public) */}
        <Route path="/staff-register" element={<StaffRegister />} />
      </Routes>
    </Router>
  );
};

export default App;