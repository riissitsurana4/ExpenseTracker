'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import BootstrapClient from '../../../components/BootstrapClient';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [newSubcategoryParentId, setNewSubcategoryParentId] = useState(null);
    const [user, setUser] = useState(null);
    const [openCategoryIds, setOpenCategoryIds] = useState([]);
    const [subcategoryTotals, setSubcategoryTotals] = useState({});
    const [categoryTotals, setCategoryTotals] = useState({});
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
    const [addCategoryName, setAddCategoryName] = useState("");
    const [addSubcategoryName, setAddSubcategoryName] = useState("");
    const [addSubcategoryParentId, setAddSubcategoryParentId] = useState("");
    const [editCategoryName, setEditCategoryName] = useState("");

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        fetchCategories();
        fetchSubcategoryTotals();
        fetchCategoryTotals();
    }, [user]);

    async function fetchCategories() {
        if (!user) return;
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, subcategories(id, name)')
            .eq('user_id', user.id)
            .order("name", { ascending: true });
        if (!error) {
            setCategories(data);
        }
    }

    async function addCategory() {
        if (!user || !user.id || !newCategoryName.trim()) {
            return;
        }
        const response = await supabase
            .from('categories')
            .insert([{ name: newCategoryName, user_id: user.id }])
            .select();
        if (!response.error && response.data) {
            setCategories([...categories, ...response.data]);
            setNewCategoryName("");
        }
    }

    async function addSubcategory() {
        if (!user || !newSubcategoryName.trim() || !newSubcategoryParentId) return;
        const { data: parentCategory } = await supabase
            .from('categories')
            .select('id')
            .eq('id', newSubcategoryParentId)
            .eq('user_id', user.id)
            .single();
        if (!parentCategory) {
            return;
        }
        const { error } = await supabase
            .from("subcategories")
            .insert([{ name: newSubcategoryName.trim(), category_id: newSubcategoryParentId, user_id: user.id }]);
        if (!error) {
            setNewSubcategoryName("");
            setNewSubcategoryParentId(null);
            fetchCategories();
        }
    }

    async function updateCategory(id, newName, oldName) {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('categories')
            .update({ name: newName.trim() })
            .eq('id', id)
            .eq('user_id', user.id);
        if (!error) {
            await supabase
                .from('expenses')
                .update({ category: newName.trim() })
                .eq('category', oldName)
                .eq('user_id', user.id);
            setEditingCategoryId(null);
            setEditCategoryName("");
            fetchCategories();
        }
    }

    async function updateSubcategory(id, newName) {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('subcategories')
            .update({ name: newName.trim() })
            .eq('id', id)
            .eq('user_id', user.id);
        if (!error) {
            setEditingSubcategoryId(null);
            fetchCategories();
        }
    }

    async function deleteCategory(id) {
        if (!user) return;
        const { error: subError } = await supabase
            .from("subcategories")
            .delete()
            .eq("category_id", id)
            .eq("user_id", user.id);
        if (subError) {
            return;
        }
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (!error) {
            fetchCategories();
        }
    }
    async function deleteSubcategory(id) {
        if (!user) return;
        const { error } = await supabase
            .from("subcategories")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (!error) {
            fetchCategories();
        }
    }

    async function fetchSubcategoryTotals() {
        if (!user) return;
        const { data, error } = await supabase
            .from('expenses')
            .select('subcategory, amount')
            .eq('user_id', user.id);
        if (!error && Array.isArray(data)) {
            const totals = {};
            data.forEach(exp => {
                if (!totals[exp.subcategory]) totals[exp.subcategory] = 0;
                totals[exp.subcategory] += exp.amount;
            });
            setSubcategoryTotals(totals);
        }
    }

    async function fetchCategoryTotals() {
        if (!user) return;
        const { data, error } = await supabase
            .from('expenses')
            .select('category_id, amount, categories(name)')
            .eq('user_id', user.id);
        if (!error && Array.isArray(data)) {
            const totals = {};
            data.forEach(exp => {
                const catName = exp.categories?.name || 'Unknown';
                if (!totals[catName]) totals[catName] = 0;
                totals[catName] += exp.amount;
            });
            setCategoryTotals(totals);
        }
    }

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid mt-3 text-center position-relative px-1 px-sm-3">
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
            {editingCategoryId && (
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
                                    const oldName = categories.find(cat => cat.id === editingCategoryId)?.name;
                                    await updateCategory(editingCategoryId, editCategoryName, oldName);
                            }}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {editingSubcategoryId && (
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
            {showAddCategoryModal && (
                <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}></div>
            )}
            {showAddCategoryModal && (
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
                                    await addCategory(addCategoryName);
                                    setAddCategoryName("");
                                    setShowAddCategoryModal(false);
                            }}>Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showAddSubcategoryModal && (
                <div className="modal-backdrop fade show" style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}></div>
            )}
            {showAddSubcategoryModal && (
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
                                    await addSubcategory(addSubcategoryName, addSubcategoryParentId);
                                    setAddSubcategoryName("");
                                    setAddSubcategoryParentId("");
                                    setShowAddSubcategoryModal(false);
                            }}>Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Add hover effect for action buttons and cards */}
            <style jsx global>{`
.category-action-btn:hover, .btn-outline-primary:hover, .btn-outline-secondary:hover, .btn-outline-danger:hover {
    background: #eaf4ff !important;
    color: #0d6efd !important;
    border-color: #b6d4fe !important;
}
.category-card:hover {
    box-shadow: 0 4px 18px 0 rgba(13,110,253,0.10);
    border-color: #b6d4fe;
}
.subcategory-card:hover {
    box-shadow: 0 2px 8px 0 rgba(25,135,84,0.10);
    background: #f6fff6 !important;
}
`}</style>
        </>
    );
}