"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, saveToken } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(form);
      saveToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-visual">
        <div className="auth-visual-blob blob-1"></div>
        <div className="auth-visual-blob blob-2"></div>
        <div className="auth-visual-content">
          <div className="auth-brand auth-brand-light">
            <span className="dot"></span>Circle
          </div>
          <h1 className="auth-visual-heading">
            Stay close to
            <br />
            the people who matter.
          </h1>
          <p className="auth-visual-sub">
            Connect, chat, and keep up with friends — all in one place.
          </p>
          <div className="floating-chips">
            <div className="chip chip-1">👋 New friend request</div>
            <div className="chip chip-2">💬 3 new messages</div>
            <div className="chip chip-3">✓ Request accepted</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-brand mobile-only">
            <span className="dot"></span>Circle
          </div>
          <h1>Welcome back</h1>
          <p className="sub">Log in to see your friends and requests.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
