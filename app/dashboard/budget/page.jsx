'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';
import { data } from 'autoprefixer';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BudgetPage() {
  const [budget, setBudget] = useState(null);
  const [yearlyBudget, setYearlyBudget] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [yearlyAmountInput, setYearlyAmountInput] = useState('');
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthDisplay = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;
  const currentYear = new Date().getFullYear();

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

    }

    else {
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

  const chartData = {
    labels: history.map(h => h.month),
    datasets: [
      {
        label: 'Budget',
        data: history.map(h => h.budget),
        backgroundColor: '#99e6e6',
      },
      {
        label: 'Spent',
        data: history.map(h => h.spent),
        backgroundColor: '#008080',
      },
    ],
  };

  return (
    <>
      <BootstrapClient />
      <div className="container-fluid">
        <h1 className="text-primary fw-bold text-center mb-5 mt-0">Budget Overview</h1>
        <div className="row">
          <div className="card col-sm-6 mb-4 border-0 ">
            <div className="card-body">
              <h3 className="text-primary ">Monthly Budget</h3>
              <p className="text-secondary">
                {budget
                  ? `Your budget for ${currentMonthDisplay} is ₹${budget.amount.toFixed(2)}`
                  : 'You have not set a budget for this month.'}
              </p>
            </div>
          </div>
          <div className="card col-sm-6 mb-4 border-0 ">
            <div className="card-body">
              <h3 className="text-primary ">Yearly Budget</h3>
              <p className="text-secondary">
                {yearlyBudget
                  ? `Your budget for ${currentYear} is ₹${yearlyBudget ? yearlyBudget.toFixed(2) : '0.00'}`
                  : 'You have not set a budget for this year.'}
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6 mb-4">
            {!budget ? (
              <form onSubmit={handleSave} className="budget-form">
                <div className="mb-3">
                  <label className="form-label text-secondary me-3">
                    Set your monthly Budget
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your monthly budget"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="form-control w-25 d-inline-block"
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary ms-3"
                  >
                    Set Budget
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSave} className="budget-form">
                <div className="mb-3">
                  <label className="form-label text-secondary me-3">
                    Update your monthly Budget
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your monthly budget"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="form-control w-25 d-inline-block"
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary ms-3"
                  >
                    Update Budget
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="col-sm-6 mb-4">
            {!yearlyBudget ? (
              <form onSubmit={handleYearlySave} className="budget-form">
                <div className="mb-3">
                  <label className="form-label text-secondary me-3">
                    Set your Yearly Budget
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your yearly budget"
                    value={yearlyAmountInput}
                    onChange={(e) => setYearlyAmountInput(e.target.value)}
                    required
                    className="form-control w-25 d-inline-block"
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary ms-3"
                  >
                    Set Budget
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleYearlySave} className="budget-form">
                <div className="mb-3">
                  <label className="form-label text-secondary me-3">
                    Update your Yearly Budget
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your yearly budget"
                    value={yearlyAmountInput}
                    onChange={(e) => setYearlyAmountInput(e.target.value)}
                    required
                    className="form-control w-25 d-inline-block"
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-primary ms-3"
                  >
                    Update Budget
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
