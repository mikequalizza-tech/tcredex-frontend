// app/layout.tsx


import "./css/style.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tCredex | AI-Powered Tax Credit Marketplace",
  description: "Deal intelligence for NMTC, LIHTC, HTC, OZ, Brownfield, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
