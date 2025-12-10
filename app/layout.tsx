import "./css/style.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

import Header from "@/components/ui/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nacelle = localFont({
  src: [
    {
      path: "../public/fonts/nacelle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/nacelle-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "tCredex | AI-Powered Tax Credit Marketplace",
    template: "%s | tCredex",
  },
  description:
    "Discover, evaluate, and finance tax credit opportunities with tCredex's AI-powered marketplace and underwriting tools.",
  openGraph: {
    title: "tCredex | AI-Powered Tax Credit Marketplace",
    description:
      "Discover, evaluate, and finance tax credit opportunities with tCredex's AI-powered marketplace and underwriting tools.",
    siteName: "tCredex",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${nacelle.variable} bg-gray-950 font-inter text-base text-gray-200 antialiased`}
      >
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
