'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const [userEmail, setUserEmail] = useState('');
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
    <div className="dropdown ms-auto">
      <button
        className="btn btn-white dropdown-toggle align-items-center"
        type="button"
        id="profileDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img src="/profile.png" alt="Profile" className="profile-icon" />
        
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
        <li>
          <Link className="dropdown-item text-secondary" href="#">
            Profile
          </Link>
        </li>
        <li>
          <Link className="dropdown-item text-secondary" href="#">
            Settings
          </Link>
        </li>
      
        <li>
      <button className="btn text-danger dropdown-item" onClick={handleLogout}>
        Logout
      </button>
      </li>
      </ul>
    </div>
  );
}
