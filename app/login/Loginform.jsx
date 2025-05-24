'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

const supabase = createClient();

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setError('');
        router.push('/dashboard'); // Redirect to /dashboard after successful login
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.heading}>Welcome back</h2>
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
          <button type="submit" className={styles.button} disabled={loading}>
            <LogIn size={18} style={{ marginRight: '0.5rem' }} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <div className={styles.footerLinks}>
          <a href="#">Forgot password?</a>
          <span className={styles.linkSpacer}>•</span>
          <a href="/signup">Create an account</a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
