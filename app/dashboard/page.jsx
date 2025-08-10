'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import BootstrapClient from '../../components/BootstrapClient';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Dashboard() {
	const { data: session, status } = useSession();
	const user = session?.user;
	const [expenses, setExpenses] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [editExpense, setEditExpense] = useState(null);
	const [title, setTitle] = useState('');
	const [amount, setAmount] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [subcategory, setSubcategory] = useState("");
	const [totals, setTotals] = useState({ daily: 0, monthly: 0, cy: 0 });
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [createdAt, setCreatedAt] = useState('');
	const [userCurrency, setUserCurrency] = useState('INR');
	const [recurringType, setRecurringType] = useState('');
	const [modeOfPayment, setModeOfPayment] = useState('');
	const [allSubcategories, setAllSubcategories] = useState([]);
	const [filteredSubcategories, setFilteredSubcategories] = useState([]);
	const [isRecurring, setIsRecurring] = useState('no');
	const [recurringExpenses, setRecurringExpenses] = useState([]);
	const [showRecurringModal, setShowRecurringModal] = useState(false);
	

	useEffect(() => {
		if (!user) return;
		const fetchCurrency = async () => {
			const res = await fetch('/api/user/currency');
			const data = await res.json();
			setUserCurrency(data?.currency || 'INR');
		};
		fetchCurrency();
	}, [user]);

	const currencySign = (cur) => {
		const symbols = {
			INR: '₹',
			USD: '$',
			EUR: '€',
			GBP: '£',
			JPY: '¥',
			AUD: 'A$',
			CAD: 'C$',
			CNY: '¥'
		};
		return symbols[cur] || '$';
	};

	useEffect(() => {
		if (user) {
			fetchExpenses();
			fetchCategories();
			fetchAllSubcategories();
			fetchRecurringExpenses(); 
		}
		if (showModal) {
			document.body.classList.add('modal-open');
		} else {
			document.body.classList.remove('modal-open');
		}
		
	}, [showModal, user]);	

	useEffect(() => {
		if (!user) return;
		const insertPresetsifNeeded = async () => {
			await fetch("/api/categories/preset", { method: "POST", body: JSON.stringify({ email: user.email }) });
		};
		insertPresetsifNeeded();
	}, [user]);

	const fetchExpenses = async () => {
		if (!user) return;
		try {
			const res = await fetch(`/api/expenses?email=${user.email}`);
			if (!res.ok) {
				setExpenses([]);
				return;
			}
			const expensesData = await res.json();
			setExpenses(expensesData);
			calculateTotals(expensesData);
		} catch (error) {
			setExpenses([]);
		}
	};

	const fetchCategories = async () => {
		if (!user) return;
		try {
			const res = await fetch(`/api/categories?email=${user.email}`);
			if (!res.ok) {
				setCategories([]);
				return;
			}
			const categoryData = await res.json();
			setCategories(Array.isArray(categoryData) ? categoryData : []);
		} catch (error) {
			setCategories([]);
		}
	};

	useEffect(() => {
		if (categoryId) {
			const selectedCategory = categories.find(cat => cat.id === categoryId);
			if (selectedCategory) {
				const fetchSubcategories = async (categoryId) => {
					const res = await fetch(`/api/subcategories?categoryId=${categoryId}`);
					const data = await res.json();
					setSubcategories(data || []);
					if (!editExpense) setSubcategory("");
				};
				fetchSubcategories(selectedCategory.id);
			}
		} else {
			setSubcategories([]);
			setSubcategory("");
		}
		
	}, [categoryId, categories]);

	useEffect(() => {
		if (categoryId) {
			const filtered = allSubcategories.filter(sub => sub.category_id === categoryId);
			setFilteredSubcategories(filtered);
			if (!filtered.some(sub => sub.name === subcategory)) {
				setSubcategory('');
			}
		} else {
			setFilteredSubcategories([]);
			setSubcategory('');
		}
	}, [categoryId, allSubcategories, subcategory]);

	const calculateTotals = (expensesData) => {
		const today = new Date().toISOString().slice(0, 10);
		const thisMonth = new Date().toISOString().slice(0, 7);
		const now = new Date();
		const cyStart = new Date(now.getFullYear(), 0, 1);
		const cyEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
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
	};

	const openModal = (expense = null) => {
		setEditExpense(expense);
		if (expense) {
			setTitle(expense.title || '');
			setAmount(expense.amount || '');
			setCategoryId(expense.category_id || '');
			setSubcategory(expense.subcategory || "");
			setCreatedAt(expense.created_at ? expense.created_at.slice(0, 10) : '');
			setRecurringType(expense.recurring_type || '');
			setModeOfPayment(expense.mode_of_payment || "");
			setIsRecurring(expense.recurring_type ? 'yes' : 'no');
		} else {
			setTitle('');
			setAmount('');
			setCategoryId('');
			setSubcategory("");
			setCreatedAt(new Date().toISOString().slice(0, 10));
			setRecurringType('');
			setModeOfPayment("");
			setIsRecurring('no');
		}
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setTitle('');
		setAmount('');
		setCategoryId('');
		setSubcategory("");
		setEditExpense(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!title.trim() || !amount || isNaN(parseFloat(amount))) {
			alert('Please enter a valid title and amount.');
			return;
		}
		if (!user) {
			alert('User not found. Please log in again.');
			return;
		}
		let result;
		if (editExpense) {
			result = await fetch(`/api/expenses/${editExpense.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					amount: parseFloat(amount),
					category_id: categoryId,
					subcategory,
					created_at: createdAt,
					recurring_type: recurringType,
					is_recurring: !!recurringType,
					mode_of_payment: modeOfPayment,
					user_id: user.id,
					user_email: user.email, // Add this line
				}),
			});
		} else {
			result = await fetch("/api/expenses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					amount: parseFloat(amount),
					category_id: categoryId,
					subcategory,
					created_at: createdAt,
					user_id: user.id,
					user_email: user.email, // Add this line
					recurring_type: recurringType,
					is_recurring: !!recurringType,
					mode_of_payment: modeOfPayment,
				}),
			});
		}
		if (result.error) {
			alert('Error saving expense: ' + result.error.message);
			return;
		}
		closeModal();
		fetchExpenses();
	};

	const handleDelete = async (id) => {
		await fetch(`/api/expenses/${id}`, { method: "DELETE" });
		fetchExpenses();

	};

	const fetchAllSubcategories = async () => {
		if (!user) return;
		const res = await fetch(`/api/subcategories/all?email=${user.email}`);
		const data = await res.json();
		setAllSubcategories(data || []);
	};

	const fetchRecurringExpenses = async () => {
		if (!user) return;
		try {
			const res = await fetch(`/api/expenses/recurring?email=${user.email}`);
			if (!res.ok) {
				setRecurringExpenses([]);
				return;
			}
			const data = await res.json();
			setRecurringExpenses(Array.isArray(data) ? data : []);
		} catch (error) {
			setRecurringExpenses([]);
		}
	};

	const processRecurringExpenses = async () => {
		if (!user) return;
		try {
			const res = await fetch('/api/expenses/recurring', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: user.email })
			});
			
			if (res.ok) {
				const result = await res.json();
				alert(result.message);
				fetchExpenses(); // Refresh expenses list
				fetchRecurringExpenses(); // Refresh recurring expenses
			} else {
				const error = await res.json();
				alert('Error: ' + error.error);
			}
		} catch (error) {
			alert('Error processing recurring expenses');
		}
	};

	const deleteRecurringExpense = async (id) => {
		if (!confirm('Are you sure you want to delete this recurring expense? This will not affect already created instances.')) {
			return;
		}
		
		try {
			const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
			if (res.ok) {
				fetchRecurringExpenses();
				alert('Recurring expense deleted successfully');
			} else {
				alert('Error deleting recurring expense');
			}
		} catch (error) {
			alert('Error deleting recurring expense');
		}
	};

	useEffect(() => {
		fetchAllSubcategories();
	}, [user]);

	return (
		<>
			<BootstrapClient />
			<div className="container-fluid mt-4">
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
						<button className="btn btn-primary" onClick={() => openModal(null)}>
							<i className="bi bi-plus"></i> Add Expense
						</button>
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
							expenses.slice(0, 8).map((exp) => (
								<div key={exp.id} className="col-md-3 mb-2">
									<div className="card h-55">
										<div className="card-body position-relative">
											<div className="position-absolute top-0 end-0 mt-2 me-2 d-flex gap-2">
												<button className="btn btn-outline-primary btn-sm" onClick={() => openModal(exp)} title="Edit">
													<i className="bi bi-pencil"></i>
												</button>
												<button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(exp.id)} title="Delete">
													<i className="bi bi-trash"></i>
												</button>
											</div>
											<h5 className="card-title">{exp.title}</h5>
											<p className="card-text expense-info">
												{currencySign(userCurrency)}{Number(exp.amount).toFixed(2)}
												<span className="badge bg-secondary ms-2">{categories.find(cat => cat.id === exp.category_id)?.name || 'Unknown'}</span>
											</p>
										</div>
									</div>
								</div>
							))
						)}
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
													value={categoryId}
													onChange={e => setCategoryId(e.target.value)}
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
													disabled={!categoryId || filteredSubcategories.length === 0}
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
												<label htmlFor="recurring" className="form-label">Recurring</label>
												<select
													className="form-select"
													id="recurring"
													value={isRecurring}
													onChange={e => setIsRecurring(e.target.value)}
													required
												>
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
