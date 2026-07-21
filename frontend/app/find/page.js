"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../lib/api";
import NavBar, { initials } from "../components/NavBar";

export default function FindPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const meRes = await api.me();
      setMe(meRes);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [load, router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchUsers(query.trim());
      setResults(res);
    } catch (err) {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await api.sendFriendRequest(userId);
      setSentTo((prev) => new Set(prev).add(userId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="auth-page">Loading…</div>;

  return (
    <div className="dash-shell">
      <NavBar me={me} />

      <div
        className="dash-content"
        style={{ gridTemplateColumns: "1fr", maxWidth: 640, margin: "0 auto" }}
      >
        <div className="panel">
          <h2>Find people</h2>
          <form className="search-row" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={searching}>
              {searching ? "…" : "Search"}
            </button>
          </form>

          {results.length === 0 && (
            <p className="empty-note">Search for people to add as friends.</p>
          )}

          {results.map((user) => (
            <div className="user-row" key={user.id}>
              <Link href={`/profile/${user.id}`} className="user-info">
                <div className="avatar">{initials(user.full_name)}</div>
                <div>
                  <div className="user-name">{user.full_name}</div>
                  {user.bio && <div className="user-bio">{user.bio}</div>}
                </div>
              </Link>
              <button
                className="pill-btn pill-add"
                disabled={sentTo.has(user.id)}
                onClick={() => handleAddFriend(user.id)}
              >
                {sentTo.has(user.id) ? "Sent" : "+ Add friend"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
