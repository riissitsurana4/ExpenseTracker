'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import BootstrapClient from '../../../components/BootstrapClient';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [newSubcategoryParentId, setNewSubcategoryParentId] = useState(null);
    const [openCategoryIds, setOpenCategoryIds] = useState([]);
    const [subcategoryTotals, setSubcategoryTotals] = useState({});
    const [categoryTotals, setCategoryTotals] = useState({});
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
    const [addCategoryName, setAddCategoryName] = useState("");
    const [addSubcategoryName, setAddSubcategoryName] = useState("");
    const [addSubcategoryParentId, setAddSubcategoryParentId] = useState("");
    const [editCategoryName, setEditCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { data: session, status } = useSession();
    
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            setLoading(true);
            setError('');
            Promise.all([fetchCategories(), fetchTotals()])
                .finally(() => setLoading(false));
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [session, status]);

    async function fetchCategories() {
        if (!session?.user?.email) return;
        try {
            const response = await fetch(`/api/categories?email=${encodeURIComponent(session.user.email)}`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            setError('Failed to load categories');
        }
    }

    async function addCategory() {
        if (!session?.user?.email || !addCategoryName.trim()) return;
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: addCategoryName.trim() })
            });
            if (!response.ok) throw new Error('Failed to add category');
            const newCategory = await response.json();
            setCategories([...categories, newCategory]);
            setAddCategoryName("");
            setShowAddCategoryModal(false);
        } catch (error) {
            setError('Failed to add category');
        }
    }

    async function addSubcategory() {
        if (!session?.user?.email || !addSubcategoryName.trim() || !addSubcategoryParentId) return;
        try {
            const response = await fetch('/api/subcategories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: addSubcategoryName.trim(),
                    category_id: addSubcategoryParentId
                })
            });
            if (!response.ok) throw new Error('Failed to add subcategory');
            setAddSubcategoryName("");
            setAddSubcategoryParentId("");
            setShowAddSubcategoryModal(false);
            fetchCategories();
        } catch (error) {
            setError('Failed to add subcategory');
        }
    }

    async function updateCategory(id, newName) {
        if (!newName.trim()) return;
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!response.ok) throw new Error('Failed to update category');
            setEditingCategoryId(null);
            setEditCategoryName("");
            fetchCategories();
            fetchTotals();
        } catch (error) {
            setError('Failed to update category');
        }
    }

    async function updateSubcategory(id, newName) {
        if (!newName.trim()) return;
        try {
            const response = await fetch(`/api/subcategories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!response.ok) throw new Error('Failed to update subcategory');
            setEditingSubcategoryId(null);
            setNewSubcategoryName("");
            fetchCategories();
            fetchTotals();
        } catch (error) {
            setError('Failed to update subcategory');
        }
    }

    async function deleteCategory(id) {
        if (!session?.user?.email) return;
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete category');
            fetchCategories();
            fetchTotals();
        } catch (error) {
            setError('Failed to delete category');
        }
    }
    
    async function deleteSubcategory(id) {
        if (!session?.user?.email) return;
        try {
            const response = await fetch(`/api/subcategories/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete subcategory');
            fetchCategories();
            fetchTotals();
        } catch (error) {
            setError('Failed to delete subcategory');
        }
    }

    async function fetchTotals() {
        if (!session?.user?.email) return;
        try {
            const response = await fetch(`/api/expenses/totals?email=${encodeURIComponent(session.user.email)}`);
            if (!response.ok) throw new Error('Failed to fetch totals');
            const data = await response.json();
            setSubcategoryTotals(data.subcategoryTotals || {});
            setCategoryTotals(data.categoryTotals || {});
        } catch (error) {
            setError('Failed to load expense totals');
        }
    }

    return (
        <>
            <BootstrapClient />
            {status === 'loading' && (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            {status === 'unauthenticated' && (
                <div className="container-fluid">
                    <div className="alert alert-warning text-center">
                        Please sign in to manage your categories.
                    </div>
                </div>
            )}
            {status === 'authenticated' && (
            <div className="container-fluid mt-3 text-center position-relative px-1 px-sm-3">
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                )}
                {loading && (
                    <div className="d-flex justify-content-center mb-3">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}
                <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between mb-2 gap-2 gap-sm-0" style={{ position: 'relative' }}>
                    <h2 className="mb-0 text-primary w-100 text-center fw-bold" style={{ fontSize: 'clamp(1.3rem, 5vw, 2.2rem)', letterSpacing: '0.5px', textShadow: '0 1px 2px #e3e3e3' }}>Categories</h2>
                    <div className="d-flex flex-row flex-wrap gap-2 mt-2 mt-sm-0 justify-content-center justify-content-sm-end w-100 w-sm-auto" style={{ zIndex: 10 }}>
                        <button className="btn btn-outline-primary flex-shrink-0 d-flex align-items-center justify-content-center shadow-sm category-action-btn" style={{ minWidth: 120, fontSize: '1rem', padding: '0.45rem 0.9rem', borderRadius: 8, transition: 'background 0.2s, color 0.2s' }} onClick={() => setShowAddCategoryModal(true)}>
                            <i className="bi bi-plus-lg me-1"></i> Add Category
                        </button>
                        <button className="btn btn-outline-primary flex-shrink-0 d-flex align-items-center justify-content-center shadow-sm category-action-btn" style={{ minWidth: 140, fontSize: '1rem', padding: '0.45rem 0.9rem', borderRadius: 8, transition: 'background 0.2s, color 0.2s' }} onClick={() => setShowAddSubcategoryModal(true)}>
                            <i className="bi bi-plus-lg me-1"></i> Add Subcategory
                        </button>
                    </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mb-3" style={{ marginTop: '2.5rem' }}>
                    <button
                        className={`btn btn-outline-primary btn-sm shadow-sm`}
                        style={{ fontSize: '0.95rem', padding: '0.32rem 0.8rem', borderRadius: 7, transition: 'background 0.2s, color 0.2s' }}
                        onClick={() => {
                            if (openCategoryIds.length === categories.length) {
                                setOpenCategoryIds([]);
                            } else {
                                setOpenCategoryIds(categories.map(cat => cat.id));
                            }
                        }}
                    >
                        {openCategoryIds.length === categories.length ? 'Collapse All' : 'Open All'}
                    </button>
                </div>
                <div className="row g-3 g-sm-4">
                    {categories.map(category => (
                        <div key={category.id} className="col-12 col-sm-10 col-md-5 mb-3 px-1 px-sm-2 mx-auto">
                            <div className="mb-2 d-flex align-items-center justify-content-between bg-white rounded-4 p-3 shadow category-card flex-wrap flex-column flex-sm-row text-start position-relative border border-1 border-light" style={{ minHeight: 70, transition: 'box-shadow 0.2s', boxShadow: '0 2px 10px 0 rgba(0,0,0,0.06)' }}>
                                <div className="d-flex align-items-center flex-wrap flex-column flex-sm-row w-100">
                                    <strong className="text-primary me-2 mb-2 mb-sm-0 fw-semibold" style={{ fontSize: '1.25rem', letterSpacing: '0.2px' }}>
                                        <span className="category-name" style={{ textShadow: '0 1px 2px #f3f3f3' }}>{category.name}</span>
                                        <span className="fw-bold ms-2 text-success" style={{ fontSize: '1.05rem', textShadow: '0 1px 2px #e3ffe3' }}>
                                            ₹{categoryTotals[category.name] ? categoryTotals[category.name].toFixed(2) : '0.00'}
                                        </span>
                                    </strong>
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <span style={{ cursor: 'pointer', marginLeft: 8, color: '#0d6efd', opacity: 0.8 }} onClick={() => {
                                            setOpenCategoryIds(ids => ids.includes(category.id)
                                                ? ids.filter(id => id !== category.id)
                                                : [...ids, category.id]);
                                        }} className="ms-2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 mt-sm-0 d-flex gap-2">
                                    <button className="btn btn-sm btn-outline-secondary shadow-sm" style={{ borderRadius: 7 }} onClick={() => setEditingCategoryId(category.id)} title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger shadow-sm" style={{ borderRadius: 7 }} onClick={() => deleteCategory(category.id)} title="Delete">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            {openCategoryIds.includes(category.id) && category.subcategories && category.subcategories.length > 0 && (
                                <ul className="list-group list-group-flush mt-2">
                                    {category.subcategories.map(sub => (
                                        <li key={sub.id} className="list-group-item border-0 text-secondary d-flex justify-content-between align-items-center bg-light rounded-3 mb-2 shadow-sm px-3 py-2 subcategory-card" style={{ fontSize: '1.01rem', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}>
                                            <span className="fw-semibold text-dark">{sub.name}</span>
                                            <span className="fw-bold text-success">₹{subcategoryTotals[sub.name] ? subcategoryTotals[sub.name].toFixed(2) : '0.00'}</span>
                                            <span className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-secondary shadow-sm" style={{ borderRadius: 7 }} onClick={() => setEditingSubcategoryId(sub.id)} title="Edit">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger shadow-sm" style={{ borderRadius: 7 }} onClick={() => deleteSubcategory(sub.id)} title="Delete">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            )}
            {status === 'authenticated' && editingCategoryId && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: 350, maxWidth: '95vw', background: 'rgba(0,0,0,0.1)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Edit Category</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => { setEditingCategoryId(null); setEditCategoryName(""); }}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control mb-3"
                                    value={editCategoryName}
                                    onChange={e => setEditCategoryName(e.target.value)}
                                    placeholder="Category Name"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setEditingCategoryId(null); setEditCategoryName(""); }}>Cancel</button>
                                <button type="button" className="btn btn-primary" disabled={!editCategoryName.trim()} onClick={async () => {
                                    await updateCategory(editingCategoryId, editCategoryName);
                            }}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {status === 'authenticated' && editingSubcategoryId && (
                <div className="modal fade show d-block" tabIndex='-1' style={{ zIndex: 1050, display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: 350, maxWidth: '95vw' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Subcategory</h5>
                                <button type="button" className="btn-close" onClick={() => setEditingSubcategoryId(null)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={newSubcategoryName}
                                    onChange={e => setNewSubcategoryName(e.target.value)}
                                    placeholder="Subcategory Name"
                                />
                                <button className="btn btn-primary" onClick={async () => {
                                    await updateSubcategory(editingSubcategoryId, newSubcategoryName);
                                    setEditingSubcategoryId(null);
                                    setNewSubcategoryName("");
                                }}>Save</button>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingSubcategoryId(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {status === 'authenticated' && showAddCategoryModal && (
                <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}></div>
            )}
            {status === 'authenticated' && showAddCategoryModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: 350, maxWidth: '95vw' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Category</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddCategoryModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={addCategoryName}
                                    onChange={e => setAddCategoryName(e.target.value)}
                                    placeholder="Category Name"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>Cancel</button>
                                <button className="btn btn-success" disabled={!addCategoryName.trim()} onClick={async () => {
                                    await addCategory();
                            }}>Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {status === 'authenticated' && showAddSubcategoryModal && (
                <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}></div>
            )}
            {status === 'authenticated' && showAddSubcategoryModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050, display: 'block', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', minWidth: 350, maxWidth: '95vw' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Subcategory</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddSubcategoryModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <select
                                    className="form-select mb-2"
                                    value={addSubcategoryParentId}
                                    onChange={e => setAddSubcategoryParentId(e.target.value)}
                                    autoFocus
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={addSubcategoryName}
                                    onChange={e => setAddSubcategoryName(e.target.value)}
                                    placeholder="Subcategory Name"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubcategoryModal(false)}>Cancel</button>
                                <button className="btn btn-primary" disabled={!addSubcategoryName.trim() || !addSubcategoryParentId} onClick={async () => {
                                    await addSubcategory();
                            }}>Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}