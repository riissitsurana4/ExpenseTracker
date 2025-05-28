import '../../styles/custom-bootstrap.scss';
import Link from 'next/link';
import {createClient} from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import BootstrapClient from '../../components/BootstrapClient';

export default async function DashboardLayout({ children, modal }) {
  const supabase = await createClient();
  const {
    data,
    error
  } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/loginpages');
  }

  return (
 <>
      <BootstrapClient />
    <div className = "sidebar-layout d-flex">
      <aside className="sidebar bg-white">
        <h2 className="mb-4 fw-bold text-primary">ExpenseTracker</h2>
        <nav className="nav flex-column">
          <Link href="/dashboard" className = "nav-link text-ternary">Overview</Link>
          <Link href="/dashboard/budget"className = "nav-link text-ternary">Budget</Link>
          <Link href="/dashboard/categories" className = "nav-link text-ternary">Categories</Link>
          <Link href="/dashboard/analysis" className = "nav-link text-ternary" >Spending Analysis</Link>
          <Link href="/dashboard/settings" className = "nav-link text-ternary" >Settings</Link>
        </nav>
      </aside>
      <main style={{ marginLeft: '0%', padding: '2rem', flex: 1 }}>
        {children}
        {modal}
      </main>
    </div>
    </>
  );
}
