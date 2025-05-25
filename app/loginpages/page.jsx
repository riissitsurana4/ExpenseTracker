import styles from './Login.module.css';
import LoginForm from './Loginform.jsx'; 

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>ExpenseTracker</h1>
          <p className={styles.subtitle}>Track your expenses, stay on budget</p>
        </div>
        <LoginForm />
        <div className={styles.footer}>
          <p>
            
          </p>
        </div>
      </div>
    </div>
  );
}
