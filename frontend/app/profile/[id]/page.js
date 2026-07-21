"use client";

import { useEffect, useState, useCallback } from "react";
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

const STATUS_LABEL = {
  self: "This is you",
  none: "Not connected yet",
  pending_sent: "Friend request sent",
  pending_received: "Wants to be your friend",
  friends: "You're friends",
  blocked_by_you: "You've blocked this user",
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUserProfile(userId);
      setProfile(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    load();
  }, [load, router]);

  const runAction = async (fn) => {
    setActionLoading(true);
    try {
      await fn();
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="auth-page">Loading…</div>;
  if (error) return <div className="auth-page">{error}</div>;
  if (!profile) return null;

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
        style={{ gridTemplateColumns: "1fr", maxWidth: 560, margin: "0 auto" }}
      >
        <div className="panel profile-card">
          <div className="avatar profile-avatar">
            {initials(profile.full_name)}
          </div>
          <h2 style={{ marginTop: 16 }}>{profile.full_name}</h2>
          {profile.bio && (
            <p className="user-bio" style={{ fontSize: 14, marginBottom: 6 }}>
              {profile.bio}
            </p>
          )}
          <p className="status-note">{STATUS_LABEL[profile.friend_status]}</p>

          <div className="profile-actions">
            {profile.friend_status === "none" && (
              <button
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() =>
                  runAction(() => api.sendFriendRequest(profile.id))
                }
              >
                + Add friend
              </button>
            )}

            {profile.friend_status === "pending_received" && (
              <button
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() =>
                  runAction(() =>
                    api.respondToRequest(profile.friend_request_id, true),
                  )
                }
              >
                Accept friend request
              </button>
            )}

            {profile.friend_status === "friends" && (
              <>
                <Link
                  href={`/chat/${profile.id}`}
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                >
                  💬 Message
                </Link>
                <button
                  className="btn btn-ghost"
                  disabled={actionLoading}
                  onClick={() => {
                    if (confirm(`Remove ${profile.full_name} as a friend?`)) {
                      runAction(() => api.removeFriend(profile.id));
                    }
                  }}
                >
                  Remove friend
                </button>
              </>
            )}

            {profile.friend_status === "blocked_by_you" ? (
              <button
                className="btn btn-ghost"
                disabled={actionLoading}
                onClick={() => runAction(() => api.unblockUser(profile.id))}
              >
                Unblock
              </button>
            ) : profile.friend_status !== "self" ? (
              <button
                className="btn btn-danger"
                disabled={actionLoading}
                onClick={() => {
                  if (
                    confirm(
                      `Block ${profile.full_name}? This removes any friend connection.`,
                    )
                  ) {
                    runAction(() => api.blockUser(profile.id));
                  }
                }}
              >
                Block user
              </button>
            ) : (
              <Link href="/settings" className="btn btn-ghost">
                Edit your profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
