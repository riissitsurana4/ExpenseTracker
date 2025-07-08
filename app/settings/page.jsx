'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const user = session?.user;

    const [loading, setLoading] = useState(true);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/loginpages');
        } else if (user) {
            setLoading(false);
            fetchCurrency();
        }
    }, [status, router, user]);

    const fetchCurrency = async () => {
        try {
            const response = await fetch('/api/user/currency');
            if (response.ok) {
                const data = await response.json();
                setCurrency(data.currency || 'INR');
            }
        } catch (error) {
            console.error("Failed to fetch currency:", error);
        }
    };

    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        setCurrency(newCurrency);
        try {
            await fetch('/api/user/currency', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currency: newCurrency }),
            });
        } catch (error) {
            console.error("Failed to update currency:", error);
        }
    };
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
                setAvatar(file);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleAvatarUpload = async () => {
        if (!avatar) {
            alert("Please select an avatar image to upload.");
            return;
        }
        const formData = new FormData();
        formData.append('avatar', avatar);

        try {
            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                setAvatarPreview(data.avatarUrl);
                alert("Avatar updated successfully!");
            } else {
                throw new Error("Failed to upload avatar");
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar. Please try again.");
        }
    };
    const handleDeleteAccount = async () => {
        if (confirmEmail !== user.email) {
            alert("Please confirm your email to delete your account.");
            return;
        }

        try {
            await fetch(`/api/settings/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });
            router.push('/login');
        } catch (error) {
            console.error("Failed to delete account:", error);
        }
    };
    
    const toggleDeleteConfirmation = () => {
        setShowDeleteConfirmation(!showDeleteConfirmation);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-5">
            <h1 className="mb-4">Settings</h1>
            <div className="card mb-4">
                <div className="card-header">
                    <h3>Currency Preferences</h3>
                </div>
                <div className="card-body">
                    <label htmlFor="currency" className="form-label">Default Currency</label>
                    <select id="currency" value={currency} onChange={handleCurrencyChange} className="form-select">
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="CNY">CNY (¥)</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <h2>Delete Account</h2>
                <p className="text-danger">Warning: This action is irreversible. Please be certain before proceeding.</p>
                <button className="btn btn-danger" onClick={toggleDeleteConfirmation}>
                    {showDeleteConfirmation ? 'Cancel' : 'Delete Account'}
                </button>

                {showDeleteConfirmation && (
                    <div className="mt-3">
                        <p>Please confirm your email to delete your account.</p>
                        <input
                            type="email"
                            className="form-control"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            placeholder="Confirm your email"
                        />
                        <button className="btn btn-danger mt-2" onClick={handleDeleteAccount}>Confirm Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
}


