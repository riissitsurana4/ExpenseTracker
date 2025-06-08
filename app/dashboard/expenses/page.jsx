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
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState("");
    const [description, setDescription] = useState("");
    const [createdAt, setCreatedAt] = useState('');
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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
    const openModal = (expense = null) => {
        setEditExpense(expense);
        if (expense) {
            setTitle(expense.title || '');
            setAmount(expense.amount || '');
            setCategory(expense.category || '');
            setSubcategory(expense.subcategory || "");
            setDescription(expense.description || "");
            setCreatedAt(expense.created_at ? expense.created_at.slice(0, 10) : '');
        } else {
            setTitle('');
            setAmount('');
            setCategory('');
            setSubcategory("");
            setDescription("");
            setCreatedAt(new Date().toISOString().slice(0, 10));
        }
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setTitle('');
        setAmount('');
        setCategory('');
        setSubcategory("");
        setDescription("");
        setEditExpense(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !amount || isNaN(parseFloat(amount))) {
            alert('Please enter a valid title and amount.');
            return;
        }
        // Ensure amount always has two decimals
        const formattedAmount = parseFloat(parseFloat(amount).toFixed(2));
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('User not found. Please log in again.');
            return;
        }
        let result;
        if (editExpense) {
            result = await supabase
                .from('expenses')
                .update({ title, amount: formattedAmount, category, subcategory, description, created_at: createdAt })
                .eq('id', editExpense.id);
        } else {
            result = await supabase.from('expenses').insert([
                {
                    title,
                    amount: formattedAmount,
                    category,
                    subcategory,
                    description,
                    created_at: createdAt,
                    user_id: user.id,
                },
            ]);
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
        if (startDate) filteredData = filteredData.filter(exp => new Date(exp.created_at) >= new Date(startDate));
        if (endDate) filteredData = filteredData.filter(exp => new Date(exp.created_at) <= new Date(endDate));
        if (filterCategory) filteredData = filteredData.filter(exp => exp.category === filterCategory);
        return filteredData;
    }, [expenses, date, month, year, startDate, endDate, filterCategory]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    useEffect(() => {
        setMonth('');
    }, [year]);

    const years = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 4)))).sort((a, b) => b - a);
    const months = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
    const uniqueDates = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 10))));

    // Fetch categories and subcategories from Supabase
    useEffect(() => {
        const fetchCategories = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: categoryData } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });
            setCategories(categoryData || []);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (category) {
            const selectedCategory = categories.find(cat => cat.name === category);
            if (selectedCategory) {
                const fetchSubcategories = async (categoryId) => {
                    const { data } = await supabase
                        .from('subcategories')
                        .select('name')
                        .eq('category_id', categoryId);
                    setSubcategories(data || []);
                    setSubcategory('');
                };
                fetchSubcategories(selectedCategory.id);
            }
        } else {
            setSubcategories([]);
            setSubcategory('');
        }
    }, [category, categories]);

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="text-center mt-4 text-primary">Expenses</h1>
                <div className="row align-items-center mb-3">
                    {/* Main Filters Dropdown (Year, Month, Date) */}
                    <div className="col-auto">
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-primary dropdown-toggle"
                                type="button"
                                id="filtersDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                tabIndex={0}
                            >
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
                    {/* Date Period Dropdown */}
                    <div className="col-auto">
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                id="datePeriodDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false">
                                Date Period
                            </button>
                            <div className="dropdown-menu p-4" aria-labelledby="datePeriodDropdown" style={{ minWidth: 250 }}>
                                <div className="mb-3">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        aria-label="Start Date"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        aria-label="End Date"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Category Dropdown styled like Filters */}
                    <div className="col-auto">
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-primary dropdown-toggle"
                                type="button"
                                id="categoryDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false">
                                Category
                            </button>
                            <div className="dropdown-menu p-4" aria-labelledby="categoryDropdown" style={{ minWidth: 200 }}>
                                <div className="mb-2">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        aria-label="Select Category"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(year || month || date || startDate || endDate || filterCategory) && (
                        <div className="col-auto">
                            <button className="btn btn-secondary" onClick={() => {
                                setYear('');
                                setMonth('');
                                setDate('');
                                setStartDate('');
                                setEndDate('');
                                setFilterCategory('');
                            }}>
                                Clear Filters
                            </button>
                        </div>
                    )}
                    <div className="col-auto">
                        <button className="btn btn-primary" onClick={() => openModal()}>Add Expense</button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12 col-md-9">
                        <h2 className="text-center text-secondary">Expenses List</h2>
                        {fetchError && <div className="alert alert-danger">{fetchError}</div>}
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
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
                                                    <th className="text-center">Amount</th>
                                                    <th className="text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginated.length > 0 ? (
                                                    paginated.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td>{expense.created_at.slice(0, 10)}</td>
                                                            <td>{expense.category}</td>
                                                            <td className="d-none d-md-table-cell">{expense.subcategory}</td>
                                                            <td className="text-truncate" style={{ maxWidth: 120 }}>{expense.description}</td>
                                                            <td className="fw-bold text-primary text-center" style={{ fontSize: '1.1rem' }}>
                                                                {currencySign(userCurrency)}{Number(expense.amount).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
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

                {totalPages > 1 && (
                    <nav className="mt-3">
                        <ul className="pagination justify-content-center">
                            <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                            </li>
                            {[...Array(totalPages)].map((_, idx) => (
                                <li key={idx} className={`page-item${currentPage === idx + 1 ? ' active' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}

                {showModal && (
                    <>
                        <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}></div>
                        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: 350, maxWidth: '95vw' }}>
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
                                                onChange={(e) => {
                                                    // Always keep two decimals in the input
                                                    const val = e.target.value;
                                                    if (val === "") {
                                                        setAmount("");
                                                    } else {
                                                        // Only allow valid number input, format to two decimals if possible
                                                        const num = parseFloat(val);
                                                        if (!isNaN(num)) {
                                                            setAmount(num.toFixed(2));
                                                        } else {
                                                            setAmount(val);
                                                        }
                                                    }
                                                }}
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
                                            <select
                                                value={subcategory}
                                                onChange={(e) => setSubcategory(e.target.value)}
                                                required
                                                className="form-select mb-2 subcategory-select"
                                                disabled={!category || subcategories.length === 0}
                                            >
                                                {subcategories.length === 0 ? (
                                                    <option value="" disabled>No subcategories available</option>
                                                ) : (
                                                    <>
                                                        <option value={""}>Select Subcategory</option>
                                                        {subcategories.map(sub => (
                                                            <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                        ))}
                                                    </>
                                                )}
                                            </select>
                                            <input
                                                type="date"
                                                className="form-control mb-2"
                                                value={createdAt}
                                                onChange={e => setCreatedAt(e.target.value)}
                                                aria-label="Select Date"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Description (optional)"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
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
                    </>
                )}
            </div>
        </>
    )
}
