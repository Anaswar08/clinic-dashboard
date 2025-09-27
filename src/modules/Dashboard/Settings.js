import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear(); // Optional: clear stored user data
      navigate('/'); // Redirect to login page
    } catch (error) { 
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Welcome to Settings</h3>
      <p>Overview section for Patients, Appointments, Revenue, etc. (Firebase stats coming soon)</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#1e40af',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Settings;
