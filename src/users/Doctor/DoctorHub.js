import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './DoctorSidebar';
import Header from '../../components/Header';

import Appointments from '../../modules/Dashboard/Appointments';
import Patients from '../../modules/Dashboard/Patients';
import Settings from '../../modules/Dashboard/Settings';
import UserProfile from '../../modules/Dashboard/UserProfile';
import DoctorDashboard from './DoctorDashboard';

function DoctorHub() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', flex: 1 }}>
        <Header />
        <Routes>
          <Route path="/" element={<DoctorDashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default DoctorHub;
