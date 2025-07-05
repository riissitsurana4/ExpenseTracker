'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BootstrapClient from '../../../components/BootstrapClient';

const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const safeToNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return parseFloat(value) || 0;
};

export default function BudgetPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCurrency, setUserCurrency] = useState('INR');
  const [budgets, setBudgets] = useState([]);
  const [monthlyInputAmount, setMonthlyInputAmount] = useState('');
  const [yearlyInputAmount, setYearlyInputAmount] = useState('');
  const [currentMonthlyBudget, setCurrentMonthlyBudget] = useState(null);
  const [currentYearlyBudget, setCurrentYearlyBudget] = useState(null);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [input, setInput] = useState({});
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [yearlySpent, setYearlySpent] = useState(0);
  const [history, setHistory] = useState([]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthIso = formatDateToISO(new Date(currentYear, currentMonth, 1)).slice(0, 7);

  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchBudgets = useCallback(async () => {
    const response = await fetch('/api/budgets');
    if (!response.ok) throw new Error('Failed to fetch budgets');
    return response.json();
  }, []);

  const createBudget = useCallback(async (budgetData) => {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budgetData)
    });
    if (!response.ok) throw new Error('Failed to create budget');
    return response.json();
  }, []);

  const updateBudget = useCallback(async (id, budgetData) => {
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budgetData)
    });
    if (!response.ok) throw new Error('Failed to update budget');
    return response.json();
  }, []);

  const fetchUserCurrency = useCallback(async () => {
    const response = await fetch('/api/user/currency');
    if (!response.ok) throw new Error('Failed to fetch currency');
    return response.json();
  }, []);

  const fetchCategories = useCallback(async () => {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }, []);

  const fetchExpenses = useCallback(async () => {
    const response = await fetch('/api/expenses');
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
  }, []);

  const updateCategoryBudget = useCallback(async (categoryId, budget) => {
    const response = await fetch(`/api/categories/${categoryId}/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget })
    });
    if (!response.ok) throw new Error('Failed to update category budget');
    return response.json();
  }, []);

  const fetchAll = useCallback(async () => {
    if (status === "loading") return;
    
    if (!session) {
      router.push('/loginpages');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const currencyData = await fetchUserCurrency();
      setUserCurrency(currencyData.currency);

      const allBudgetsData = await fetchBudgets();
      setBudgets(allBudgetsData);

      const monthBudget = allBudgetsData.find(
        (b) => b.budget_period_type === 'monthly' && 
        formatDateToISO(new Date(b.start_date)).slice(0, 7) === currentMonthIso
      );
      setCurrentMonthlyBudget(monthBudget);
      setMonthlyInputAmount(monthBudget ? safeToNumber(monthBudget.amount).toString() : '');

      const yearBudget = allBudgetsData.find(
        (b) => b.budget_period_type === 'yearly' && 
        new Date(b.start_date).getFullYear() === currentYear
      );
      setCurrentYearlyBudget(yearBudget);
      setYearlyInputAmount(yearBudget ? safeToNumber(yearBudget.amount).toString() : '');

      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
      
      const newCategoryBudgets = categoriesData.reduce((acc, cat) => ({ 
        ...acc, 
        [cat.id]: safeToNumber(cat.budget) 
      }), {});
      setCategoryBudgets(newCategoryBudgets);

      const expensesData = await fetchExpenses();
      setExpenses(expensesData);

      const currentMonthSpent = expensesData
        .filter(e => e.created_at && e.created_at.slice(0, 7) === currentMonthIso)
        .reduce((sum, e) => sum + safeToNumber(e.amount), 0);
      setMonthlySpent(currentMonthSpent);

      const currentYearSpent = expensesData
        .filter(e => e.created_at && e.created_at.slice(0, 4) === String(currentYear))
        .reduce((sum, e) => sum + safeToNumber(e.amount), 0);
      setYearlySpent(currentYearSpent);

      const monthlyHistoryData = allBudgetsData
        .filter(b => b.budget_period_type === 'monthly')
        .map((b) => {
          const budgetMonthIso = formatDateToISO(new Date(b.start_date)).slice(0, 7);
          const spent = expensesData
            .filter(e => e.created_at && e.created_at.slice(0, 7) === budgetMonthIso)
            .reduce((sum, e) => sum + safeToNumber(e.amount), 0);
          return {
            month: budgetMonthIso,
            budget: safeToNumber(b.amount),
            spent,
          };
        })
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      setHistory(monthlyHistoryData);

    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [session, status, currentMonthIso, currentYear, router, fetchUserCurrency, fetchBudgets, fetchCategories, fetchExpenses]);

  const handleSaveBudget = async (e, periodType) => {
    e.preventDefault();
    setError('');
    
    if (!session) {
      setError('User not authenticated for saving budget. Please log in.');
      return;
    }

    let amountToSave;
    let existingBudget;
    let startDate;
    let endDate;

    if (periodType === 'monthly') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      amountToSave = parseFloat(monthlyInputAmount);
      existingBudget = currentMonthlyBudget;
      startDate = formatDateToISO(startOfMonth);
      endDate = formatDateToISO(endOfMonth);
    } else if (periodType === 'yearly') {
      const year = new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      amountToSave = parseFloat(yearlyInputAmount);
      existingBudget = currentYearlyBudget;
      startDate = formatDateToISO(startOfYear);
      endDate = formatDateToISO(endOfYear);
    } else {
      setError('Invalid budget period type.');
      return;
    }

    if (isNaN(amountToSave) || amountToSave < 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const budgetData = {
      amount: amountToSave,
      start_date: startDate,
      end_date: endDate,
      budget_period_type: periodType,
    };

    try {
      if (existingBudget) {
        await updateBudget(existingBudget.id, budgetData);
      } else {
        await createBudget(budgetData);
      }
      fetchAll();
    } catch (err) {
      setError(`Failed to save budget: ${err.message}`);
    }
  };

  const totalCategoryBudget = Object.values(categoryBudgets).reduce((a, b) => a + Number(b), 0);
  const monthlyBudgetAmount = currentMonthlyBudget ? safeToNumber(currentMonthlyBudget.amount) : 0;
  const yearlyBudgetAmount = currentYearlyBudget ? safeToNumber(currentYearlyBudget.amount) : 0;

  const handleBudgetChange = async (categoryId, value) => {
    const newValue = Math.max(0, parseFloat(value) || 0);
    const newTotal = totalCategoryBudget - (categoryBudgets[categoryId] || 0) + newValue;
    
    if (newTotal > monthlyBudgetAmount) {
      setError('Total category budgets cannot exceed the overall monthly budget.');
      return;
    }
    
    setCategoryBudgets(prev => ({ ...prev, [categoryId]: newValue }));
    setError('');
    
    try {
      await updateCategoryBudget(categoryId, newValue);
      fetchAll();
    } catch (err) {
      setError(`Failed to update category budget: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currencySign = (cur) => {
    switch (cur) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'INR': return '₹';
      case 'GBP': return '£';
      default: return '';
    }
  };

  const percentageUsedMonthly = monthlyBudgetAmount
    ? Math.min((monthlySpent / monthlyBudgetAmount) * 100, 100)
    : 0;
  const percentageUsedYearly = yearlyBudgetAmount
    ? Math.min((yearlySpent / yearlyBudgetAmount) * 100, 100)
    : 0;

  if (loading) {
    return (
      <>
        <BootstrapClient />
        <div className="container-fluid text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading budget data...</p>
        </div>
      </>
    );
  }

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
                <h6 className="text-muted">This Month's Budget <span className="badge bg-light text-dark ms-1">{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}</span></h6>
                <h2 className="fw-bold text-primary">{currencySign(userCurrency)}{monthlyBudgetAmount.toFixed(2)}</h2>
                <span className={`badge ${monthlySpent > monthlyBudgetAmount ? 'bg-danger' : 'bg-success'}`}>
                  {monthlySpent > monthlyBudgetAmount ? 'Over Budget' : 'On Track'}
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
                  <div className={`progress-bar ${percentageUsedMonthly >= 90 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${percentageUsedMonthly}%`}} />
                </div>
                <small>{percentageUsedMonthly.toFixed(2)}% used</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-2">
            <div className="card shadow-sm border-0 h-100 bg-white border-primary">
              <div className="card-body text-center">
                <h6 className="text-muted">Yearly Budget</h6>
                <h2 className="fw-bold text-primary">{currencySign(userCurrency)}{yearlyBudgetAmount.toFixed(2)}</h2>
                <span className={`badge px-3 py-2 fs-6 ${yearlySpent > yearlyBudgetAmount ? 'bg-danger' : 'bg-success'}`}
                  style={{ fontWeight: 500 }}>
                  {yearlySpent > yearlyBudgetAmount ? 'Over Budget' : 'On Track'}
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
                    className={`progress-bar ${yearlyBudgetAmount && yearlySpent > yearlyBudgetAmount ? 'bg-danger' : yearlyBudgetAmount && yearlySpent > 0.9 * yearlyBudgetAmount ? 'bg-warning' : 'bg-success'}`}
                    role="progressbar"
                    style={{ width: yearlyBudgetAmount ? `${percentageUsedYearly}%` : '0%' }}
                    aria-valuenow={percentageUsedYearly}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                  </div>
                </div>
                <small className="text-secondary">{yearlyBudgetAmount ? `${percentageUsedYearly.toFixed(1)}% of yearly budget used` : '0% used'}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-sm-6 mb-4">
            <form onSubmit={(e) => handleSaveBudget(e, 'monthly')} className="row g-2 align-items-center mb-4">
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
                    value={monthlyInputAmount}
                    onChange={e => setMonthlyInputAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary">{currentMonthlyBudget ? 'Update' : 'Set'} Budget</button>
              </div>
            </form>
          </div>
          <div className="col-sm-6 mb-4">
            <form onSubmit={(e) => handleSaveBudget(e, 'yearly')} className="row g-2 align-items-center mb-4">
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
                    value={yearlyInputAmount}
                    onChange={e => setYearlyInputAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-primary">{currentYearlyBudget ? 'Update' : 'Set'} Budget</button>
              </div>
            </form>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12-mb-4">
            <h3 className="text-primary mb-4">Monthly Spending</h3>
            <p className="text-secondary mb-4">
              You have spent {currencySign(userCurrency)}{monthlySpent.toFixed(2)} this month, which is {percentageUsedMonthly.toFixed(2)}% of your budget.
            </p>
            <div className="progress mb-3" style={{ height: '20px' }}>
              <div
                className={`progress-bar ${percentageUsedMonthly >= 90 ? 'bg-danger' : 'bg-success'}`}
                role="progressbar"
                style={{ width: `${percentageUsedMonthly}%` }}
                aria-valuenow={percentageUsedMonthly}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {percentageUsedMonthly.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-primary mb-4">Category Budgets</h2>
          {categories.length === 0 && (
            <div className="alert alert-info">No categories found.</div>
          )}
          <div className="row">
            {categories.map(category => {
              const spent = (expenses && Array.isArray(expenses))
                ? expenses.filter(e => e && e.category_id !== undefined && category.id !== undefined && String(e.category_id) === String(category.id) && e.created_at && e.amount !== undefined && e.created_at.slice(0, 7) === currentMonthIso)
                    .reduce((sum, e) => sum + safeToNumber(e.amount), 0)
                : 0;
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
                          / {currencySign(userCurrency)}{budget.toFixed(2)}
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
                              value={input[category.id] ?? (categoryBudgets[category.id] !== undefined ? categoryBudgets[category.id] : '')}
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
                            <span className="me-2">{currencySign(userCurrency)}{budget.toFixed(2)}</span>
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
              {totalCategoryBudget.toFixed(2)} / {currencySign(userCurrency)}
              {monthlyBudgetAmount.toFixed(2)}
            </strong>
            <div className="progress mt-2">
              <div
                className={`progress-bar ${totalCategoryBudget > monthlyBudgetAmount ? 'bg-danger' : 'bg-success'}`}
                style={{ width: `${(totalCategoryBudget / (monthlyBudgetAmount || 1)) * 100}%` }}
                role="progressbar"
                aria-valuenow={totalCategoryBudget}
                aria-valuemin="0"
                aria-valuemax={monthlyBudgetAmount}
              />
            </div>
          </div>
        </div>
        <h2 className="text-primary mt-5 mb-4">Monthly Budget History</h2>
        {history.length === 0 ? (
          <div className="alert alert-info">No monthly budget history available.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>% Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const budget = safeToNumber(item.budget);
                  const spent = safeToNumber(item.spent);
                  const remaining = budget - spent;
                  const percentUsed = budget ? (spent / budget) * 100 : 0;
                  const status = remaining < 0 ? 'Over Budget' : 'On Track';
                  return (
                    <tr key={item.month}>
                      <td>{new Date(`${item.month}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                      <td>{currencySign(userCurrency)}{budget.toFixed(2)}</td>
                      <td>{currencySign(userCurrency)}{spent.toFixed(2)}</td>
                      <td>{currencySign(userCurrency)}{remaining.toFixed(2)}</td>
                      <td>{percentUsed.toFixed(2)}%</td>
                      <td className={remaining < 0 ? 'text-danger' : 'text-success'}>
                        {status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}