import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '50px',
      padding: '0 20px',
      backgroundColor: '#f3f4f6',
      // position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <h1>Dashboard</h1>
      <Link to="/doctor-dashboard/profile" style={{ color: '#1e40af', fontSize: '24px' }}>
        <FaUserCircle />
      </Link>
    </div>
  );
};

export default Header;
