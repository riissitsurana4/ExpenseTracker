'use client'
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../utils/supabase/client';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [date, setDate] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [loading, setLoading] = useState(true);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editExpense, setEditExpense] = useState(null);
    const [modalFields, setModalFields] = useState({
        title: '',
        amount: '',
        category: '',
        subcategory: '',
        description: '',
        created_at: '',
    });
    const openModal = (expense = null) => {
        if (expense) {
            setEditExpense(expense);
            setModalFields({
                title: expense.title || '',
                amount: expense.amount || '',
                category: expense.category || '',
                subcategory: expense.subcategory || '',
                description: expense.description || '',
                created_at: expense.created_at ? expense.created_at.slice(0, 10) : ''
            });
        } else {
            setEditExpense(null);
            setModalFields({
                title: '',
                amount: '',
                category: '',
                subcategory: '',
                description: '',
                created_at: new Date().toISOString().slice(0, 10)
            });
        }
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setEditExpense(null);
        setModalFields({
            title: '',
            amount: '',
            category: '',
            subcategory: '',
            description: '',
            created_at: ''
        });
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const { title, amount, category, subcategory, description, created_at } = modalFields;
        if (!title.trim() || !amount || isNaN(parseFloat(amount))) {
            alert('Please enter a valid title and amount.');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('User not found. Please log in again.');
            return;
        }
        let result;
        if (editExpense) {
            result = await supabase
                .from('expenses')
                .update({ title, amount: parseFloat(amount), category, subcategory, description, created_at })
                .eq('id', editExpense.id);
        } else {
            result = await supabase.from('expenses').insert([{
                title,
                amount: parseFloat(amount),
                category,
                subcategory,
                description,
                created_at,
                user_id: user.id,
            }]);
        }
        if (result.error) {
            alert('Error saving expense: ' + result.error.message);
            return;
        }
        closeModal();
        // Refresh expenses
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (!error) setExpenses(data);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        await supabase.from('expenses').delete().eq('id', id);
        setExpenses(expenses.filter(exp => exp.id !== id));
    };

    useEffect(() => {
        const fetchExpesnes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error) {
                setExpenses(data);
                setFetchError('');
            } else {
                setFetchError('Failed to fetch expenses. Please try again.');
            }
            setLoading(false);
        };
        fetchExpesnes();
    }, []);

    const filtered = useMemo(() => {
        let filteredData = expenses;
        if (year) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 4) === year);
        if (month) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 7) === month);
        if (date) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 10) === date);
        return filteredData;
    }, [expenses, date, month, year]);

    useEffect(() => {
        setMonth('');
    }, [year]);

    const years = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 4)))).sort((a, b) => b - a);
    const months = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
    const uniqueDates = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 10))));

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="text-center mt-4 text-primary">Expenses</h1>
                <div className="row align-items-center mb-3">
                    <div className="col-auto">
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-primary dropdown-toggle"
                                type="button"
                                id="filtersDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false">
                                Filters
                            </button>
                            <div className="dropdown-menu p-4" aria-labelledby="filtersDropdown" style={{ minWidth: 300 }}>

                                <div className="mb-3">
                                    <label className="form-label">Year</label>
                                    <select
                                        className="form-select"
                                        value={year}
                                        onChange={e => setYear(e.target.value)}
                                        aria-label="Select Year"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                {year && (
                                    <div className="mb-3">
                                        <label className="form-label">Month</label>
                                        <select
                                            className="form-select"
                                            value={month}
                                            onChange={e => setMonth(e.target.value)}
                                            aria-label="Select Month"
                                        >
                                            <option value="">Select Month</option>
                                            {months.filter(m => m.startsWith(year)).map(m => (
                                                <option key={m} value={m}>
                                                    {new Date(m + '-01').toLocaleString('default', { month: 'long' })} {m.slice(0, 4)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={date}
                                        onChange={e => {
                                            setDate(e.target.value);
                                            setMonth('');
                                            setYear('');
                                        }}
                                        aria-label="Select Date"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-primary" onClick={() => openModal()}>Add Expense</button>
                    </div>
                    {(year || month || date) && (
                        <div className="col-auto">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setYear('');
                                    setMonth('');
                                    setDate('');
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
                <div className="row">
                    <div className="col-sm-12 col-md-9">
                        <h2 className="text-center text-secondary">Expenses List</h2>
                        {fetchError && <div className="alert alert-danger">{fetchError}</div>}
                        {loading ? (
                            <div className="text-center">Loading...</div>
                        ) : (
                            <div className="card shadow-sm">
                                <div className="card-body p-2">
                                    <div className="table-responsive" style={{ minWidth: '700px', maxWidth: '100vw', overflowX: 'auto' }}>
                                        <table className="table table-striped table-hover table-bordered align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Category</th>
                                                    <th className="d-none d-md-table-cell">Subcategory</th>
                                                    <th>Description</th>
                                                    <th>Amount</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.length > 0 ? (
                                                    filtered.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td>{expense.created_at.slice(0, 10)}</td>
                                                            <td>{expense.category}</td>
                                                            <td className="d-none d-md-table-cell">{expense.subcategory}</td>
                                                            <td className="text-truncate" style={{ maxWidth: 120 }}>{expense.description}</td>
                                                            <td className="fw-bold text-primary-emphasis" style={{ fontSize: '1.1rem' }}>{expense.amount}</td>
                                                            <td>
                                                                <button className="btn btn-outline-primary btn-sm me-2" onClick={() => openModal(expense)}>Edit</button>
                                                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(expense.id)}>Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-secondary">
                                                            No expenses found for the selected filters.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showModal && (
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3 className="modal-title">{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                                    <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleModalSubmit}>
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={modalFields.title}
                                            onChange={e => setModalFields(f => ({ ...f, title: e.target.value }))}
                                            required
                                            className="form-control mb-2"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={modalFields.amount}
                                            onChange={e => setModalFields(f => ({ ...f, amount: e.target.value }))}
                                            required
                                            className="form-control mb-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Category"
                                            value={modalFields.category}
                                            onChange={e => setModalFields(f => ({ ...f, category: e.target.value }))}
                                            required
                                            className="form-control mb-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subcategory"
                                            value={modalFields.subcategory}
                                            onChange={e => setModalFields(f => ({ ...f, subcategory: e.target.value }))}
                                            className="form-control mb-2"
                                        />
                                        <input
                                            type="date"
                                            className="form-control mb-2"
                                            value={modalFields.created_at}
                                            onChange={e => setModalFields(f => ({ ...f, created_at: e.target.value }))}
                                            aria-label="Select Date"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description (optional)"
                                            value={modalFields.description}
                                            onChange={e => setModalFields(f => ({ ...f, description: e.target.value }))}
                                            className="form-control mb-2"
                                        />
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
    )
}
