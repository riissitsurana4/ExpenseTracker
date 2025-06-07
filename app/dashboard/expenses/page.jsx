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
                <div className="row">
                    <div className="dropdown mb-3">
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
                    <div className="col-sm-12 col-md-9">
                        <h2 className="text-center text-secondary">Expenses List</h2>
                        {fetchError && <div className="alert alert-danger">{fetchError}</div>}
                        {loading ? (
                            <div className="text-center">Loading...</div>
                        ) : (
                            <table className="table table-striped">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Subcategory</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length > 0 ? (
                                        filtered.map((expense) => (
                                            <tr key={expense.id}>
                                                <td>{expense.created_at.slice(0, 10)}</td>
                                                <td>{expense.category}</td>
                                                <td>{expense.subcategory}</td>
                                                <td>{expense.amount}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center text-secondary">
                                                No expenses found for the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                <div className="row">
                    <div className="col text-center">
                        <button
                            className="btn btn-secondary w-100"
                            onClick={() => {
                                setYear('');
                                setMonth('');
                                setDate('');
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
