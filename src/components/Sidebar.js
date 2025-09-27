import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div
      style={{
        width: '250px',
        height: '100vh',
        background: '#1e40af',
        color: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h2 style={{ marginBottom: '30px' }}>ClinicPro</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/appointments" style={{ color: 'white', textDecoration: 'none' }}>
                Appointments
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/patients" style={{ color: 'white', textDecoration: 'none' }}>
                Patients
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/billing" style={{ color: 'white', textDecoration: 'none' }}>
                Billing
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/followups" style={{ color: 'white', textDecoration: 'none' }}>
                FollowUp
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/treatments" style={{ color: 'white', textDecoration: 'none' }}>
                Treatments
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/reports" style={{ color: 'white', textDecoration: 'none' }}>
                Reports
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/staff-manager" style={{ color: 'white', textDecoration: 'none' }}>
                Staff Management
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/admin-dashboard/task-manager" style={{ color: 'white', textDecoration: 'none' }}>
                Task Management
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link to="/admin-dashboard/settings" style={{ color: 'white', textDecoration: 'none' }}>
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
