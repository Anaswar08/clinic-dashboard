import { Routes, Route, Navigate } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "../../components/Header";

import SuperAdminHome from "./SuperAdminHome";
import Approval from "./Approval";
import Clinics from "./Clinics";
import Settings from '../../modules/Dashboard/Settings';

function SuperAdminDashboard() {
  return (
    <div style={{ display: "flex" }}>
      <SuperAdminSidebar />
      <div style={{ marginLeft: "250px", flex: 1 }}>
        <Header />
        <Routes>
          {/* Default dashboard panel */}
          <Route path="/" element={<SuperAdminHome />} />

          {/* Approval panel for pending doctors */}
          <Route path="approval" element={<Approval />} />

          {/* Clinics management */}
          <Route path="clinics" element={<Clinics />} />

          {/* Redirect unknown paths back to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />

          {/* Settings page */}
          <Route path="settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
