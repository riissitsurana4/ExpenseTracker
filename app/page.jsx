import Link from "next/link";
import { PieChart, DollarSign, Bell, Shield, Wallet, BarChart3 } from "lucide-react";


const FeatureCard = ({ icon, title, description }) => (
  <div className="card h-100 shadow-sm border-0">
    <div className="card-body text-center">
      <div className="mb-3" style={{ fontSize: "2rem" }}> {icon}</div>
      <h3 className="h3 mb-2 text-primary">{title}</h3>
      <p className="text-secondary">{description}</p>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <main>
      <header className="bg-light border-bottom py-3 ">
        <nav className="container-fluid d-flex justify-content-between align-items-center">
          <div className="fw-bold fs-2 text-primary">Smart Expense Hub</div>
          <div className="d-flex gap-3">
            <Link href="/loginpages" className="btn btn-link text-primary me-2">Login</Link>
            <Link href="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>


      <section className="py-5 text-center hero-section">
        <div className="container">
          <h1 className="display-5 fw-bold mb-3">
            Take Control of Your <span className="text-primary">Finances</span>
          </h1>
          <p className="lead mb-4">
            Track expenses, create budgets, and gain insights into your spending habits with our tracking solution.
          </p>
          <div className="hero-button-container">
            <Link href="/signup" className="btn btn-primary btn-lg px-4">
              Start Tracking
              <DollarSign className="ms-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Everything you need to manage expenses</h2>
          <div className="row g-4 justify-content-center">
            <div className="col-12 col-sm-6 col-md-3">
              <FeatureCard
                icon={<DollarSign size={24} />}
                title="Expense Tracking"
                description="Easily record and categorize your daily expenses."
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <FeatureCard
                icon={<Bell size={24} />}
                title="Budget Alerts"
                description="Set budget limits and receive alerts when you approach them."
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <FeatureCard
                icon={<BarChart3 size={24} />}
                title="Spending Analysis"
                description="Get insights into your spending habits with reports."
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <FeatureCard
                icon={<Shield size={24} />}
                title="Secure & Private"
                description="Your data is encrypted and stored securely."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-white py-5 text-center">
        <div className="container">
          <h2 className="fw-bold mb-3">Ready to take control of your finances?</h2>
          <p className="mb-4">Join thousands of users who trust us to manage their expenses.</p>
          <Link href="/signup" className="btn btn-secondary text-white fw-bold btn-lg px-4">
            Create Free Account
            <Wallet className="ms-2" size={20} />
          </Link>
        </div>
      </section>
      <footer className="bg-light text-center py-4">
        <div className="container">
          <p className="mb-0 text-secondary">
            &copy; {new Date().getFullYear()} Smart Expense Hub.
          </p>
          <p className="mb-0 text-secondary">
            <Link href="/privacy-policy" className="text-secondary">Privacy Policy</Link> |
            <Link href="/terms-of-service" className="text-secondary"> Terms of Service</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
