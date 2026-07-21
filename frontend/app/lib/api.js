// Base URL of the FastAPI backend
const API_URL = "http://localhost:8000";

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }
  return data;
}

export const api = {
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  me: () => request("/auth/me"),

  searchUsers: (q) => request(`/friends/search?q=${encodeURIComponent(q)}`),

  sendFriendRequest: (userId) =>
    request(`/friends/request/${userId}`, { method: "POST" }),

  respondToRequest: (requestId, accept) =>
    request(`/friends/respond/${requestId}?accept=${accept}`, {
      method: "POST",
    }),

  getPendingRequests: () => request("/friends/pending"),

  getFriends: () => request("/friends"),

  updateProfile: (payload) =>
    request("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),

  getUserProfile: (userId) => request(`/friends/user/${userId}`),

  removeFriend: (userId) => request(`/friends/${userId}`, { method: "DELETE" }),

  blockUser: (userId) =>
    request(`/friends/block/${userId}`, { method: "POST" }),

  unblockUser: (userId) =>
    request(`/friends/unblock/${userId}`, { method: "POST" }),

  getBlockedUsers: () => request("/friends/blocked/list"),

  getConversations: () => request("/messages/conversations"),

  getMessages: (friendId) => request(`/messages/${friendId}`),

  sendMessage: (friendId, content) =>
    request(`/messages/${friendId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
