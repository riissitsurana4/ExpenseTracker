'use client'
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState('INR');
  const user = session?.user;

  useEffect(() => {
    if (!user) return;
    const fetchCurrency = async () => {
      const res = await fetch(`/api/user/currency?email=${user.email}`);
      const data = await res.json();
      if (data?.currency) setCurrency(data.currency);
    };
    fetchCurrency();
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/loginpages' });
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    await fetch('/api/user/currency', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, currency: newCurrency }),
    });
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
