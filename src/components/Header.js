import { FaUserCircle } from 'react-icons/fa';
import { IoIosNotifications } from "react-icons/io";
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const Header = () => {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null); // user role
  const [unreadCount, setUnreadCount] = useState(0);

  // Get logged-in user UID
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);

        // Fetch user role from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role); // assume field is 'role'
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to unread notifications for admin role
  useEffect(() => {
    if (!userId || role !== 'admin') return;

    const q = query(collection(db, 'announcements'), where('targetRole', '==', 'admin'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unread = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.readBy?.includes(userId);
      }).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [userId, role]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '50px',
      padding: '0 20px',
      backgroundColor: '#f3f4f6',
      top: 0,
      zIndex: 1000,
    }}>
      <h1>Dashboard</h1>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {role === 'admin' && (
          <Link to="/admin-dashboard/notifications" style={{ color: '#1e40af', fontSize: '24px', marginRight: '12px', position: 'relative' }}>
            <IoIosNotifications />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'red',
                display: 'inline-block',
              }} />
            )}
          </Link>
        )}
        <Link to="/doctor-dashboard/profile" style={{ color: '#1e40af', fontSize: '24px' }}>
          <FaUserCircle />
        </Link>
      </div>
    </div>
  );
};

export default Header;
