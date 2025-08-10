'use client'
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState('INR');
  const [avatar, setAvatar] = useState('/profile.svg');
  const user = session?.user;

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CNY: '¥'
    };
    return symbols[currencyCode] || '$';
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const res = await fetch('/api/user/currency');
      const data = await res.json();
      if (data?.currency) setCurrency(data.currency);
      if (data?.avatar) setAvatar(data.avatar);
    };
    fetchUserData();
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
      body: JSON.stringify({ currency: newCurrency }),
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
        <img 
          src={avatar} 
          alt="Profile" 
          className="profile-icon" 
          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
        />
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
            <label htmlFor="currencySelect" className="form-label text-secondary">Currency</label>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold" style={{ fontSize: '18px' }}>
                {getCurrencySymbol(currency)}
              </span>
              <select
                id="currencySelect"
                className="form-select"
                value={currency}
                onChange={handleCurrencyChange}
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="JPY">¥ JPY</option>
                <option value="AUD">A$ AUD</option>
                <option value="CAD">C$ CAD</option>
                <option value="CNY">¥ CNY</option>
              </select>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
