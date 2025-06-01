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

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        fetchCategories();
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
        // Check if parent category exists
        const { data: parentCategory, error: parentError } = await supabase
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

    async function updateCategory(id, newName) {
        if (!newName.trim()) return;
        const { error } = await supabase
            .from('categories')
            .update({ name: newName.trim() })
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) {
            console.error('Error updating category:', error);
        }
        setEditingCategoryId(null);
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
    return (
        <>
            <BootstrapClient />
            <div className="container-fluid">
                <h1 className="mb-4 text-primary text-center">Categories</h1>
                <div className="row mb-4">
                    <div className="col-md-6 card border-0">
                        <h3 className="text-secondary">Add Category</h3>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="New Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={addCategory}>Add Category</button>
                    </div>
                    <div className="col-md-6 card border-0">
                        <h3 className="text-secondary">Add Subcategory</h3>
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="New Subcategory Name"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                        />
                        <select
                            className="form-select mb-2"
                            value={newSubcategoryParentId ?? ''}
                            onChange={(e) => setNewSubcategoryParentId(e.target.value)}
                        >
                            <option value="">Select Parent Category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <button className="btn btn-primary" onClick={addSubcategory}>Add Subcategory</button>

                    </div>
                </div>

            </div>
        </>
    );
}
