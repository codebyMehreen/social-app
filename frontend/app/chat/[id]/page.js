"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, getToken } from "../../lib/api";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = params.id;

  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [meId, setMeId] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [profileRes, msgsRes, meRes] = await Promise.all([
          api.getUserProfile(friendId),
          api.getMessages(friendId),
          api.me(),
        ]);
        setFriend(profileRes);
        setMessages(msgsRes);
        setMeId(meRes.id);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [friendId],
  );

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
    const interval = setInterval(() => load(true), 3000);
    return () => clearInterval(interval);
  }, [load, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const content = text;
    setText("");
    try {
      await api.sendMessage(friendId, content);
      await load(true);
    } catch (err) {
      setError(err.message);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="auth-page">Loading…</div>;

  if (error && !friend) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="sub">{error}</p>
          <Link href="/chat" className="btn btn-ghost">
            ← Back to messages
          </Link>
        </div>
      </div>
    );
  }

  const canChat = friend?.friend_status === "friends";

  return (
    <div className="chat-shell">
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/chat" className="dash-brand" style={{ gap: 12 }}>
            <span style={{ fontSize: 18 }}>←</span>
            <div
              className="avatar"
              style={{ width: 30, height: 30, fontSize: 12 }}
            >
              {friend && initials(friend.full_name)}
            </div>
            <span>{friend?.full_name}</span>
          </Link>
          <Link href={`/profile/${friendId}`} className="logout-btn">
            View profile
          </Link>
        </div>
      </nav>

      <div className="chat-body">
        {!canChat && (
          <div className="empty-note" style={{ marginTop: 40 }}>
            You can only message people who are your friends.
          </div>
        )}

        {canChat && messages.length === 0 && (
          <div className="empty-note" style={{ marginTop: 40 }}>
            No messages yet — say hello 👋
          </div>
        )}

        {canChat &&
          messages.map((m) => {
            const isMe = m.sender_id === meId;
            return (
              <div
                key={m.id}
                className={`bubble-row ${isMe ? "bubble-row-me" : ""}`}
              >
                <div className={`bubble ${isMe ? "bubble-me" : "bubble-them"}`}>
                  {m.content}
                  <span className="bubble-time">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {canChat && (
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      )}
    </div>
  );
}
