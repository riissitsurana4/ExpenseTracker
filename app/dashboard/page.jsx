'use client';
import { useEffect, useState } from 'react';
import './dashboard.css';
import { supabase } from '../../utils/supabase/client'; 
import {Chart, BarElement,ArcElement, CategoryScale, LinearScale, Tooltip, Legend} from 'chart.js';
import {Bar, Pie} from 'react-chartjs-2';
Chart.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);


export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [totals, setTotals] = useState({ daily: 0, monthly: 0 });
  const [categoryData, setCategoryData] = useState({});
  const [dailyLabels, setDailyLabels] = useState([]);
  const [dailySpending, setDailySpending] = useState([]);
  const [categories, setCategories] = useState([]);


  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      // handle user not found
      return;
    }
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!expensesError) {
      setExpenses(expensesData);
      calculateTotals(expensesData);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;
    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });
    setCategories(categoryData || []);
  };

  const calculateTotals = (expensesData) => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const result = expensesData.reduce(
      (acc, curr) => {
        const date = curr.created_at.slice(0, 10);
        const month = curr.created_at.slice(0, 7);
        const amt = parseFloat(curr.amount);
        if (date === today) acc.daily += amt;
        if (month === thisMonth) acc.monthly += amt;
        return acc;
      },
      { daily: 0, monthly: 0 }
    );
    setTotals(result);

    // Category breakdown
    const categories = {};
    expensesData.forEach(exp => {
      const cat = exp.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + parseFloat(exp.amount);
    });
    setCategoryData(categories);

    // Last 7 days breakdown
    const last7 = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().slice(0, 10);
    }).reverse();
    const daily = last7.map(d =>
      expensesData.filter(exp => exp.created_at.startsWith(d))
        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
    );
    setDailyLabels(last7);
    setDailySpending(daily);
  };

  const openModal = (expense = null) => {
    setEditExpense(expense);
    setTitle(expense?.title || '');
    setAmount(expense?.amount || '');
    setCategory(expense?.category || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setAmount('');
    setCategory('');
    setEditExpense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(parseFloat(amount))) {
      alert('Please enter a valid title and amount.');
      return;
    }
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      alert('User not found. Please log in again.');
      return;
    }
    let result;
    if (editExpense) {
      result = await supabase
        .from('expenses')
        .update({ title, amount: parseFloat(amount), category })
        .eq('id', editExpense.id);
    } else {
      result = await supabase.from('expenses').insert([
        {
          title,
          amount: parseFloat(amount),
          category,
          user_id: user.id,
        },
      ]);
    }
    if (result.error) {
      console.error('Supabase error:', result.error);
      alert('Error saving expense: ' + result.error.message);
      return;
    }
    closeModal();
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="card">
          <h3>Today</h3>
          <p>₹{totals.daily.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3>This Month</h3>
          <p>₹{totals.monthly.toFixed(2)}</p>
        </div>
        <button onClick={() => openModal()} className="add-button">+ Add Expense</button>
      </div>

      <div className="expenses-section">
        <h2>Recent Expenses</h2>
        {expenses.length === 0 ? (
          <p className="empty-msg">No expenses yet.</p>
        ) : (
          <div className="expense-list">
            {expenses.map((exp) => (
              <div key={exp.id} className="expense-card">
                <div>
                  <strong>{exp.title}</strong>
                  <p className="expense-info">₹{parseFloat(exp.amount).toFixed(2)} • {exp.category}</p>
                </div>
                <div className="expense-actions">
                  <button className="edit" onClick={() => openModal(exp)}>Edit</button>
                  <button className="delete" onClick={() => handleDelete(exp.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="chart-section">
        <div className="chart-box">
          <h3>Spending Over Last 7 Days</h3>
          <Bar
            data={{
              labels: dailyLabels,
              datasets: [
                {
                  label: '₹',
                  data: dailySpending,
                  backgroundColor: '#4db8b8',
                  borderRadius: 5,
                },
              ],
            }}
            options={{ responsive: true }}
          />
        </div>
        <div className="chart-box small-chart">
          <h3>Spending by Category</h3>
          <Pie
            data={{
              labels: Object.keys(categoryData),
              datasets: [
                {
                  data: Object.values(categoryData),
                  backgroundColor: [
                    '#008080',
                    '#4db8b8',
                    '#66cccc',
                    '#99e6e6',
                    '#b2f0f0',
                    '#007070',
                  ],
                },
              ],
            }}
          />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className = "category-select"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <div className="modal-actions">
                <button type="submit">{editExpense ? 'Update' : 'Add'}</button>
                <button type="button" onClick={closeModal} className="cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
