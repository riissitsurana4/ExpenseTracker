import './dashboard.css';
import Link from 'next/link';
import {createClient} from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '../../components/loginbutton.jsx';

export default async function DashboardLayout({ children, modal }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>ExpenseTracker</h2>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/add">Add Expense</Link>
          <Link href="/dashboard/remove">Remove Expense</Link>
          <Link href="/dashboard/budget">Budget</Link>
          <Link href="/dashboard/analysis">Spending Analysis</Link>
          <Link href="/dashboard/settings">Settings</Link>
        </nav>
        <LogoutButton />
      </aside>
      <main style={{ marginLeft: '220px', padding: '2rem', flex: 1 }}>
        {children}
        {modal}
      </main>
    </div>
  );
}
