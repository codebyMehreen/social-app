"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, clearToken } from "../lib/api";
import NavBar from "../components/NavBar";

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [meRes, friendsRes, pendingRes] = await Promise.all([
        api.me(),
        api.getFriends(),
        api.getPendingRequests(),
      ]);
      setMe(meRes);
      setFriendsCount(friendsRes.length);
      setPendingCount(pendingRes.length);
    } catch (err) {
      clearToken();
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

  if (loading) return <div className="auth-page">Loading…</div>;

  return (
    <div className="dash-shell">
      <NavBar me={me} />

      <div className="dash-content" style={{ gridTemplateColumns: "1fr" }}>
        <p className="hub-greeting">
          Welcome back, {me?.full_name.split(" ")[0]}.
        </p>

        <div className="hub-grid">
          <Link href="/friends" className="hub-card">
            <span className="hub-card-label">Friends</span>
            <span className="hub-card-value">{friendsCount}</span>
            <span className="hub-card-desc">People you're connected with</span>
          </Link>

          <Link href="/requests" className="hub-card">
            <span className="hub-card-label">Requests</span>
            <span className="hub-card-value">{pendingCount}</span>
            <span className="hub-card-desc">Pending friend requests</span>
          </Link>

          <Link href="/find" className="hub-card">
            <span className="hub-card-label">Find People</span>
            <span className="hub-card-value">Search</span>
            <span className="hub-card-desc">Discover and add new friends</span>
          </Link>

          <Link href="/chat" className="hub-card">
            <span className="hub-card-label">Messages</span>
            <span className="hub-card-value">Chat</span>
            <span className="hub-card-desc">Talk with your friends</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
