import { Metadata } from "next";
import { Suspense } from "react";
import FoundersContent from "./founders-content";

export const metadata: Metadata = {
  title: "Become a Founder Member | tCredex",
  description: "Join tCredex as a Founder Member. Get your first deal at just 1% fee and earn ongoing 1% rates for every 2 referrals. Limited spots available.",
  openGraph: {
    title: "Become a Founder Member | tCredex",
    description: "Join the tax credit revolution. First deal at 1% fee. Referral rewards.",
    type: "website",
  },
};

function FoundersLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function FoundersPage() {
  return (
    <Suspense fallback={<FoundersLoading />}>
      <FoundersContent />
    </Suspense>
  );
}
