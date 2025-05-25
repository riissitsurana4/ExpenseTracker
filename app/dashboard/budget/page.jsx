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
import './budget.css';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BudgetPage() {
  const [budget, setBudget] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

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

    // Alert logic
    if (budgetData) {
      const percent = monthlySpent / budgetData.amount;
      if (percent >= 1) {
        setAlert('🚨 You have exceeded your budget!');
      } else if (percent >= 0.9) {
        setAlert('⚠️ You are very close to your budget limit.');
      } else {
        setAlert('');
      }
    }
  };
  const [recurringInput, setRecurringInput] = useState('');

const handleSaveRecurring = async (e) => {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;

  const { data: existing } = await supabase
    .from('recurring_budgets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    await supabase
      .from('recurring_budgets')
      .update({ amount: parseFloat(recurringInput) })
      .eq('id', existing.id);
  } else {
    await supabase.from('recurring_budgets').insert([
      {
        user_id: user.id,
        amount: parseFloat(recurringInput),
      },
    ]);
  }

  setRecurringInput('');
  window.alert("Recurring budget saved!");
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
const ensureCurrentMonthBudget = async (user) => {
  const { data: existing } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .single();

  if (!existing) {
    const { data: defaultBudget } = await supabase
      .from('recurring_budgets')
      .select('amount')
      .eq('user_id', user.id)
      .single();

    if (defaultBudget) {
      await supabase.from('budgets').insert([
        {
          amount: defaultBudget.amount,
          month: currentMonth,
          user_id: user.id,
        },
      ]);
    }
  }
};

    setAmountInput('');
    fetchBudgetAndSpending();
    await ensureCurrentMonthBudget(user);

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
    <div className="budget-container">
      <h1>Budget Overview</h1>

      <form onSubmit={handleSave} className="budget-form">
        <input
          type="number"
          placeholder="Enter your monthly budget"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          required
        />
        <button type="submit">{budget ? 'Update Budget' : 'Set Budget'}</button>
      </form>
      <form onSubmit={handleSaveRecurring} className="recurring-form">
  <h3>Recurring Monthly Budget</h3>
  <input
    type="number"
    placeholder="Set default budget for all months"
    value={recurringInput}
    onChange={(e) => setRecurringInput(e.target.value)}
  />
  <button type="submit">Save Recurring Budget</button>
</form>


      {alert && <p className="alert-box">{alert}</p>}

      {budget && (
        <div className="budget-summary">
          <div className="budget-values">
            <div><strong>Budget:</strong> ₹{budget.amount.toFixed(2)}</div>
            <div><strong>Spent:</strong> ₹{monthlySpent.toFixed(2)}</div>
            <div className={monthlySpent > budget.amount ? 'over' : ''}>
              <strong>Remaining:</strong> ₹{(budget.amount - monthlySpent).toFixed(2)}
            </div>
          </div>

          <div className="progress-bar-wrapper">
            <div className="progress-bar-background">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${percentageUsed}%`,
                  backgroundColor:
                    percentageUsed > 90 ? '#ff4d4d' :
                    percentageUsed > 70 ? '#ffaa00' : '#008080',
                }}
              >
                {percentageUsed.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="budget-chart-box">
          <h2>Budget vs Spending by Month</h2>
          <Bar data={chartData} options={{ responsive: true }} />
        </div>
      )}
    </div>
  );
}
