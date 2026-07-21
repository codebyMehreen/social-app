"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../lib/api";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getConversations();
      setConversations(res);
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

      <div
        className="dash-content"
        style={{ gridTemplateColumns: "1fr", maxWidth: 600, margin: "0 auto" }}
      >
        <div className="panel">
          <h2>Messages</h2>

          {loading && <p className="empty-note">Loading conversations…</p>}

          {!loading && conversations.length === 0 && (
            <p className="empty-note">
              No conversations yet. Visit a friend's profile and click "Message"
              to start chatting.
            </p>
          )}

          {conversations.map((c) => (
            <Link
              href={`/chat/${c.friend.id}`}
              className="user-row"
              key={c.friend.id}
            >
              <div className="user-info">
                <div className="avatar">{initials(c.friend.full_name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="user-name">{c.friend.full_name}</div>
                  <div className="user-bio chat-preview">
                    {c.last_message || "Say hello 👋"}
                  </div>
                </div>
              </div>
              {c.last_message_at && (
                <div className="chat-time">{timeAgo(c.last_message_at)}</div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
