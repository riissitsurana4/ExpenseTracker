'use client'
import {useEffect, useState} from 'react';
import { supabase } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import './Header.css';

export default function Header() {
  const [userEmail, setUserEmail] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserEmail(data.user.email);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/loginpages');
  };

  return (
    <header className="app-header">
      <div className="logo">MyExpenses</div>
      <div className="profile">
        <button className="profile-btn" onClick={() => setShowMenu(!showMenu)}>
          {userEmail || 'Account'}
        </button>
        {showMenu && (
          <div className="dropdown">
            <p>{userEmail}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
