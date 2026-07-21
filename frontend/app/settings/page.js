"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    api
      .me()
      .then((me) => setForm({ full_name: me.full_name, bio: me.bio || "" }))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (e) => {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.updateProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-page">Loading…</div>;

  return (
    <div className="dash-shell">
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-brand">
            <span className="dot"></span>Circle
          </Link>
          <Link href="/dashboard" className="logout-btn">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="auth-page" style={{ minHeight: "auto", paddingTop: 40 }}>
        <div className="auth-card">
          <h1>Edit profile</h1>
          <p className="sub">Update how others see you.</p>

          {error && <div className="error-box">{error}</div>}
          {saved && <div className="success-box">Profile updated.</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label>Bio</label>
              <input
                name="bio"
                type="text"
                placeholder="A short line about you"
                value={form.bio}
                onChange={handleChange}
                maxLength={140}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
