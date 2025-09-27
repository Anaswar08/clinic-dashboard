import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div
      style={{
        width: '250px',
        height: '100vh',
        background: '#1f43acff',
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
        <h2 style={{ marginBottom: '30px' }}>Doctor Sidebar</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/doctor-dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/doctor-dashboard/appointments" style={{ color: 'white', textDecoration: 'none' }}>
                Appointments
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/doctor-dashboard/patients" style={{ color: 'white', textDecoration: 'none' }}>
                Patients
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/doctor-dashboard/billing" style={{ color: 'white', textDecoration: 'none' }}>
                Billing
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/doctor-dashboard/followups" style={{ color: 'white', textDecoration: 'none' }}>
                FollowUp
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link to="/doctor-dashboard/settings" style={{ color: 'white', textDecoration: 'none' }}>
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
