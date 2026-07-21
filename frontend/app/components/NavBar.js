"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "../lib/api";

const TABS = [
  { href: "/friends", label: "Friends" },
  { href: "/requests", label: "Requests" },
  { href: "/find", label: "Find People" },
  { href: "/chat", label: "Messages" },
];

export function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function NavBar({ me }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <nav className="dash-nav">
      <div className="dash-nav-inner">
        <Link href="/dashboard" className="dash-brand">
          <span className="dot"></span>Circle
        </Link>

        <div className="nav-tabs">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "nav-tab" + (pathname === tab.href ? " nav-tab-active" : "")
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="dash-user">
          <Link href="/settings" className="avatar" title="Edit profile">
            {me && initials(me.full_name)}
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
