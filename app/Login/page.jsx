"use client";
import React, { useState } from 'react';
import './login.css';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login or signup logic here
    if (isSignup) {
      // Signup logic
      alert(`Sign up: ${form.name}, ${form.email}`);
    } else {
      // Login logic
      alert(`Login: ${form.email}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-title">{isSignup ? 'Sign Up' : 'Login'}</div>
      <form className="login-form" onSubmit={handleSubmit}>
        {isSignup && (
          <input
            className="login-input"
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}
        <input
          className="login-input"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="login-input"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="login-button" type="submit">
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <a
        href="#"
        className="login-link"
        onClick={() => setIsSignup((prev) => !prev)}
      >
        {isSignup
          ? 'Already have an account? Login'
          : "Don't have an account? Sign Up"}
      </a>
    </div>
  );
}



