"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../lib/api";
import NavBar, { initials } from "../components/NavBar";

export default function FriendsPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [meRes, friendsRes] = await Promise.all([
        api.me(),
        api.getFriends(),
      ]);
      setMe(meRes);
      setFriends(friendsRes);
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

  const handleRemove = async (f) => {
    if (!confirm(`Remove ${f.full_name} as a friend?`)) return;
    try {
      await api.removeFriend(f.id);
      await load();
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
          <h2>Your friends ({friends.length})</h2>
          {friends.length === 0 && (
            <p className="empty-note">
              No friends yet — go to Find People to send your first request.
            </p>
          )}
          {friends.map((f) => (
            <div className="user-row" key={f.id}>
              <Link href={`/profile/${f.id}`} className="user-info">
                <div className="avatar">{initials(f.full_name)}</div>
                <div>
                  <div className="user-name">{f.full_name}</div>
                  {f.bio && <div className="user-bio">{f.bio}</div>}
                </div>
              </Link>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/chat/${f.id}`} className="pill-btn pill-add">
                  Message
                </Link>
                <button
                  className="pill-btn pill-reject"
                  onClick={() => handleRemove(f)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
