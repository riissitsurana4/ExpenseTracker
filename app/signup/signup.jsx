'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import styles from './signup.module.css';
import Link from 'next/link';


const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Account created successfully! Please check your email for confirmation.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError('Failed to create Account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.heading}>Sign UP</h2>
        {error && <div className={styles.error}>{error}</div>}

        <div>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={styles.label}>Password</label>
          <div className={styles.relative}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.toggleButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className={styles.label}>Confirmpassword</label>
          <div className={styles.relative}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.toggleButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <button type="submit" className={styles.button} disabled={loading}>
            <UserPlus size={16} style={{ marginRight: '8px' }} />
            {loading ? 'creating...' : 'Create Account'}

          </button>
        </div>

        <div className={styles.footerLinks}>
          <p className="switch-auth">
            Already have an account? <Link href="/loginpages">Sign in</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;