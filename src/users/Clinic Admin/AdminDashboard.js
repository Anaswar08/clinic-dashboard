import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

import DashboardHome from '../../modules/Dashboard/DashboardHome';
import Appointments from '../../modules/Dashboard/Appointments';
import Patients from '../../modules/Dashboard/Patients';
import Billing from '../../modules/Dashboard/Billing';
import Settings from '../../modules/Dashboard/Settings';
import UserProfile from '../../modules/Dashboard/UserProfile';
import FollowUp from '../../modules/Dashboard/FollowUps';
import Treatments from '../../modules/Dashboard/Treatments';
import Reports from '../../modules/Dashboard/Reports';
import StaffManager from './StaffManager';
import TaskManager from './TaskManager';
import Notifications from './Notifications';

function AdminDashboard() {
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
          <Route path="treatments" element={<Treatments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="staff-manager" element={<StaffManager />} />
          <Route path="task-manager" element={<TaskManager />} />
          <Route path="notifications" element={<Notifications/>}/>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;
