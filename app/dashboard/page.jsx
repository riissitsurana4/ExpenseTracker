'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Chart, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
Chart.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement);
import '../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../components/BootstrapClient';
import { presetcategories } from '../../components/presets.jsx'
import { AreaChartIcon } from 'lucide-react';

export default function Dashboard() {
	const [expenses, setExpenses] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [editExpense, setEditExpense] = useState(null);
	const [title, setTitle] = useState('');
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState('');
	const [subcategory, setSubcategory] = useState("");
	const [description, setDescription] = useState("");
	const [totals, setTotals] = useState({ daily: 0, monthly: 0 });
	const [categoryData, setCategoryData] = useState({});
	const [dailyLabels, setDailyLabels] = useState([]);
	const [dailySpending, setDailySpending] = useState([]);
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [createdAt, setCreatedAt] = useState('');
	const [userCurrency, setUserCurrency] = useState('INR');
	const [recurringType, setRecurringType] = useState('');
	const [modeOfPayment, setModeOfPayment] = useState('');
	const [monthlyLabels, setMonthlyLabels] = useState([]);
	const [monthlySpending, setMonthlySpending] = useState([]);
	const [topCategories, setTopCategories] = useState([]);
	const [paymentMethodData, setPaymentMethodData] = useState([]);
	const [recurringData, setRecurringData] = useState([]);

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
	useEffect(() => {
		fetchExpenses();
		fetchCategories();
		if (showModal) {
			document.body.classList.add('modal-open');
		} else {
			document.body.classList.remove('modal-open');
		}
	}, [showModal]);

	useEffect(() => {
		const insertPresetsifNeeded = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			for (const category of presetcategories) {
				// Try upsert
				const { data: insertedCategories, error: catError } = await supabase
					.from("categories")
					.upsert(
						{ user_id: user.id, name: category.name },
						{ onConflict: ['user_id', 'name'], ignoreDuplicates: true }
					)
					.select();

				let insertedCategory = insertedCategories && insertedCategories[0];

				if (catError) {
					console.error("Error inserting category:", catError);
					continue;
				}

				// If no row returned, fetch the category (it already exists)
				if (!insertedCategory) {
					const { data: existingCat, error: fetchCatError } = await supabase
						.from("categories")
						.select("*")
						.eq("user_id", user.id)
						.eq("name", category.name)
						.single();
					if (fetchCatError || !existingCat) {
						console.error("Could not fetch existing category after upsert:", fetchCatError);
						continue;
					}
					insertedCategory = existingCat;
				}

				// Insert subcategories only if any exist
				if (category.subcategories.length > 0) {
					const subcatInserts = category.subcategories.map(name => ({
						name,
						category_id: insertedCategory.id,
						user_id: user.id
					}));

					const { data: subcatData, error: subcatError, status, statusText } = await supabase
						.from("subcategories")
						.upsert(
							subcatInserts,
							{ onConflict: ['category_id', 'name'], ignoreDuplicates: true }
						);


				}
			}

			// After all inserts, update user flag to true
			await supabase
				.from("users")
				.update({ has_presets: true })
				.eq("id", user.id);
		};
		insertPresetsifNeeded();
	}, []);

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
					if (!editExpense) setSubcategory(""); // <-- only reset on add, not edit
				};
				fetchSubcategories(selectedCategory.id);
			}
		} else {
			setSubcategories([]);
			setSubcategory("");
		}
	}, [category, categories]);

	const calculateTotals = (expensesData) => {
		const today = new Date().toISOString().slice(0, 10);
		const thisMonth = new Date().toISOString().slice(0, 7);
		const now = new Date();
		const cyStart = new Date(now.getFullYear(), 0, 1); // Jan 1st
		const cyEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31st
		const result = expensesData.reduce(
			(acc, curr) => {
				const date = curr.created_at.slice(0, 10);
				const month = curr.created_at.slice(0, 7);
				const amt = parseFloat(curr.amount);
				if (date === today) acc.daily += amt;
				if (month === thisMonth) acc.monthly += amt;
				const expDate = new Date(curr.created_at);
				if (expDate >= cyStart && expDate <= cyEnd) {
					acc.cy += amt;
				}
				return acc;
			},
			{ daily: 0, monthly: 0, cy: 0 }
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

		const year = now.getFullYear();
		const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
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

	const openModal = (expense = null) => {
		setEditExpense(expense);
		if (expense) {
			setTitle(expense.title || '');
			setAmount(expense.amount || '');
			setCategory(expense.category || '');
			setSubcategory(expense.subcategory || ""); // <-- set subcategory from expense
			setDescription(expense.description || "");
			setCreatedAt(expense.created_at ? expense.created_at.slice(0, 10) : '');
			setRecurringType(expense.recurring_type || '');
			setModeOfPayment(expense.mode_of_payment || ""); // <-- also load mode of payment if present
		} else {
			setTitle('');
			setAmount('');
			setCategory('');
			setSubcategory(""); // <-- reset only on add
			setDescription("");
			setCreatedAt(new Date().toISOString().slice(0, 10));
			setRecurringType('');
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
				.update({ title, amount: parseFloat(amount), category, subcategory, description, created_at: createdAt, recurring_type: recurringType, is_recurring: !!recurringType })
				.eq('id', editExpense.id);
		} else {
			result = await supabase.from('expenses').insert([
				{
					title,
					amount: parseFloat(amount),
					category,
					subcategory,
					description,
					created_at: createdAt,
					user_id: user.id,
					recurring_type: recurringType,
					is_recurring: !!recurringType
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
		await supabase.from('expenses').delete().eq('id', id); ``
		fetchExpenses();
	};

	return (
		<>
			<BootstrapClient />
			<div className="container-fluid ">
				<div className="row">
					<div className="card col-sm-3 mb-3 mb-sm-0 border-0">
						<h3 className="card-title text-primary">Today's Expenses</h3>
						<p className="card-body text-primary">{currencySign(userCurrency)}{totals.daily.toFixed(2)}</p>
					</div>
					<div className="card col-sm-4 border-0">
						<h3 className="card-title text-primary">This Month's Expenses</h3>
						<p className="card-body text-primary">{currencySign(userCurrency)}{totals.monthly.toFixed(2)}</p>
					</div>
					<div className="card col-sm-2 border-0">
						<h3 className="card-title text-primary">CY-Expenses</h3>
						<p className="card-body text-primary">{currencySign(userCurrency)}{totals.cy?.toFixed(2) ?? 0}</p>
					</div>
					<div className="card col-sm-3 border-0">
						<h2 className="text-primary">Add New Expense</h2>
						<button className="btn btn-primary" onClick={() => openModal()}>Add Expense</button>
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
							expenses.slice(0, 7).map((exp) => (
								<div key={exp.id} className="col-md-6 mb-3">
									<div className="card h-100">
										<div className="card-body">
											<h5 className="card-title">{exp.title}</h5>
											<p className="card-text expense-info">
												{currencySign(userCurrency)}{Number(exp.amount).toFixed(2)}
												<span className="badge bg-secondary ms-2">{exp.category}</span>
											</p>
											<p className="card-text text-truncate" style={{ maxWidth: 120 }}>{exp.description}</p>
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
					<h2 className="text-primary">Expense Breakdown</h2>
					<div className="row">
						<div className="col-sm-6 mb-4">
							<div className="card shadow-sm" style={{ height: '400px' }}>
								<div className="card-body d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
									<h5 className="card-title text-primary">Last 7 Days Spending</h5>
									<div style={{ width: '100%', height: '300px' }}>
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
												maintainAspectRatio: false,
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
						</div>
						<div className="col-sm-6 mb-4">
							<div className="card shadow-sm" style={{ height: '400px' }}>
								<div className="card-body d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
									<h5 className="card-title text-primary">Category Breakdown</h5>
									<div style={{ width: '100%', height: '300px' }}>
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
															'rgba(40, 167, 69, 0.6)'
														],
														borderColor: [
															'rgba(255, 99, 132, 1)',
															'rgba(54, 162, 235, 1)',
															'rgba(255, 206, 86, 1)',
															'rgba(75, 192, 192, 1)',
															'rgba(153, 102, 255, 1)',
															'rgba(255, 159, 64, 1)',
															'rgba(40, 167, 69, 1)'
														],
														borderWidth: 1,
													},
												],
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
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
						</div>
						<div className="col-md-6 mb-4">
							<div className="card shadow-sm" style={{ height: '400px' }}>
								<div className="card-body d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
									<h5 className="card-title text-primary">Monthly Spending Trend</h5>
									<div style={{ width: '100%', height: '300px' }}>
										<Line
											data={{
												labels: monthlyLabels,
												datasets: [
													{
														label: 'Monthly Spending',
														data: monthlySpending,
														borderColor: 'rgba(54, 162, 235, 1)',
														backgroundColor: 'rgba(54, 162, 235, 0.2)',
														pointBackgroundColor: 'rgba(54, 162, 235, 1)',
														pointBorderColor: '#fff',
													},
												],
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
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
						</div>
						<div className="col-md-6 mb-4">
							<div className="card shadow-sm" style={{ height: '400px' }}>
								<div className="card-body d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
									<h5 className="card-title text-primary">Top 5 Expense Categories</h5>
									<div style={{ width: '100%', height: '300px' }}>
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
													borderColor: [
														'rgba(255, 99, 132, 1)',
														'rgba(54, 162, 235, 1)',
														'rgba(255, 206, 86, 1)',
														'rgba(75, 192, 192, 1)',
														'rgba(153, 102, 255, 1)'
													],
													borderWidth: 1,
												},
												],
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
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
						</div>
						<div className="col-md-6 mb-4">
							<div className="card shadow-sm" style={{ height: '400px' }}>
								<div className="card-body d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
									<h5 className="card-title text-primary">Payment Method</h5>
									<div style={{ width: '100%', height: '300px' }}>
										<Pie
											data={{
												labels: Object.keys(paymentMethodData),
												datasets: [{
													label: 'Payment Method',
													data: Object.values(paymentMethodData),
													backgroundColor: [
														'rgba(255, 99, 132, 0.6)',
														'rgba(54, 162, 235, 0.6)',
														'rgba(255, 206, 86, 0.6)',
														'rgba(75, 192, 192, 0.6)',
														'rgba(153, 102, 255, 0.6)',
														'rgba(255, 159, 64, 0.6)'
													],
													borderColor: [
														'rgba(255, 99, 132, 1)',
														'rgba(54, 162, 235, 1)',
														'rgba(255, 206, 86, 1)',
														'rgba(75, 192, 192, 1)',
														'rgba(153, 102, 255, 1)',
														'rgba(255, 159, 64, 1)'
													],
													borderWidth: 1,
												}],
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
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
						</div>
						<div className="col-md-6 mb-4">
							<div className="card shadow-sm">
								<div className="card-body">
									<h5 className="card-title text-primary">Savings Over Time</h5>
										
									
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal for adding/editing expenses */}
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
													</>)}
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
													value={recurringType}
													onChange={e => setRecurringType(e.target.value)}
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
	);
}
