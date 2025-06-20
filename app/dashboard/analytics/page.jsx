'use client';
import { useEffect, useState } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { supabase } from '../../../utils/supabase/client';
import 'chart.js/auto';

export default function AnalyticsPage() {
    const [categoryData, setCategoryData] = useState({});
    const [dailyLabels, setDailyLabels] = useState([]);
    const [dailySpending, setDailySpending] = useState([]);
    const [monthlyLabels, setMonthlyLabels] = useState([]);
    const [monthlySpending, setMonthlySpending] = useState([]);
    const [topCategories, setTopCategories] = useState({});
    const [paymentMethodData, setPaymentMethodData] = useState({});
    const [recurringData, setRecurringData] = useState({});

    useEffect(() => {
        const fetchAndCalculate = async () => {
            const { data, error } = await supabase.auth.getUser();
            const user = data?.user;
            if (!user) return;
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (expensesData) calculateTotals(expensesData);
        };
        fetchAndCalculate();
    }, []);

    const calculateTotals = (expensesData) => {
        const categories = {};
        expensesData.forEach(exp => {
            const cat = exp.category || 'Uncategorized';
            categories[cat] = (categories[cat] || 0) + parseFloat(exp.amount);
        });
        setCategoryData(categories);

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

        const now = new Date();
        const year = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const months = Array.from({ length: currentMonth }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        const monthly = months.map(m =>
            expensesData.filter(exp => exp.created_at.startsWith(m))
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
        );
        setMonthlyLabels(months);
        setMonthlySpending(monthly);

        const sortedCats = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        setTopCategories(Object.fromEntries(sortedCats));

        const paymentMethods = {};
        expensesData.forEach(exp => {
            const mode = exp.mode_of_payment || 'Other';
            paymentMethods[mode] = (paymentMethods[mode] || 0) + parseFloat(exp.amount);
        });
        setPaymentMethodData(paymentMethods);

        const recurring = { Recurring: 0, 'One-Time': 0 };
        expensesData.forEach(exp => {
            if (exp.is_recurring) recurring['Recurring'] += parseFloat(exp.amount);
            else recurring['One-Time'] += parseFloat(exp.amount);
        });
        setRecurringData(recurring);
    };

    return (
        <div className="container-fluid py-4">
            <h1 className="mb-4 text-center text-primary">Expense Analytics</h1>
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Monthly Spending Trend</h5>
                            <div style={{ width: '100%', height: '300px' }}>
                                <Line
                                    data={{
                                        labels: monthlyLabels,
                                        datasets: [{
                                            label: 'Monthly Spending',
                                            data: monthlySpending,
                                            borderColor: 'rgba(54, 162, 235, 1)',
                                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Last 7 Days Spending</h5>
                            <div style={{ width: '100%', height: '300px' }}>
                                <Bar
                                    data={{
                                        labels: dailyLabels,
                                        datasets: [{
                                            label: 'Daily Spending',
                                            data: dailySpending,
                                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Category Breakdown</h5>
                            <div style={{ width: '100%', height: '250px' }}>
                                <Pie
                                    data={{
                                        labels: Object.keys(categoryData),
                                        datasets: [{
                                            data: Object.values(categoryData),
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)',
                                                'rgba(40, 167, 69, 0.6)'
                                            ],
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Top 5 Expense Categories</h5>
                            <div style={{ width: '100%', height: '250px' }}>
                                <Bar
                                    data={{
                                        labels: Object.keys(topCategories),
                                        datasets: [{
                                            label: 'Amount',
                                            data: Object.values(topCategories),
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)'
                                            ],
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Payment Method</h5>
                            <div style={{ width: '100%', height: '250px' }}>
                                <Pie
                                    data={{
                                        labels: Object.keys(paymentMethodData),
                                        datasets: [{
                                            data: Object.values(paymentMethodData),
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.6)',
                                                'rgba(54, 162, 235, 0.6)',
                                                'rgba(255, 206, 86, 0.6)',
                                                'rgba(75, 192, 192, 0.6)',
                                                'rgba(153, 102, 255, 0.6)',
                                                'rgba(255, 159, 64, 0.6)'
                                            ],
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title text-primary">Recurring vs One-Time Expenses</h5>
                            <div style={{ width: '100%', height: '250px' }}>
                                <Doughnut
                                    data={{
                                        labels: Object.keys(recurringData),
                                        datasets: [{
                                            data: Object.values(recurringData),
                                            backgroundColor: [
                                                'rgba(255, 205, 86, 0.6)',
                                                'rgba(54, 162, 235, 0.6)'
                                            ],
                                        }],
                                    }}
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}