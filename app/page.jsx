import Link from "next/link"

export default function Header() {
  return (
    <header style={{ background: '#06352a', padding: '20px 0' }}>
      <nav style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
       <Link href = "/">
        <div style={{ color: '#fff', fontFamily: 'arial', fontSize: 32, fontWeight: 'bold' }}>
        ExpenseTracker
        </div>
         </Link>
        <div style={{ display: 'flex', gap: 32 }}>
          <Link href="#" style={{ color: '#fff', fontFamily: 'arial', fontSize: 20, textDecoration: 'none' }}>What We do</Link>
          <Link href="#" style={{ color: '#fff', fontFamily: 'arial', fontSize: 20, textDecoration: 'none' }}>About Us</Link>
          <Link href="/login" style={{ color: '#fff', fontFamily: 'arial', fontSize: 20, textDecoration: 'none' }}>Login/SignUp</Link>
        </div>
      </nav>
    </header>
  );
}
