'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import './dashboard.css';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setExpenses(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from('expenses').insert([
      {
        title,
        amount: parseFloat(amount),
        category,
        user_id: user.id,
      },
    ]);
    setTitle('');
    setAmount('');
    setCategory('');
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const totals = expenses.reduce(
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

  return (
    <>
      {/* Summary Section */}
      <div className="summary">
        <p><strong>Today’s Total:</strong> ${totals.daily.toFixed(2)}</p>
        <p><strong>This Month’s Total:</strong> ${totals.monthly.toFixed(2)}</p>
      </div>

      {/* Add Expense Form */}
      <form className="expense-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Expense title (e.g., Groceries)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount (e.g., 50.00)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Category (e.g., Food, Rent)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button type="submit">Add Expense</button>
      </form>

      {/* Expenses List */}
      <div className="expense-list">
        <h2>Recent Expenses</h2>
        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          expenses.map((exp) => (
            <div key={exp.id} className="expense-item">
              <span>
                {exp.title} — ${parseFloat(exp.amount).toFixed(2)} ({exp.category})
              </span>
              <button onClick={() => handleDelete(exp.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </>
  );
}