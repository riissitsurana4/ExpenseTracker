'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const steps = [
    {
        title: "Welcome to Smart Expense Hub!",
    },
    {
        title: "Select Your Avatar",
    },
    {
        title: "Select Your Currency",
    },
    {
        title: "Set your Budgets",
    },
    {
        title: "You are all set!",
    },
];

const avatars = [
    "/images/avatar1.png", "/images/avatar2.png", "/images/avatar3.png", "/images/avatar4.png",
    "/images/avatar5.png", "/images/avatar6.png", "/images/avatar7.png", "/images/avatar8.png"
];

const currencies = [
    "/images/currency1.png", "/images/currency2.png", "/images/currency3.png", "/images/currency4.png",
    "/images/currency5.png", "/images/currency6.png", "/images/currency7.png", "/images/currency8.png"
];

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            const updatedSession = await getSession();
            console.log("Updated session data:", updatedSession);
            if (!updatedSession) {
                console.log("Session invalid, redirecting to login...");
                router.push("/loginpages");
            }
        };

        if (status === 'unauthenticated') {
            console.log("Unauthenticated status detected.");
            fetchSession();
        } else {
            console.log("Session status:", status);
            console.log("Session data:", session);
        }
    }, [status, router]);

    // Debug logs for session status
    console.log("Session status:", status);
    console.log("Session data:", session);

    // Allow access if session is loading or valid
    if (status === 'loading') {
        return <p>Loading...</p>;
    }

    const nextPage = () => setPage((prevPage) => Math.min(prevPage + 1, steps.length - 1));
    const prevPage = () => setPage((prevPage) => Math.max(prevPage - 1, 0));
    const renderGrid = (items, selectedItem, onSelect) => (
        <div className="container">
            <div className="row justify-content-center">
                {items.slice(0, 4).map((item, idx) => (
                    <div className="col-3 text-center mb-4" key={idx}>
                        <img
                            src={item}
                            alt={`Item ${idx}`}
                            className={`img-fluid rounded-circle border ${selectedItem === item ? 'border-primary border-3' : 'border-light'}`}
                            style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                            onClick={() => onSelect(item)}
                        />
                    </div>
                ))}
            </div>
            <div className="row justify-content-center">
                {items.slice(4).map((item, idx) => (
                    <div className="col-3 text-center mb-4" key={idx + 4}>
                        <img
                            src={item}
                            alt={`Item ${idx + 4}`}
                            className={`img-fluid rounded-circle border ${selectedItem === item ? 'border-primary border-3' : 'border-light'}`}
                            style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                            onClick={() => onSelect(item)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="container fluid d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="text-center mt-5 mb-5">
                <h2 className="text-primary mt-5 mb-5 fw-bold fs-1 fst-italic">{steps[page].title}</h2>

                {page === 0 && (
                    <>
                        <p className="text-secondary fs-4 mt-5">Track. Budget. Grow.</p>
                        <div className="row justify-content-center mb-4">
                            <div className="col-6 col-md-3">
                                <i className="bi bi-pie-chart-fill fs-1 text-primary"></i>
                                <p>Analyze spending</p>
                            </div>
                            <div className="col-6 col-md-3">
                                <i className="bi bi-wallet2 fs-1 text-success"></i>
                                <p>Set monthly budgets</p>
                            </div>
                            <div className="col-6 col-md-3">
                                <i className="bi bi-bar-chart-line-fill fs-1 text-warning"></i>
                                <p>Track financial goals</p>
                            </div>
                            <div className="col-6 col-md-3 mb-5">
                                <i className="bi bi-shield-lock fs-1 text-info"></i>
                                <p>Private and secure</p>
                            </div>
                        </div>
                    </>
                )}
                {page === 1 && (
                    <>
                        <p className="text-secondary fs-4">Choose your avatar</p>
                        {renderGrid(avatars, selectedAvatar, setSelectedAvatar)}
                    </>
                )}

                {page === 2 && (
                    <>
                        <p className="text-secondary fs-4">Select Your Currency</p>
                        {renderGrid(currencies, selectedCurrency, setSelectedCurrency)}
                    </>
                )}

                {page === 3 && (
                    <div className="mb-4 mt-2">
                        <p className="text-secondary fs-4">Set your Budgets</p>
                        <div className="row d-flex justify-content-center">
                        </div>
                    </div>
                )}

                {page === 4 && (
                    <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="card shadow p-4 border-0" style={{ maxWidth: 400 }}>
                            <div className="d-flex flex-column align-items-center">
                                <div className="bg-success bg-opacity-10 rounded-circle mb-3" style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-emoji-smile fs-1 text-success"></i>
                                </div>
                                <h3 className="fw-bold text-success mb-2">You're all set!</h3>
                                <p className="text-secondary fs-5 mb-3 text-center">
                                    Your Smart Expense Hub is ready.<br />
                                    Start tracking, budgeting, and growing your finances today!
                                </p>
                                <div className="alert alert-info w-100 text-center mb-3 p-2">
                                    You can always update your profile, currency, and budgets in the settings.
                                </div>
                                <Link href="/dashboard" className="btn btn-primary btn-lg w-100" style={{ color: '#fff', textDecoration: 'none' }}>
                                    Go to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {page !== steps.length - 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-5 px-4">
                    {page !== 0 && (
                        <button onClick={prevPage} className="btn btn-outline-secondary">Previous</button>
                    )}

                    <div className="flex-grow-1 d-flex justify-content-center">
                        {steps.map((_, idx) => (
                            <span
                                key={idx}
                                className="mx-1"
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    backgroundColor: idx === page ? '#007bff' : '#ccc'
                                }}
                            />
                        ))}
                    </div>

                    <button onClick={nextPage} className="btn btn-primary">Next</button>
                  </div>
                )}
            </div>
        </div>
    );
}
