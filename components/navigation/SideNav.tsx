"use client";

import Image from "next/image";
import Link from "next/link";

export const SideNav = () => {
  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Matching", href: "/cde" },
    { label: "Documents", href: "/documents" },
    { label: "Settings", href: "/settings" }
  ];

  return (
    <nav
      style={{
        width: "260px",
        background: "var(--brand-navy)",
        color: "white",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "var(--shadow-soft)"
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <Image
          src="/logo-tcredex-transparent.svg"
          alt="tCredex"
          width={40}
          height={40}
        />

        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            letterSpacing: "0.02em"
          }}
        >
          tCredex
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "10px 14px",
              background: "var(--brand-navy-light)",
              borderRadius: "var(--radius-sm)",
              color: "white",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
