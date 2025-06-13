'use client'
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../utils/supabase/client';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';
import 'bootstrap-icons/font/bootstrap-icons.css';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

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
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSubcategory, setFilterSubcategory] = useState('');
    const [filterAmountMin, setFilterAmountMin] = useState('');
    const [filterAmountMax, setFilterAmountMax] = useState('');
    const [filterModeOfPayment, setFilterModeOfPayment] = useState('');
    const [filterRecurring, setFilterRecurring] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [userCurrency, setUserCurrency] = useState('INR');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const filtered = useMemo(() => {
        let filteredData = expenses;
        if (year) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 4) === year);
        if (month) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 7) === month);
        if (date) filteredData = filteredData.filter(exp => exp.created_at.slice(0, 10) === date);
        if (startDate) filteredData = filteredData.filter(exp => new Date(exp.created_at) >= new Date(startDate));
        if (endDate) filteredData = filteredData.filter(exp => new Date(exp.created_at) <= new Date(endDate));
        if (filterCategory) filteredData = filteredData.filter(exp => exp.category === filterCategory);
        if (filterSubcategory) filteredData = filteredData.filter(exp => exp.subcategory === filterSubcategory);
        if (filterAmountMin) filteredData = filteredData.filter(exp => parseFloat(exp.amount) >= parseFloat(filterAmountMin));
        if (filterAmountMax) filteredData = filteredData.filter(exp => parseFloat(exp.amount) <= parseFloat(filterAmountMax));
        if (filterModeOfPayment) filteredData = filteredData.filter(exp => exp.mode_of_payment === filterModeOfPayment);
        if (filterRecurring) {
            if (filterRecurring === 'yes') filteredData = filteredData.filter(exp => exp.is_recurring);
            else if (filterRecurring === 'no') filteredData = filteredData.filter(exp => !exp.is_recurring);
        }
        return filteredData;
    }, [expenses, date, month, year, startDate, endDate, filterCategory, filterSubcategory, filterAmountMin, filterAmountMax, filterModeOfPayment, filterRecurring]);

    const sortedExpenses = useMemo(() => {
        let sorted = [...filtered];
        if (sortColumn) {
            sorted.sort((a, b) => {
                if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
                if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filtered, sortColumn, sortDirection]);

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
            setModeOfPayment(expense.mode_of_payment || ""); 
        } else {
            setTitle('');
            setAmount('');
            setCategory('');
            setSubcategory("");
            setDescription("");
            setCreatedAt(new Date().toISOString().slice(0, 10));
            setModeOfPayment("");
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
                .update({ title, amount: formattedAmount, category, subcategory, description, created_at: createdAt, mode_of_payment: modeOfPayment }) // <-- add mode_of_payment
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
                    mode_of_payment: modeOfPayment // <-- add mode_of_payment
                },
            ]);
        }
        if (result.error) {
            alert('Error saving expense: ' + result.error.message);
            return;
        }
        closeModal();
       
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

    const years = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 4)))).sort((a, b) => b - a);
    const months = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
    const uniqueDates = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 10))));

   
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
        const fetchAllSubcategories = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('subcategories')
                .select('name, category_id');
            setAllSubcategories(data || []);
        };
        fetchAllSubcategories();
    }, []);


    const filteredSubcategories = useMemo(() => {
        if (!category) return [];
        const selectedCategory = categories.find(cat => cat.name === category);
        if (selectedCategory) {
            return allSubcategories.filter(sub => sub.category_id === selectedCategory.id);
        }
        return [];
    }, [category, allSubcategories, categories]);


    const [filterSubcategories, setFilterSubcategories] = useState([]);
    useEffect(() => {
        if (filterCategory) {
            const selectedCategory = categories.find(cat => cat.name === filterCategory);
            if (selectedCategory) {
                const fetchSubcategories = async (categoryId) => {
                    const { data } = await supabase
                        .from('subcategories')
                        .select('name')
                        .eq('category_id', categoryId);
                    setFilterSubcategories(data || []);
                };
                fetchSubcategories(selectedCategory.id);
            }
        } else {
            setFilterSubcategories([]);
            setFilterSubcategory("");
        }
    }, [filterCategory, categories]);

    useEffect(() => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setMonth(currentMonth);
    }, []);

    const isCurrentMonth = (() => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return month === currentMonth;
    })();

    const exportExpensesToCSV = (data, filename = 'expenses.csv') => {
      if (!data.length) return;
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const exportExpensesToPDF = (data, filename = 'expenses.pdf') => {
      if (!data.length) return;
      const doc = new jsPDF();
      const headers = [Object.keys(data[0])];
      const rows = data.map(row => headers[0].map(field => row[field] ?? ''));
      doc.text('Expenses', 14, 15);
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 }
      });
      doc.save(filename);
    };

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="text-center text-primary mb-3" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>Expenses</h1>
                <div className="card mb-4 shadow-sm">
                    <div className="card-body py-3 px-2">
                        {/* Responsive filter row */}
                        <div className="row g-2 align-items-end flex-wrap flex-md-nowrap">
                            <div className="col-12 col-sm-6 col-md-2">
                                <label className="form-label mb-1">Year</label>
                                <select className="form-select" value={year} onChange={e => setYear(e.target.value)} aria-label="Select Year">
                                    <option value="">All</option>
                                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                                </select>
                            </div>
                            <div className="col-12 col-sm-6 col-md-2">
                                <label className="form-label mb-1">Month</label>
                                <select className="form-select" value={month} onChange={e => setMonth(e.target.value)} aria-label="Select Month" disabled={!year}>
                                    <option value="">All</option>
                                    {months.filter(m => m.startsWith(year)).map(m => (
                                        <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long' })} {m.slice(0, 4)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-12 col-sm-6 col-md-2">
                                <label className="form-label mb-1">Start Date</label>
                                <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label="Start Date" />
                            </div>
                            <div className="col-12 col-sm-6 col-md-2">
                                <label className="form-label mb-1">End Date</label>
                                <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label="End Date" />
                            </div>
                    
                            <div className="col-12 col-md-auto ms-auto d-flex justify-content-end gap-2 mt-2 mt-md-0 align-items-end flex-wrap flex-md-nowrap">
                               
                                <button
                                    className="btn btn-outline-success"
                                    onClick={() => exportExpensesToCSV(sortedExpenses)}
                                    title="Export as CSV"
                                >
                                    <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV
                                </button>
                               
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() => exportExpensesToPDF(sortedExpenses)}
                                    title="Export as PDF"
                                >
                                    <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                                </button>
                               
                                {(
                                    (year || date || startDate || endDate || filterCategory || filterSubcategory || filterAmountMin || filterAmountMax || filterModeOfPayment || filterRecurring) ||
                                    (month && !isCurrentMonth)
                                ) && (
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => { setYear(''); setMonth(''); setDate(''); setStartDate(''); setEndDate(''); setFilterCategory(''); setFilterSubcategory(''); setFilterAmountMin(''); setFilterAmountMax(''); setFilterModeOfPayment(''); setFilterRecurring(''); }}>
                                        Clear Filters
                                    </button>
                                )}
                                {/* Add Expense */}
                                <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                                    <i className="bi bi-plus-lg me-1"></i> Add Expense
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light border-bottom-0">
                                <h2 className="text-primary h5 mb-0">Expenses List</h2>
                            </div>
                            <div className="card-body p-2">
                                {fetchError && <div className="alert alert-danger">{fetchError}</div>}
                                {loading ? (
                                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive w-100" style={{ minWidth: 0, maxWidth: '100vw', overflowX: 'auto' }}>
                                        <table className="table table-striped table-hover table-bordered align-middle mb-0" style={{ width: '100%' }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '18%' }} onClick={() => handleSort('created_at')}>Date</th>
                                                    <th style={{ width: '18%' }} onClick={() => handleSort('category')}>Category</th>
                                                    <th className="d-none d-md-table-cell" style={{ width: '16%' }} onClick={() => handleSort('subcategory')}>Subcategory</th>
                                                    <th className="d-none d-sm-table-cell" style={{ width: '16%' }} onClick={() => handleSort('description')}>Description</th>
                                                    <th className="text-center" style={{ width: '14%' }} onClick={() => handleSort('amount')}>Amount</th>
                                                    <th className="text-center d-none d-sm-table-cell" style={{ width: '10%' }} onClick={() => handleSort('is_recurring')}>Recurring</th>
                                                    <th className="text-center d-none d-sm-table-cell" style={{ width: '18%' }} onClick={() => handleSort('mode_of_payment')}>Mode of Payment</th>
                                                    <th className="text-center" style={{ width: '12%' }} >Actions</th>
                                                </tr>
                                                <tr>
                                                    <th>
                                                        <input type="date" className="form-control form-control-sm" value={date} onChange={e => setDate(e.target.value)} />
                                                    </th>
                                                    <th>
                                                        <select className="form-select form-select-sm" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}>
                                                            <option value="">All</option>
                                                            {categories.map(cat => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
                                                        </select>
                                                    </th>
                                                    <th className="d-none d-md-table-cell">
                                                        <select className="form-select form-select-sm" value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} disabled={!filterCategory}>
                                                            <option value="">All</option>
                                                            {filterSubcategory && filterCategory && filterSubcategories.map(sub => (
                                                                <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                    </th>
                                                    <th className="d-none d-sm-table-cell"></th>
                                                    <th>
                                                        <div className="d-flex gap-1">
                                                            <input type="number" className="form-control form-control-sm" placeholder="Min" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} style={{ width: 60 }} />
                                                            <input type="number" className="form-control form-control-sm" placeholder="Max" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} style={{ width: 60 }} />
                                                        </div>
                                                    </th>
                                                    <th className="d-none d-sm-table-cell">
                                                        <select className="form-select form-select-sm" value={filterRecurring} onChange={e => setFilterRecurring(e.target.value)}>
                                                            <option value="">All</option>
                                                            <option value="yes">Yes</option>
                                                            <option value="no">No</option>
                                                        </select>
                                                    </th>
                                                    <th className="d-none d-sm-table-cell">
                                                        <select className="form-select form-select-sm" value={filterModeOfPayment} onChange={e => setFilterModeOfPayment(e.target.value)}>
                                                            <option value="">All</option>
                                                            <option value="cash">Cash</option>
                                                            <option value="credit_card">Credit Card</option>
                                                            <option value="debit_card">Debit Card</option>
                                                            <option value="upi">UPI</option>
                                                            <option value="net_banking">Net Banking</option>
                                                            <option value="wallet">Wallet</option>
                                                        </select>
                                                    </th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedExpenses.length > 0 ? (
                                                    sortedExpenses.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td style={{ wordBreak: 'break-word' }}>{expense.created_at.slice(0, 10)}</td>
                                                            <td style={{ wordBreak: 'break-word' }}>{expense.category}</td>
                                                            <td className="d-none d-md-table-cell" style={{ wordBreak: 'break-word' }}>{expense.subcategory}</td>
                                                            <td className="d-none d-sm-table-cell text-truncate" style={{ maxWidth: 120, wordBreak: 'break-word' }}>{expense.description}</td>
                                                            <td className="fw-bold text-primary text-center" style={{ fontSize: '1.1rem', wordBreak: 'break-word' }}>
                                                                {currencySign(userCurrency)}{Number(expense.amount).toFixed(2)}
                                                            </td>
                                                            <td className="text-center d-none d-sm-table-cell" style={{ wordBreak: 'break-word' }}>
                                                                {expense.is_recurring ? (
                                                                    <span className="badge bg-info text-dark">
                                                                        {expense.recurring_type ? expense.recurring_type.charAt(0).toUpperCase() + expense.recurring_type.slice(1) : 'Yes'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-secondary">No</span>
                                                                )}
                                                            </td>
                                                            <td className="text-center d-none d-sm-table-cell" style={{ wordBreak: 'break-word' }}>
                                                                {expense.mode_of_payment
                                                                    ? expense.mode_of_payment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                                                    : <span className="text-secondary">N/A</span>
                                                                }
                                                            </td>
                                                            <td className="text-center" style={{ wordBreak: 'break-word', minWidth: 120 }}>
                                                                <button className="btn btn-outline-primary btn-sm me-2" onClick={() => openModal(expense)} title="Edit">
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(expense.id)} title="Delete">
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center text-secondary">
                                                            No expenses found for the selected filters.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                                            <select
                                                value={subcategory}
                                                onChange={(e) => setSubcategory(e.target.value)}
                                                required
                                                className="form-select mb-2 subcategory-select"
                                                disabled={!category || !categories.find(c => c.name === category)}
                                            >
                                                {category && categories.find(c => c.name === category) ? (
                                                    <>
                                                        <option value="">Select Subcategory</option>
                                                        {allSubcategories
                                                            .filter(sub => sub.category_id === categories.find(c => c.name === category).id)
                                                            .map(sub => (
                                                                <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                            ))}
                                                    </>
                                                ) : (
                                                    <option value="" disabled>No subcategories available</option>
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
                                            <select
                                                value={modeOfPayment}
                                                onChange={e => setModeOfPayment(e.target.value)}
                                                required
                                                className="form-select mb-2">
                                                <option value="">Select Mode of Payment</option>
                                                <option value="cash">Cash</option>
                                                <option value="credit_card">Credit Card</option>
                                                <option value="debit_card">Debit Card</option>
                                                <option value="upi">UPI</option>
                                                <option value="net_banking">Net Banking</option>
                                                <option value="wallet">Wallet</option>
                                            </select>
                                            <div className="mb-2">
                                                <label className="form-label">Recurring</label>
                                                <select
                                                    className="form-select"
                                                    value={editExpense?.recurring_type || ''}
                                                    onChange={e => {
                                                        if (editExpense) {
                                                            setEditExpense({ ...editExpense, recurring_type: e.target.value });
                                                        }
                                                    }}
                                                >
                                                    <option value="">No</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
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
