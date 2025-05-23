import Link from "next/link";
import { PieChart, DollarSign, Bell, Shield, Wallet, BarChart3 } from "lucide-react";

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function HomePage() {
  return (
    <main>
      <header className="bg-teal-900 py-5">
        <nav className="w-full flex items-center justify-between max-w-[1200px] mx-auto">
          <Link href="/">
            <div className="text-white font-bold text-3xl md:text-4xl" style={{ fontFamily: 'arial' }}>
              ExpenseTracker
            </div>
          </Link>
          <div className="flex gap-8">
            <Link href="/what-we-do" className="text-white text-lg" style={{ fontFamily: 'arial', textDecoration: 'none' }}>What We do</Link>
            <Link href="/about-us" className="text-white text-lg" style={{ fontFamily: 'arial', textDecoration: 'none' }}>About Us</Link>
            <Link href="/login" className="text-white text-lg" style={{ fontFamily: 'arial', textDecoration: 'none' }}>Login</Link>
          </div>
        </nav>
      </header>
      <div className="min-h-screen bg-red-500">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Take Control of Your <span className="text-teal-600">Finances</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Track expenses, create budgets, and gain insights into your spending habits with our tracking solution.
          </p>
          <div className="mt-10">
            <Link href="/login" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center">
              Start Tracking
              <DollarSign className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
