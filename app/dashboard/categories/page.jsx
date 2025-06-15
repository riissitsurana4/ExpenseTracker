'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import '../../../styles/custom-bootstrap.scss';
import BootstrapClient from '../../../components/BootstrapClient';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [newSubcategoryParentId, setNewSubcategoryParentId] = useState(null);
    const [user, setUser] = useState(null);
    const [openCategoryId, setOpenCategoryId] = useState(null);
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
        if (error) {
            console.error('Error fetching categories:', error);
        } else {
            setCategories(data);
        }
    }

    async function addCategory() {
        if (!user || !user.id || !newCategoryName.trim()) {
            console.error('Missing user or user.id or newCategoryName');
            return;
        }
        const response = await supabase
            .from('categories')
            .insert([{ name: newCategoryName, user_id: user.id }])
            .select();
        if (response.error || !response.data) {
            console.error('Error adding category:', response.error);
            if (response.data) console.log('Response data:', response.data);
        } else {
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
            console.error('Parent category not found');
            return;
        }
        const { error } = await supabase
            .from("subcategories")
            .insert([{ name: newSubcategoryName.trim(), category_id: newSubcategoryParentId, user_id: user.id }]);
        if (error) {
            console.error("Error adding subcategory:", error);
            return;
        }
        setNewSubcategoryName("");
        setNewSubcategoryParentId(null);
        fetchCategories();
    }

    async function updateCategory(id, newName, oldName) {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('categories')
            .update({ name: newName.trim() })
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) {
            console.error('Error updating category:', error);
            return;
        }
        // Update all expenses with the old category name
        await supabase
            .from('expenses')
            .update({ category: newName.trim() })
            .eq('category', oldName)
            .eq('user_id', user.id);
        setEditingCategoryId(null);
        setEditCategoryName("");
        fetchCategories();
    }

    async function updateSubcategory(id, newName) {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('subcategories')
            .update({ name: newName.trim() })
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) {
            console.error('Error updating subcategory:', error);
        }
        setEditingSubcategoryId(null);
        fetchCategories();
    }

    async function deleteCategory(id) {
        if (!user) return;
        const { error: subError } = await supabase
            .from("subcategories")
            .delete()
            .eq("category_id", id)
            .eq("user_id", user.id);
        if (subError) {
            console.error("Error deleting subcategories:", subError);
            return;
        }
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) {
            console.error('Error deleting category:', error);
            return;
        }
        fetchCategories();
    }
    async function deleteSubcategory(id) {
        if (!user) return;
        const { error } = await supabase
            .from("subcategories")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            console.error("Error deleting subcategory:", error);
            return;
        }
        fetchCategories();
    }

    async function fetchSubcategoryTotals() {
        if (!user) return;
        const { data, error } = await supabase
            .from('expenses')
            .select('subcategory, amount')
            .eq('user_id', user.id);
        if (error || !Array.isArray(data)) {
            console.error('Error fetching expenses:', error, data);
            return;
        }
        const totals = {};
        data.forEach(exp => {
            if (!totals[exp.subcategory]) totals[exp.subcategory] = 0;
            totals[exp.subcategory] += exp.amount;
        });
        setSubcategoryTotals(totals);
    }

    async function fetchCategoryTotals() {
        if (!user) return;
        const { data, error } = await supabase
            .from('expenses')
            .select('category, amount')
            .eq('user_id', user.id);
        if (error || !Array.isArray(data)) {
            console.error('Error fetching category totals:', error, data);
            return;
        }
        const totals = {};
        data.forEach(exp => {
            if (!totals[exp.category]) totals[exp.category] = 0;
            totals[exp.category] += exp.amount;
        });
        setCategoryTotals(totals);
    }

    return (
        <>
            <BootstrapClient />
            <div className="container-fluid mt-3 text-center position-relative">
                <h2 className="mb-4 text-primary">Categories</h2>
                <div className="d-flex justify-content-end flex-wrap gap-2" style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, width: '100%', paddingRight: 0 }}>
                    <button className="btn btn-success flex-fill" style={{ minWidth: 120, fontSize: '0.95rem' }} onClick={() => setShowAddCategoryModal(true)}>
                        <i className="bi bi-plus-lg me-1"></i> Add Category
                    </button>
                    <button className="btn btn-primary flex-fill" style={{ minWidth: 120, fontSize: '0.95rem' }} onClick={() => setShowAddSubcategoryModal(true)}>
                        <i className="bi bi-plus-lg me-1"></i> Add Subcategory
                    </button>
                </div>
                <div className="row justify-content-center">
                    {categories.map(category => (
                        <div key={category.id} className="col-md-5 mx-2 mb-4">
                            <div className="mb-3 d-flex align-items-center justify-content-between bg-light rounded p-3 shadow-sm">
                                <div className="d-flex align-items-center">
                                    <strong className="text-primary me-3" style={{ fontSize: '1.94rem' }}>
                                        {category.name}
                                        <span className="fw-bold ms-2" style={{ fontSize: '1.16rem' }}>
                                            ₹{categoryTotals[category.name] ? categoryTotals[category.name].toFixed(2) : '0.00'}
                                        </span>
                                    </strong>
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <span style={{ cursor: 'pointer' }} onClick={() => setOpenCategoryId(openCategoryId === category.id ? null : category.id)} className="ms-2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setEditingCategoryId(category.id)} title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCategory(category.id)} title="Delete">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            {openCategoryId === category.id && category.subcategories && category.subcategories.length > 0 && (
                                <ul className="list-group list-group-flush mt-2">
                                    {category.subcategories.map(sub => (
                                        <li key={sub.id} className="list-group-item border-0 text-secondary text-start d-flex justify-content-between align-items-center bg-white rounded mb-2 shadow-sm">
                                            <span>{sub.name}</span>
                                            <span className="fw-bold">₹{subcategoryTotals[sub.name] ? subcategoryTotals[sub.name].toFixed(2) : '0.00'}</span>
                                            <span>
                                                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setEditingSubcategoryId(sub.id)} title="Edit">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteSubcategory(sub.id)} title="Delete">
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
        </>
    );
}