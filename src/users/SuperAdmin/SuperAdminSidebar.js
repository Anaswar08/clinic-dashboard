import { Link } from 'react-router-dom';

const SuperAdminSidebar = () => {
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
        <h2 style={{ marginBottom: '30px' }}>SuperAdmin</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/super-admin-dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                Home
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/super-admin-dashboard/approval" style={{ color: 'white', textDecoration: 'none' }}>
                Approval Panal
              </Link>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <Link to="/super-admin-dashboard/clinics" style={{ color: 'white', textDecoration: 'none' }}>
                Current Clinics
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link to="/super-admin-dashboard/settings" style={{ color: 'white', textDecoration: 'none' }}>
          Settings
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
