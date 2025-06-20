import Link from "next/link";
import { PieChart, DollarSign, Bell, Shield, Wallet, BarChart3 } from "lucide-react";


const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
);

export default function HomePage() {
  return (
    <main>
      <header className="header">
        <nav className="nav">
            <div className="name">ExpenseTracker</div>
          <div className="nav-links">
            <Link href="/loginpages" className="nav-link">Login</Link>
            <Link href="/signup" className="button">
              Get Started
            </Link>
          </div>
        </nav>
      </header>
        {/* hero section */}

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Take Control of Your <span className="highlight">Finances</span>
          </h1>
          <p className="hero-description">
            Track expenses, create budgets, and gain insights into your spending habits with our tracking solution.
          </p>
          <div className="hero-button-container">
            <Link href="/signup" className="hero-button">
              Start Tracking
              <DollarSign className="hero-icon" size={20} />
            </Link>
          </div>
        </div>
      </div>

        {/* features section */}
        <div className="features-section">
            <h2 className="features-heading">Everything you need to manage expenses</h2>
            <div className = "features-grid">
                <FeatureCard
                    icon={<DollarSign size={24} />}
                    title="Expense Tracking"
                    description="Easily record and categorize your daily expenses." 
                />
                <FeatureCard
                    icon={<Bell size={24} />}
                    title="Budget Alerts"
                    description="Set budget limits and receive alerts when you approach them."
                />
                <FeatureCard
                    icon={<BarChart3 size={24} />}
                    title="Spending Analysis"
                    description="Get insights into your spending habits with reports."
                />
                <FeatureCard
                    icon={<Shield size={24} />}
                    title="Secure & Private"
                    description="Your data is encrypted and stored securely."
                />
            </div>
        </div>
        {/* cta-section */}
        <div className="cta-section">
            <div className="cta-content">
            <h2 className="cta-heading">Ready to take control of your finances?</h2>
            <p className="cta-text">Join thousands of users who trust us to manage their expenses.</p>
            <Link href="/signup" className="cta-button">
                Create Free Account
                <Wallet className="cta-icon" size={20} />
            </Link>
        </div>
        </div>
        {/* footer 
        <footer className="footer">
            <p className= "footer-text">
            </p>
        
        </footer>
        */}

    </main>
  );
}
