import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';

const SuperAdminHome = () => {
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
      <h3>What is up Mother Fuc*er</h3>
      <p>Super Admin progress chart comming soon da maams</p>
    </div>
  );
};

export default SuperAdminHome;
