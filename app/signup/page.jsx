"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/onboarding",
    });

    if (signInRes?.error) {
      setError(signInRes.error);
      setLoading(false);
      return;
    }

    router.push(signInRes.url || "/onboarding");
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    await signIn(provider, { callbackUrl: "/onboarding" });
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #fff 100%)", minHeight: "100vh" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg rounded-4 border-0">
          <div className="modal-header bg-primary text-white rounded-top-4 border-0 justify-content-center">
            <h5 className="modal-title fw-bold">Create your account</h5>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group mb-3">
                <input
                  name="name"
                  type="text"
                  className="form-control"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-3 position-relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2 p-0"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ zIndex: 2 }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              <div className="form-group mb-3 position-relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y me-2 p-0"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ zIndex: 2 }}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              {error && (
                <div className="alert alert-danger mb-3">{error}</div>
              )}
              <button
                type="submit"
                className="btn btn-primary w-100 mb-2"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>
            <div className="text-center my-2 text-muted">or</div>
            <div className="d-flex justify-content-center my-3">
              <button
                className="btn p-0"
                onClick={() => handleOAuth("google")}
                aria-label="Sign in with Google"
                style={{ background: "none", border: "none" }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  style={{ width: 32, height: 32, marginRight: 16 }}
                />
              </button>
              <button
                className="btn p-0"
                onClick={() => handleOAuth("facebook")}
                aria-label="Sign in with Facebook"
                style={{ background: "none", border: "none" }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg"
                  alt="Facebook"
                  style={{ width: 32, height: 32, marginRight: 16 }}
                />
              </button>
              <button
                className="btn p-0"
                onClick={() => handleOAuth("github")}
                aria-label="Sign in with GitHub"
                style={{ background: "none", border: "none" }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                  alt="GitHub"
                  style={{ width: 32, height: 32 }}
                />
              </button>
            </div>
            <div className="text-center mt-3">
              <p>
                Already have an account?{" "}
                <button
                  className="btn btn-link p-0"
                  onClick={() => router.push("/loginpages")}
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
