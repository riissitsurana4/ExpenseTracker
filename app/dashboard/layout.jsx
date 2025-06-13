import '../../styles/custom-bootstrap.scss';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import BootstrapClient from '../../components/BootstrapClient';
import Profile from '../../components/profile';

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

      <header className="navbar navbar-expand-lg navbar-dark bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold fs-4 text-primary">
            Smart Expense Hub
          </span>
          <Link href="/dashboard" className="nav-link text-ternary">Overview</Link>
          <Link href="/dashboard/expenses" className="nav-link text-ternary">Expenses</Link>
          <Link href="/dashboard/budget" className="nav-link text-ternary">Budget</Link>
          <Link href="/dashboard/categories" className="nav-link text-ternary">Categories</Link>
          <div className="d-flex justify-content-end align-items-center w-70">
            <Profile />
          </div>
        </div>
      </header>


      <main style={{paddingTop: '4.5rem' }}>
        {children}
        {modal}
      </main>

    </>
  );
}
