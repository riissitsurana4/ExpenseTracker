'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [filtered, setFiltered] = useState('');
    const [date, setDate] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
        const fetchExpesnes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return;
            }
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error) {
                setExpenses(data);
            };
        };
        fetchExpesnes();
    }, []);

    useEffect(() => {
        let filteredData = expenses;
        if (date) {
            filteredData = filteredData.filter(exp => exp.created_at.slice(0, 10) === date);
        }
        if (month) {
            filteredData = filteredData.filter(exp => exp.created_at.slice(0, 7) === month);
        }
        if (year) {
            filteredData = filteredData.filter(exp => exp.created_at.slice(0, 4) === year);
        }
        setFiltered(filteredData);
    }, [expenses, date, month, year]);

    const years = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 4)))).sort((a, b) => b - a);
    const months = Array.from(new Set(expenses.map(exp => exp.created_at.slice(0, 7)))).sort((a, b) => b.localeCompare(a));

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="text-center mt-4 text-primary">Expenses</h1>
                <div className="row">
                    <div className="col-sm-12 col-md-3">
                        <h2 className="text-center text-secondary">Filters</h2>
                         <div className="input-group mb-3">
                            <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                                <option value="">Select Month</option>
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        {new Date(m + '-01').toLocaleString('default', { month: 'long' })} {m.slice(0, 4)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
