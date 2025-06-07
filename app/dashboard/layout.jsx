import '../../styles/custom-bootstrap.scss';
import Link from 'next/link';
import {createClient} from '../../utils/supabase/server';
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
      <div className="sidebar-layout d-flex">
        <aside className="collapse collapse-horizontal bg-white" id="sidebar" style={{ width: '20%'}}>
          <h2 className="mb-5 fw-bold text-primary ">ExpenseTracker</h2>
          <nav className="nav flex-column">
            <Link href="/dashboard" className="nav-link text-ternary">Overview</Link>
            <Link href="/dashboard/expenses" className="nav-link text-ternary">Expenses</Link>
            <Link href="/dashboard/budget" className="nav-link text-ternary">Budget</Link>
            <Link href="/dashboard/categories" className="nav-link text-ternary">Categories</Link>
            <Link href="/dashboard/settings" className="nav-link text-ternary">Settings</Link>
          </nav>
        </aside>

        <div style={{ flex: 1 }}>
          <header className="bg-white w-100">
            <nav className="navbar bg-white px-3">
              <button
                className="btn "
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebar"
                aria-controls="sidebar"
                aria-expanded="false"
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                </svg>
              </button>

              <div className="d-flex justify-content-end align-items-center w-70">
                <Profile />
              </div>
            </nav>
          </header>
          <main style={{ marginLeft: '0%', padding: '2rem' }}>
            {children}
            {modal}
          </main>
        </div>
      </div>
    </>
  );
}
