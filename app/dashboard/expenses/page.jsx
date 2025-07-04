'use client'
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import BootstrapClient from '../../../components/BootstrapClient';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [date, setDate] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editExpense, setEditExpense] = useState(null);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState("");
    const [createdAt, setCreatedAt] = useState('');
    const [categories, setCategories] = useState([]);
    const [allSubcategories, setAllSubcategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSubcategory, setFilterSubcategory] = useState('');
    const [filterAmountMin, setFilterAmountMin] = useState('');
    const [filterAmountMax, setFilterAmountMax] = useState('');
    const [filterModeOfPayment, setFilterModeOfPayment] = useState('');
    const [filterRecurring, setFilterRecurring] = useState('');
    const [userCurrency, setUserCurrency] = useState('INR');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [isRecurring, setIsRecurring] = useState('');
    const [recurringType, setRecurringType] = useState('');

    const { data: session, status } = useSession();

    const filteredSubcategories = useMemo(() => {
        if(!selectedCategoryId || !allSubcategories.length) return [];
        return allSubcategories.filter(sub => sub.category_id === selectedCategoryId);
    }, [selectedCategoryId, allSubcategories]);

    const filterSubcategories = useMemo(() => {
        if(!filterCategory || !allSubcategories.length || !categories.length) return [];
        const selectedFilterCategoryId = categories.find(cat => cat.name === filterCategory)?.id;
        if (!selectedFilterCategoryId) return [];
        return allSubcategories.filter(sub => sub.category_id === selectedFilterCategoryId);
    }, [filterCategory, allSubcategories, categories]);

    const isCurrentMonth = useMemo(() => {
        if (!month) return false;
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        return month === currentMonth;
    }, [month]);

    const fetchExpenses = async () => {
        if (!session?.user?.email) {
            return;
        }
        
        try {
            const response = await fetch(`/api/expenses?email=${encodeURIComponent(session.user.email)}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch expenses: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            setExpenses(Array.isArray(data) ? data : []);
            setFetchError('');
        } catch (error) {
            setFetchError(`Failed to load expenses: ${error.message}`);
            setExpenses([]);
        }
    };

    const fetchCategories = async () => {
        if (!session?.user?.email) {
            return;
        }
        
        try {
            const response = await fetch(`/api/categories?email=${encodeURIComponent(session.user.email)}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch categories: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            setFetchError(`Failed to load categories: ${error.message}`);
            setCategories([]);
        }
    };

    const fetchSubcategories = async () => {
        if (!session?.user?.email) {
            return;
        }
        
        try {
            const response = await fetch(`/api/subcategories/all?email=${encodeURIComponent(session.user.email)}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch subcategories: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            setAllSubcategories(Array.isArray(data) ? data : []);
        } catch (error) {
            setFetchError(`Failed to load subcategories: ${error.message}`);
            setAllSubcategories([]);
        }
    };

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

        if (filterCategory) {
            const selectedFilterCategoryId = categories.find(cat => cat.name === filterCategory)?.id;
            if (selectedFilterCategoryId) {
                filteredData = filteredData.filter(exp => exp.category_id === selectedFilterCategoryId);
            }
        }

        if (filterSubcategory) filteredData = filteredData.filter(exp => exp.subcategory === filterSubcategory);
        if (filterAmountMin) filteredData = filteredData.filter(exp => parseFloat(exp.amount) >= parseFloat(filterAmountMin));
        if (filterAmountMax) filteredData = filteredData.filter(exp => parseFloat(exp.amount) <= parseFloat(filterAmountMax));
        if (filterModeOfPayment) filteredData = filteredData.filter(exp => exp.mode_of_payment === filterModeOfPayment);
        if (filterRecurring) {
            if (filterRecurring === 'yes') filteredData = filteredData.filter(exp => exp.is_recurring);
            else if (filterRecurring === 'no') filteredData = filteredData.filter(exp => !exp.is_recurring);
        }
        
        return filteredData;
    }, [expenses, date, month, year, startDate, endDate, filterCategory, filterSubcategory, filterAmountMin, filterAmountMax, filterModeOfPayment, filterRecurring, categories]);

    const sortedExpenses = useMemo(() => {
        let sorted = [...filtered];
        if (sortColumn) {
            sorted.sort((a, b) => {

                if (sortColumn === 'category_id') {
                    const nameA = categories.find(cat => cat.id === a.category_id)?.name || '';
                    const nameB = categories.find(cat => cat.id === b.category_id)?.name || '';
                    if (nameA < nameB) return sortDirection === 'asc' ? -1 : 1;
                    if (nameA > nameB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                }

                if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
                if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filtered, sortColumn, sortDirection, categories]);

    const openModal = (expense = null) => {
        setEditExpense(expense);
        if (expense) {
            setTitle(expense.title || '');
            setAmount(expense.amount || '');
            setSelectedCategoryId(expense.category_id || '');
            setSubcategory(expense.subcategory || "");
            setCreatedAt(expense.created_at ? expense.created_at.slice(0, 10) : '');
            setModeOfPayment(expense.mode_of_payment || "");
            setIsRecurring(typeof expense.is_recurring !== 'undefined' ? (expense.is_recurring ? 'yes' : 'no') : '');
            setRecurringType(expense.recurring_type || '');
        } else {
            setTitle('');
            setAmount('');
            setSelectedCategoryId('');
            setSubcategory("");
            setCreatedAt(new Date().toISOString().slice(0, 10));
            setModeOfPayment("");
            setIsRecurring('');
            setRecurringType('');
        }
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setTitle('');
        setAmount('');
        setSelectedCategoryId('');
        setSubcategory("");
        setEditExpense(null);
    };

    const years = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 4)))).sort((a, b) => b - a);
    const months = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort((a, b) => b.localeCompare(a));

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

    const useDropdown = () => {
        const [open, setOpen] = useState(false);
        const ref = useRef();
        useEffect(() => {
            const handleClick = (e) => {
                if (ref.current && !ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, []);
        return [open, setOpen, ref];
    };

    function FilterDropdown({ children }) {
        const [open, setOpen, ref] = useDropdown();
        return (
            <span ref={ref} style={{ position: 'relative', marginLeft: 4 }}>
                <button type="button" className="btn btn-link p-0" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
                    <i className="bi bi-funnel"></i>
                </button>
                {open && (
                    <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 8, minWidth: 120, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {children}
                    </div>
                )}
            </span>
        );
    }

    const currencySign = (currency) => {
        return '₹'; 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!session?.user?.email) {
            setFetchError('Please sign in to add/edit expenses.');
            return;
        }

        if (!title || !amount || !selectedCategoryId || !createdAt || !isRecurring) {
            setFetchError('Please fill in all required fields.');
            return;
        }

        if (isRecurring === 'yes' && !recurringType) {
            setFetchError('Please select a recurring type.');
            return;
        }

        try {
            const expenseData = {
                title: title.trim(),
                amount: parseFloat(amount),
                category_id: selectedCategoryId,
                subcategory: subcategory.trim() || null,
                created_at: createdAt,
                mode_of_payment: modeOfPayment || null,
                is_recurring: isRecurring === 'yes',
                recurring_type: isRecurring === 'yes' ? recurringType : null,
                user_email: session.user.email // Add user email for API
            };

            let response;
            if (editExpense) {
                // Update existing expense
                response = await fetch(`/api/expenses/${editExpense.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(expenseData),
                });
            } else {
                response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(expenseData),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save expense');
            }

            await fetchExpenses();
            
            closeModal();
            setFetchError('');
            
        } catch (error) {
            console.error('Error saving expense:', error);
            setFetchError(error.message || 'Failed to save expense. Please try again.');
        }
    };

    const handleDelete = async (expenseId) => {
        if (!session?.user?.email) {
            setFetchError('Please sign in to delete expenses.');
            return;
        }

        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete expense');
            }

            await fetchExpenses();
            setFetchError('');
            
        } catch (error) {
            console.error('Error deleting expense:', error);
            setFetchError(error.message || 'Failed to delete expense. Please try again.');
        }
    };

    useEffect(() => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear().toString();
        const currentMonth = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!year && !month) {
            setYear(currentYear);
            setMonth(currentMonth);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const loadData = async () => {
                setLoading(true);
                try {
                    await Promise.all([
                        fetchExpenses(),
                        fetchCategories(),
                        fetchSubcategories()
                    ]);
                } catch (error) {
                    setFetchError('Failed to load data. Please refresh the page.');
                } finally {
                    setLoading(false);
                }
            };
            
            loadData();
        } else if (status === 'unauthenticated') {
            setLoading(false);
            setFetchError('Please sign in to view your expenses.');
        }
    }, [session, status]);

    if (status === 'loading') {
        return (
            <>
                <BootstrapClient />
                <div className="container-fluid">
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <>
                <BootstrapClient />
                <div className="container-fluid">
                    <div className="alert alert-warning text-center">
                        Please sign in to view your expenses.
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="text-center text-primary mb-3" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>Expenses</h1>
                <div className="card mb-4 shadow-sm">
                    <div className="card-body py-3 px-2">
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
                                                    <th style={{ width: '18%' }}>
                                                        Date
                                                        <FilterDropdown>
                                                            <input type="date" className="form-control form-control-sm" value={date} onChange={e => setDate(e.target.value)} />
                                                        </FilterDropdown>
                                                    </th>
                                                    <th style={{ width: '18%' }}>
                                                        Category
                                                        <FilterDropdown>
                                                            <select className="form-select form-select-sm" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}>
                                                                <option value="">All</option>
                                                                {categories.map(cat => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
                                                            </select>
                                                        </FilterDropdown>
                                                    </th>
                                                    <th className="d-none d-md-table-cell" style={{ width: '16%' }}>
                                                        Subcategory
                                                        <FilterDropdown>
                                                            <select className="form-select form-select-sm" value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} disabled={!filterCategory}>
                                                                <option value="">All</option>
                                                                {filterCategory && filterSubcategories.map(sub => (
                                                                    <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                                ))}
                                                            </select>
                                                        </FilterDropdown>
                                                    </th>
                                                    <th className="text-center" style={{ width: '10%' }}>
                                                        Amount
                                                        <FilterDropdown>
                                                            <div className="d-flex gap-1">
                                                                <input type="number" className="form-control form-control-sm" placeholder="Min" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} style={{ width: 60 }} />
                                                                <input type="number" className="form-control form-control-sm" placeholder="Max" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} style={{ width: 60 }} />
                                                            </div>
                                                        </FilterDropdown>
                                                    </th>
                                                    <th className="text-center d-none d-sm-table-cell" style={{ width: '10%' }}>
                                                        Recurring
                                                        <FilterDropdown>
                                                            <select className="form-select form-select-sm" value={filterRecurring} onChange={e => setFilterRecurring(e.target.value)}>
                                                                <option value="">All</option>
                                                                <option value="yes">Yes</option>
                                                                <option value="no">No</option>
                                                            </select>
                                                        </FilterDropdown>
                                                    </th>
                                                    <th className="text-center d-none d-sm-table-cell" style={{ width: '18%' }}>
                                                        Mode of Payment
                                                        <FilterDropdown>
                                                            <select className="form-select form-select-sm" value={filterModeOfPayment} onChange={e => setFilterModeOfPayment(e.target.value)}>
                                                                <option value="">All</option>
                                                                <option value="cash">Cash</option>
                                                                <option value="credit_card">Credit Card</option>
                                                                <option value="debit_card">Debit Card</option>
                                                                <option value="upi">UPI</option>
                                                                <option value="net_banking">Net Banking</option>
                                                                <option value="wallet">Wallet</option>
                                                            </select>
                                                        </FilterDropdown>
                                                    </th>
                                                    <th className="text-center" style={{ width: '12%' }}>
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedExpenses.length > 0 ? (
                                                    sortedExpenses.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td style={{ wordBreak: 'break-word' }}>{expense.created_at.slice(0, 10)}</td>
                                                            <td style={{ wordBreak: 'break-word' }}>
                                                                {categories.find(cat => cat.id === expense.category_id)?.name || 'N/A'}
                                                            </td>
                                                            <td className="d-none d-md-table-cell" style={{ wordBreak: 'break-word' }}>{expense.subcategory}</td>
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
                                            <div className="mb-1">
                                                <label htmlFor="title" className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="title"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-1">
                                                <label htmlFor="amount" className="form-label">Amount</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="amount"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    step="0.01"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-1">
                                                <label htmlFor="categorySelect" className="form-label">Category</label>
                                                <select
                                                    className="form-select"
                                                    id="categorySelect"
                                                    value={selectedCategoryId}
                                                    onChange={e => setSelectedCategoryId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select a category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-1">
                                                <label htmlFor="subcategorySelect" className="form-label">Subcategory</label>
                                                <select
                                                    className="form-select"
                                                    id="subcategorySelect"
                                                    value={subcategory}
                                                    onChange={e => setSubcategory(e.target.value)}
                                                    disabled={!selectedCategoryId || filteredSubcategories.length === 0}
                                                >
                                                    <option value="">Select a subcategory</option>
                                                    {filteredSubcategories.map((sub) => (
                                                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-1">
                                                <label htmlFor="createdAt" className="form-label">Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    id="createdAt"
                                                    value={createdAt}
                                                    onChange={(e) => setCreatedAt(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-1">
                                                <label htmlFor="modeOfPayment" className="form-label">Mode of Payment</label>
                                                <select
                                                    className="form-select"
                                                    id="modeOfPayment"
                                                    value={modeOfPayment}
                                                    onChange={(e) => setModeOfPayment(e.target.value)}
                                                >
                                                    <option value="">Select mode of payment</option>
                                                    <option value="cash">Cash</option>
                                                    <option value="credit_card">Credit Card</option>
                                                    <option value="debit_card">Debit Card</option>
                                                    <option value="upi">UPI</option>
                                                    <option value="net_banking">Net Banking</option>
                                                    <option value="wallet">Wallet</option>
                                                </select>
                                            </div>
                                            <div className="mb-1">
                                                <label htmlFor="recurring" className="form-label">Recurring</label>                                <select
                                    className="form-select"
                                    id="recurring"
                                    value={isRecurring}
                                    onChange={e => setIsRecurring(e.target.value)}
                                    required
                                >
                                    <option value="">Select recurring option</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                            </div>
                                            {isRecurring === 'yes' && (
                                                <div className="mb-2">
                                                    <label htmlFor="recurringType" className="form-label">Recurring Type</label>
                                                    <select
                                                        className="form-select"
                                                        id="recurringType"
                                                        value={recurringType}
                                                        onChange={e => setRecurringType(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select type</option>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="yearly">Yearly</option>
                                                        <option value="daily">Daily</option>
                                                    </select>
                                                </div>
                                            )}
                                            <button type="submit" className="btn btn-primary w-100">{editExpense ? 'Update Expense' : 'Add Expense'}</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}