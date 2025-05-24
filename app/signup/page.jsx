'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/auth';
import SignUp from './signup';
import styles from './signup.module.css'; 

export default function SignupPage() {
        const { isAuthenticated, loading } = useAuth(); // Include loading state
        const router = useRouter();
        useEffect(() => {
            if (loading) return; // Wait until loading is false

            console.log('isAuthenticated:', isAuthenticated); // Debugging log
            if (isAuthenticated) {
                console.log('Redirecting to /dashboard');
                router.push('/dashboard');
            } else {
                console.log('Staying on signup page');
            }
        }, [isAuthenticated, loading, router]);
    return(
        <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>ExpenseTracker</h1>
          <p className={styles.subtitle}>Track your expenses, stay on budget</p>
        </div>
        <SignUp />
        <div className={styles.footer}>
          <p>
            
          </p>
        </div>
      </div>
    </div>
    )
}
