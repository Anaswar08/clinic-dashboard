import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './DoctorSidebar';
import Header from '../../components/Header';

import DashboardHome from '../../modules/Dashboard/DashboardHome';
import Appointments from '../../modules/Dashboard/Appointments';
import Patients from '../../modules/Dashboard/Patients';
import Billing from '../../modules/Dashboard/Billing';
import Settings from '../../modules/Dashboard/Settings';
import UserProfile from '../../modules/Dashboard/UserProfile';
import FollowUp from '../../modules/Dashboard/FollowUps';

function StaffDashboard() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1 }}>
        <Header />
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="followups" element={<FollowUp />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default StaffDashboard;
