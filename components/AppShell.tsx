"use client";

import { SideNav } from "./navigation/SideNav";
import { Header } from "./navigation/Header";

export const AppShell = ({ children }) => {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "260px 1fr",
      height: "100vh",
      background: "var(--neutral-900)"
    }}>
      <SideNav />
      
      <div style={{
        display: "grid",
        gridTemplateRows: "60px 1fr",
        background: "var(--neutral-800)"
      }}>
        <Header />
        <main style={{ padding: "var(--space-lg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
};
