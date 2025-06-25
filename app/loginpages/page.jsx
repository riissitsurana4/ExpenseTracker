"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: "/dashboard" ,
      });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    const res = await signIn(provider, { callbackUrl: "/dashboard" });
    if (res?.error) {
      setError("Authentication failed");
    }
  }

  const handleMagicLink = async () => {
    const res = await signIn("email", {
      email: form.email,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.error) {
      setError("Failed to send magic link");
    } else {
      setError("Check your email for the magic link");
    }
    setLoading(false);
  }


  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #fff 100%)", minHeight: "100vh" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg rounded-4 border-0">
          <div className="modal-header bg-primary text-white rounded-top-4 border-0">
            <h5 className="modal-title fw-bold">Sign In</h5>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit} autoComplete="off">
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
              {error && (
                <div className="alert alert-danger mb-3">{error}</div>
              )}
              <button
                type="submit"
                className="btn btn-primary w-100 mb-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="text-center my-2 text-muted">or</div>
            <button
              className="btn btn-outline-danger w-100 mb-2 d-flex align-items-center justify-content-center rounded-pill"
              onClick={() => handleOAuth("google")}
              type="button"
              aria-label="Sign in with Google"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                alt="Google"
                style={{ width: 24, height: 24 }}
              />
            </button>
            <button
              className="btn btn-outline-secondary w-100 rounded-pill fw-semibold"
              onClick={handleMagicLink}
              type="button"
              disabled={!form.email || loading}
            >
              Send Magic Link
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
