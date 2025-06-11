'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function BudgetPage() {
  const [budget, setBudget] = useState(null);
  const [yearlyBudget, setYearlyBudget] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [yearlyAmountInput, setYearlyAmountInput] = useState('');
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [yearlySpent, setYearlySpent] = useState(0);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthDisplay = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;
  const currentYear = new Date().getFullYear();
  const [userCurrency, setUserCurrency] = useState('INR');

  useEffect(() => {
    const fetchCurrency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('currency')
          .eq('id', user.id)
          .single();
        setUserCurrency(data?.currency || 'INR');
      }
    };
    fetchCurrency();
  }, []);
  const currencySign = (cur) => {
    switch (cur) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'INR': return '₹';
      default: return '';
    }
  };
  useEffect(() => {
    fetchBudgetAndSpending();
  }, []);

  const fetchBudgetAndSpending = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single();

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, created_at')
      .eq('user_id', user.id);

    const monthlySpent = expenses
      .filter(e => e.created_at.slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    setMonthlySpent(monthlySpent);
    setBudget(budgetData);

    const currentYearStr = String(currentYear);
    const yearlySpent = expenses
      .filter(e => e.created_at.slice(0, 4) === currentYearStr)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    setYearlySpent(yearlySpent);

    const { data: allBudgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true });

    const { data: yearlyBudgetData } = await supabase
      .from('yearly_budgets')
      .select('amount')
      .eq('year', currentYear)
      .eq('user_id', user.id)
      .single();

    if (yearlyBudgetData && yearlyBudgetData.amount !== undefined && yearlyBudgetData.amount !== null) {
      setYearlyBudget(yearlyBudgetData.amount);
      setYearlyAmountInput(yearlyBudgetData.amount.toString());
    } else {
      setYearlyBudget(0);
      setYearlyAmountInput('');
    }

    const monthlyHistory = allBudgets.map((b) => {
      const spent = expenses
        .filter(e => e.created_at.slice(0, 7) === b.month)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      return {
        month: b.month,
        budget: b.amount,
        spent,
      };
    });

    setHistory(monthlyHistory);
  };

  const handleYearlySave = async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: existing } = await supabase
      .from('yearly_budgets')
      .select('*')
      .eq('year', currentYear)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('yearly_budgets')
        .update({ amount: parseFloat(yearlyAmountInput) })
        .eq('id', existing.id);
    } else {
      await supabase.from('yearly_budgets').insert([
        {
          amount: parseFloat(yearlyAmountInput),
          year: currentYear,
          user_id: user.id,
        },
      ]);
    }

    setYearlyAmountInput('');
    fetchBudgetAndSpending();
  };



  const handleSave = async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    if (budget) {
      await supabase
        .from('budgets')
        .update({ amount: parseFloat(amountInput) })
        .eq('id', budget.id);
    } else {
      await supabase.from('budgets').insert([
        {
          amount: parseFloat(amountInput),
          month: currentMonth,
          user_id: user.id,
        },
      ]);
    }

    setAmountInput('');
    fetchBudgetAndSpending();
  };

  const percentageUsed = budget
    ? Math.min((monthlySpent / budget.amount) * 100, 100)
    : 0;

  return (
    <>
      <BootstrapClient />
      <div className="container-fluid">
        <h1 className="text-primary fw-bold text-center mb-5 mt-0">Budget Overview</h1>
        <div className="row mb-4">
          <div className="col-md-3 mb-2">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">This Month's Budget <span className="badge bg-light text-dark ms-1">{new Date(currentMonth + '-01').toLocaleString('default', { month: 'long' })}</span></h6>
                <h2 className="fw-bold text-primary">{currencySign(userCurrency)}{budget ? budget.amount.toFixed(2) : '0.00'}</h2>
                <span className={`badge ${monthlySpent > (budget?.amount || 0) ? 'bg-danger' : 'bg-success'}`}>
                  {monthlySpent > (budget?.amount || 0) ? 'Over Budget' : 'On Track'}
                </span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-2">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">This Month's Spent</h6>
                <h2 className="fw-bold text-info">{currencySign(userCurrency)}{monthlySpent.toFixed(2)}</h2>
                <div className="progress" style={{ height: '8px' }}>
                  <div className={`progress-bar ${percentageUsed >= 90 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${percentageUsed}%` }} />
                </div>
                <small>{percentageUsed.toFixed(2)}% used</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-2">
            <div className="card shadow-sm border-0 h-100 bg-white border-primary">
              <div className="card-body text-center">
                <h6 className="text-muted">Yearly Budget</h6>
                <h2 className="fw-bold text-primary">{currencySign(userCurrency)}{yearlyBudget ? yearlyBudget.toFixed(2) : '0.00'}</h2>
                <span className={`badge px-3 py-2 fs-6 ${yearlyBudget && yearlySpent > yearlyBudget ? 'bg-danger' : 'bg-success'}`}
                  style={{ fontWeight: 500 }}>
                  {yearlyBudget && yearlySpent > yearlyBudget ? 'Over Budget' : 'On Track'}
                </span>
                <div className="mt-2">
                  <small className="text-secondary">{currentYear}</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-2">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">Yearly Spent</h6>
                <h2 className="fw-bold text-info">{currencySign(userCurrency)}{yearlySpent.toFixed(2)}</h2>
                <div className="progress mx-auto mt-2" style={{ height: '8px', width: '80%' }}>
                  <div
                    className={`progress-bar ${yearlyBudget && yearlySpent > yearlyBudget ? 'bg-danger' : yearlyBudget && yearlySpent > 0.9 * yearlyBudget ? 'bg-warning' : 'bg-success'}`}
                    role="progressbar"
                    style={{ width: yearlyBudget ? `${Math.min((yearlySpent / yearlyBudget) * 100, 100)}%` : '0%' }}
                    aria-valuenow={yearlyBudget ? (yearlySpent / yearlyBudget) * 100 : 0}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                  </div>
                </div>
                <small className="text-secondary">{yearlyBudget ? `${Math.min((yearlySpent / yearlyBudget) * 100, 100).toFixed(1)}% of yearly budget used` : '0% used'}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-sm-6 mb-4">
            <form onSubmit={handleSave} className="row g-2 align-items-center mb-4">
              <div className="col-auto">
                <label className="form-label mb-0">Monthly Budget</label>
              </div>
              <div className="col-auto">
                <div className="input-group">
                  <span className="input-group-text">{currencySign(userCurrency)}</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary">{budget ? 'Update' : 'Set'} Budget</button>
              </div>
            </form>
          </div>
          <div className="col-sm-6 mb-4">
            <form onSubmit={handleYearlySave} className="row g-2 align-items-center mb-4">
              <div className="col-auto">
                <label className="form-label mb-0">Yearly Budget</label>
              </div>
              <div className="col-auto">
                <div className="input-group">
                  <span className="input-group-text">{currencySign(userCurrency)}</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={yearlyAmountInput}
                    onChange={e => setYearlyAmountInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary">{yearlyBudget ? 'Update' : 'Set'} Budget</button>
              </div>
            </form>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12-mb-4">
            <h3 className="text-primary mb-4">Monthly Spending</h3>
            <p className="text-secondary mb-4">
              You have spent {currencySign(userCurrency)}{monthlySpent.toFixed(2)} this month, which is {percentageUsed.toFixed(2)}% of your budget.
            </p>
            <div className="progress mb-3" style={{ height: '20px' }}>
              <div
                className={`progress-bar ${percentageUsed >= 90 ? 'bg-danger' : 'bg-success'}`}
                role="progressbar"
                style={{ width: `${percentageUsed}%` }}
                aria-valuenow={percentageUsed}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {percentageUsed.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
