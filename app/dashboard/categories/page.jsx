'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import './categories.css';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [editiing, setEditing] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true })
            .eq('user_id', user.id);
        setCategories(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;
        if (editiing && editingCategory) {
            await supabase
                .from('categories')
                .update({ name })
                .eq('id', editingCategory.id)
                .eq('user_id', user.id);
        } else {
            await supabase
                .from('categories')
                .insert({ name, user_id: user.id });
        }
        setName('');
        setEditing(false);
        setEditingCategory(null);
        fetchCategories();
    };

    const handleDelete = async (id) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;
        await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        fetchCategories();
    };

    return (
        <div className="categories-page">
            <h1>Manage Categories</h1>
            <form onSubmit={handleSubmit} className="category-form">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category Name (e.g., Food, Rent, Travel)"
                    required
                />
                <button type="submit">{editiing ? 'Update' : 'Add'}</button>
            </form>
            <ul className="category-list">
                {categories.length === 0 ? (
                    <li className="category-placeholder">No categories yet. Add your first one above!</li>
                ) : (
                    categories.map((category) => (
                        <li key={category.id} className="category-item">
                            <span className="category-icon" aria-label="category">📁</span>
                            <span className="category-name">{category.name}</span>
                            <div className="actions">
                                <button
                                    onClick={() => {
                                        setName(category.name);
                                        setEditing(true);
                                        setEditingCategory(category);
                                    }}
                                >Edit</button>
                                <button onClick={() => handleDelete(category.id)}>Delete</button>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
