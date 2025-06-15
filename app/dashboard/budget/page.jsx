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
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthDisplay = `${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`;
  const currentYear = new Date().getFullYear();
  const [userCurrency, setUserCurrency] = useState('INR');
  const [categories, setCategories] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [input, setInput] = useState({});
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('User not found.');
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data: userData } = await supabase
        .from('users')
        .select('currency')
        .eq('id', user.id)
        .single();
      setUserCurrency(userData?.currency || 'INR');
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .single();
      setBudget(budgetData);
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
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, budget')
        .eq('user_id', user.id);
      setCategories(categoriesData || []);
      setCategoryBudgets(
        (categoriesData || []).reduce((acc, cat) => ({ ...acc, [cat.id]: cat.budget || 0 }), {})
      );
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, created_at, category_id')
        .eq('user_id', user.id);
      setExpenses(expensesData || []);
      const monthlySpent = (expensesData || [])
        .filter(e => e.created_at.slice(0, 7) === currentMonth)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      setMonthlySpent(monthlySpent);
      const currentYearStr = String(currentYear);
      const yearlySpent = (expensesData || [])
        .filter(e => e.created_at.slice(0, 4) === currentYearStr)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      setYearlySpent(yearlySpent);
      const { data: allBudgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: true });
      const monthlyHistory = (allBudgets || []).map((b) => {
        const spent = (expensesData || [])
          .filter(e => e.created_at.slice(0, 7) === b.month)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return {
          month: b.month,
          budget: b.amount,
          spent,
        };
      });
      setHistory(monthlyHistory);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const totalCategoryBudget = Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0);
  const monthlyBudget = budget ? Number(budget.amount) : 0;

  const handleBudgetChange = (categoryId, value) => {
    const newValue = Math.max(0, parseFloat(value) || 0);
    const newTotal = totalCategoryBudget - (categoryBudgets[categoryId] || 0) + newValue;
    if (newTotal > monthlyBudget) {
      setError('Total category budgets cannot exceed monthly budget.');
      return;
    }
    setCategoryBudgets(prev => ({ ...prev, [categoryId]: newValue }));
    setError('');
  };

  const currencySign = (cur) => {
    switch (cur) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'INR': return '₹';
      default: return '';
    }
  };

  const handleYearlySave = async (e) => {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
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
    setLoading(true);
    setTimeout(() => window.location.reload(), 500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
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
    setLoading(true);
    setTimeout(() => window.location.reload(), 500);
  };

  const percentageUsed = budget
    ? Math.min((monthlySpent / budget.amount) * 100, 100)
    : 0;

  return (
    <>
      <BootstrapClient />
      <div className="container-fluid">
        <h1 className="text-primary fw-bold text-center mb-5 mt-0">Budget Overview</h1>
        {error && <div className="alert alert-danger">{error}</div>}
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
                  <div className={`progress-bar ${percentageUsed >= 90 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${percentageUsed}%`}} />
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
        <div>
          <h2 className ="text-primary mb-4">Category Budgets</h2>
          {categories.length === 0 && (
            <div className="alert alert-info">No categories found.</div>
          )}
          <div className="row">
            {categories.map(category => {
              const spent = expenses
                .filter(e => e.category_id === category.id)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
              const budget = categoryBudgets[category.id] || 0;
              const percent = budget ? Math.min((spent / budget) * 100, 100) : 0;
              return (
                <div className="col-md-4 mb-3" key={category.id}>
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body">
                      <h5 className="card-title">{category.name}</h5>
                      <div>
                        <span className="fw-bold text-success">
                          Spent: {currencySign(userCurrency)}{spent.toFixed(2)}
                        </span>
                        <span className="ms-2 text-secondary">
                          / {currencySign(userCurrency)}{budget}
                        </span>
                      </div>
                      <div className="progress mt-2" style={{ height: '8px' }}>
                        <div
                          className={`progress-bar ${spent > budget ? 'bg-danger' : 'bg-success'}`}
                          style={{ width: `${percent}%` }}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <small className="text-secondary">{percent.toFixed(1)}% of budget used</small>
                      <div className="mb-2 mt-3">
                        <small className="text-muted">Budget:</small>
                        {editingId === category.id ? (
                          <div className="input-group mt-1">
                            <input
                              type="number"
                              min={0}
                              className="form-control"
                              value={input[category.id] ?? categoryBudgets[category.id] ?? ''}
                              onChange={e => setInput({ ...input, [category.id]: e.target.value })}
                              autoFocus
                            />
                            <button
                              className="btn btn-success"
                              onClick={() => {
                                handleBudgetChange(category.id, input[category.id]);
                                setEditingId(null);
                              }}
                              disabled={
                                !input[category.id] ||
                                isNaN(input[category.id]) ||
                                parseFloat(input[category.id]) < 0
                              }
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center mt-1">
                            <span className="me-2">{currencySign(userCurrency)}{categoryBudgets[category.id] || 0}</span>
                            <button
                              className="btn btn-outline-primary btn-sm ms-auto"
                              onClick={() => {
                                setEditingId(category.id);
                                setInput({ ...input, [category.id]: categoryBudgets[category.id] || 0 });
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <strong>
              Total Allocated: {currencySign(userCurrency)}
              {Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0)} / {currencySign(userCurrency)}
              {monthlyBudget}
            </strong>
            <div className="progress mt-2">
              <div
                className={`progress-bar ${Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0) > monthlyBudget ? 'bg-danger' : 'bg-success'}`}
                style={{ width: `${(Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0) / (monthlyBudget || 1)) * 100}%` }}
                role="progressbar"
                aria-valuenow={Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0)}
                aria-valuemin="0"
                aria-valuemax={monthlyBudget}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
