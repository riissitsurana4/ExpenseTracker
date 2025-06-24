'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const [userEmail, setUserEmail] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email);
      }
      const { data: userData } = await supabase
        .from('users')
        .select('currency')
        .eq('id', data.user.id)
        .single();
      if (userData?.currency) {
        setCurrency(userData.currency);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/loginpages');
  };
  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    await supabase
      .from('users')
      .update({ currency: newCurrency })
      .eq('id', userId);
    window.location.reload();
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
          <Link className="dropdown-item text-secondary" href="/settings">
            Settings
          </Link>
        </li>
        <li>
          <button className="btn text-danger dropdown-item" onClick={handleLogout}>
            Logout
          </button>
        </li>
        <li>
          <div className="dropdown-item text">
            <label htmlFor="currencySelect" className="form-label text-secondary ">Currency</label>
            <select
              id="currencySelect"
              className="form-select"
              value={currency}
              onChange={handleCurrencyChange}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </li>
      </ul>
    </div>
  );
}
