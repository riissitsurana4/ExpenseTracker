'use client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client'; 
import {Chart, BarElement,ArcElement, CategoryScale, LinearScale, Tooltip, Legend} from 'chart.js';
import {Bar, Pie} from 'react-chartjs-2';
Chart.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);
import '../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../components/BootstrapClient';

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
    if (showModal) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
  }, [showModal]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
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
    if (expense) {
      setTitle(expense.title || '');
      setAmount(expense.amount || '');
      setCategory(expense.category || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('');
    }
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
    <>
    <BootstrapClient />
    <div className="container-fluid ">
      <div className="row">
        <div className="card col-sm-4 mb-3 mb-sm-0 border-0">
          <h3 className="card-title text-primary">Today's Expenses</h3>
          <p className="card-body text-primary">₹{totals.daily.toFixed(2)}</p>
        </div>
        <div className="card col-sm-4 border-0">
          <h3 className="card-title text-primary">This Month's Expenses</h3>
          <p className="card-body text-primary">₹{totals.monthly.toFixed(2)}</p>
        </div>
        <div className="card col-sm-4 border-0">
          <h3 className="card-title text-primary">FY-Expenses</h3>
          <p className="card-body text-primary">₹</p>
        </div>
      </div>

      <div className="container-fluid">
        <h2 className="text-primary">Recent Expenses</h2>
        <div className="row">
          {expenses.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info text-center">No expenses yet.</div>
            </div>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="col-md-6 mb-3">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{exp.title}</h5>
                    <p className="card-text expense-info">
                      ₹{parseFloat(exp.amount).toFixed(2)}
                      <span className="badge bg-secondary ms-2">{exp.category}</span>
                    </p>
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => openModal(exp)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(exp.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="container-fluid">
        <h2 className="text-primary">Add New Expense</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>Add Expense</button>
      </div>

      <div className="container-fluid">
        <h2 className="text-primary">Expense Breakdown</h2>
        <div className="row">
          <div className="col-sm-6">
            <Bar
              data={{
                labels: dailyLabels,
                datasets: [
                  {
                    label: 'Daily Spending',
                    data: dailySpending,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
              }}
            />
          </div>
          <div className="col-sm-6">
            <Pie
              data={{
                labels: Object.keys(categoryData),
                datasets: [
                  {
                    label: 'Category Breakdown',
                    data: Object.values(categoryData),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.6)',
                      'rgba(54, 162, 235, 0.6)',
                      'rgba(255, 206, 86, 0.6)',
                      'rgba(75, 192, 192, 0.6)',
                      'rgba(153, 102, 255, 0.6)',
                      'rgba(255, 159, 64, 0.6)',
                    ],
                    borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                      'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title" id="addExpenseModalLabel">{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="form-control mb-2"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="form-control mb-2"
                  />  
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="form-select mb-2 category-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <div className="modal-actions d-flex justify-content-between">
                    <button type="submit" className="btn btn-primary">{editExpense ? 'Update' : 'Add'}</button>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      
    </>
  );
}
