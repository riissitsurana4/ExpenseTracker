'use client'
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CurrencyDisplay({ showSymbol = true, showCode = false, size = 24, className = "" }) {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState('INR');
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
    };
    fetchUserData();
  }, [user]);

  return (
    <span className={`d-inline-flex align-items-center gap-1 ${className}`}>
      {showSymbol && (
        <span style={{ fontSize: `${size}px` }} className="fw-bold">
          {getCurrencySymbol(currency)}
        </span>
      )}
      {showCode && (
        <span style={{ fontSize: `${size * 0.8}px` }} className="text-muted">
          {currency}
        </span>
      )}
    </span>
  );
}
