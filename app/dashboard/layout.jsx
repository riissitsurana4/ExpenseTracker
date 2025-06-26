import Link from 'next/link';
import { redirect } from 'next/navigation';
import BootstrapClient from '../../components/BootstrapClient';
import Profile from '../../components/profile';
import DashboardNavbarClient from '../../components/navbar.jsx';
import { getServerSession } from "next-auth";
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function DashboardLayout({ children, modal }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/loginpages');
  }

  return (
    <>
      <BootstrapClient />

      <header className="navbar navbar-expand-lg navbar-dark bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <Link href="/dashboard" className="navbar-brand d-flex align-items-center">
          <span className="navbar-brand fw-bold fs-4 text-primary">
            Smart Expense Hub
          </span>
          </Link>
          <button className="navbar-toggler d-lg-none d-block" type="button" data-bs-toggle="collapse" data-bs-target="#dashboardNavbar" aria-controls="dashboardNavbar" aria-expanded="false" aria-label="Toggle navigation" style={{ border: 'none', background: 'transparent' }}>
            <span className="navbar-toggler-icon" style={{ filter: 'invert(1) grayscale(1)' }}></span>
          </button>
          <div className="collapse navbar-collapse" id="dashboardNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link href="/dashboard" className="nav-link text-ternary">Overview</Link>
              </li>
              <li className="nav-item">
                <Link href="/dashboard/expenses" className="nav-link text-ternary">Expenses</Link>
              </li>
              <li className="nav-item">
                <Link href="/dashboard/budget" className="nav-link text-ternary">Budget</Link>
              </li>
              <li className="nav-item">
                <Link href="/dashboard/categories" className="nav-link text-ternary">Categories</Link>
              </li>
              <li className="nav-item">
                <Link href="/dashboard/analytics" className="nav-link text-ternary">Analytics</Link>
              </li>
            </ul>
            <div className="d-flex justify-content-end align-items-center w-70">
              <Profile />
            </div>
          </div>
        </div>
      </header>
      <DashboardNavbarClient />
      <main style={{paddingTop: '4.5rem' }}>
        {children}
        {modal}
      </main>

    </>
  );
}
