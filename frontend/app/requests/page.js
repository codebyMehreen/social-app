"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../lib/api";
import NavBar, { initials } from "../components/NavBar";

export default function RequestsPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [meRes, pendingRes] = await Promise.all([
        api.me(),
        api.getPendingRequests(),
      ]);
      setMe(meRes);
      setPending(pendingRes);
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

  const handleRespond = async (requestId, accept) => {
    try {
      await api.respondToRequest(requestId, accept);
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
          <h2>
            Friend requests
            {pending.length > 0 && (
              <span className="badge-count">{pending.length}</span>
            )}
          </h2>
          {pending.length === 0 && (
            <p className="empty-note">No pending requests right now.</p>
          )}
          {pending.map((req) => (
            <div className="user-row" key={req.id}>
              <Link href={`/profile/${req.sender.id}`} className="user-info">
                <div className="avatar">{initials(req.sender.full_name)}</div>
                <div>
                  <div className="user-name">{req.sender.full_name}</div>
                  <div className="user-bio">wants to be friends</div>
                </div>
              </Link>
              <div>
                <button
                  className="pill-btn pill-accept"
                  onClick={() => handleRespond(req.id, true)}
                >
                  Accept
                </button>
                <button
                  className="pill-btn pill-reject"
                  onClick={() => handleRespond(req.id, false)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
