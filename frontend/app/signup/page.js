"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, saveToken } from "../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.signup(form);
      const loginRes = await api.login({
        email: form.email,
        password: form.password,
      });
      saveToken(loginRes.access_token);
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
            Your circle starts
            <br />
            with one hello.
          </h1>
          <p className="auth-visual-sub">
            Sign up in seconds and start finding people you know.
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
          <h1>Create your account</h1>
          <p className="sub">Join and start connecting with friends.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input
                name="full_name"
                type="text"
                placeholder="Mehreen Asif"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
