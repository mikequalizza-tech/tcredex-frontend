"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Building2, Briefcase, TrendingUp, ArrowRight, Check } from "lucide-react";
import Image from "next/image";

type OrgType = "sponsor" | "cde" | "investor";

const orgTypes: { id: OrgType; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "sponsor",
    title: "Project Sponsor",
    description: "Projects seeking tax credit financing",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "cde",
    title: "CDE / Allocatee",
    description: "NMTC allocation to deploy",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "investor",
    title: "Investor",
    description: "Invest in tax credit opportunities",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState<"role" | "complete" | "checking">("checking");
  const [selectedType, setSelectedType] = useState<OrgType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already onboarded on mount
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/onboarding");
        const data = await response.json();

        if (!data.needsOnboarding && data.user) {
          // User already onboarded - set cookie via a POST call and redirect
          // This handles the case where cookie was lost but user exists
          const orgType = data.user.role?.toLowerCase()?.includes('cde') ? 'cde'
            : data.user.role?.toLowerCase()?.includes('investor') ? 'investor'
            : 'sponsor';

          // Call POST to set the cookie
          await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              organizationType: orgType,
              organizationName: "Existing", // Won't be used for existing users
            }),
          });

          // Redirect based on role
          setStep("complete");
          setTimeout(() => {
            if (orgType === "cde") {
              router.push("/dashboard/pipeline");
            } else if (orgType === "investor") {
              router.push("/deals");
            } else {
              router.push("/dashboard");
            }
          }, 500);
        } else {
          // User needs onboarding
          setStep("role");
        }
      } catch (err) {
        console.error("[Onboarding] Status check error:", err);
        setStep("role"); // Default to showing role selection
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, user, router]);

  // Show loading while Clerk loads or while checking onboarding status
  if (!isLoaded || step === "checking") {
    return (
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to signin if no user
  if (!user) {
    router.push("/signin");
    return null;
  }

  const handleRoleSelect = async (type: OrgType) => {
    setSelectedType(type);
    setIsSubmitting(true);
    setError("");

    // Use Clerk user's full name or email as organization name
    const userName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'My Organization';
    const orgName = `${userName}'s ${type === 'sponsor' ? 'Projects' : type === 'cde' ? 'CDE' : 'Investments'}`;

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationType: type,
          organizationName: orgName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to complete onboarding");
        setIsSubmitting(false);
        return;
      }

      setStep("complete");

      // Redirect based on role (handle new, existing, and invited users)
      // For existing/invited users, use the org type from the response
      const redirectType = (result.alreadyOnboarded || result.wasInvited) && result.organization?.type
        ? result.organization.type
        : type;

      // Faster redirect for existing/invited users
      const delay = (result.alreadyOnboarded || result.wasInvited) ? 500 : 1500;

      setTimeout(() => {
        if (redirectType === "sponsor") {
          router.push("/dashboard");
        } else if (redirectType === "cde") {
          router.push("/dashboard/pipeline");
        } else {
          router.push("/deals");
        }
      }, delay);
    } catch (err) {
      console.error("[Onboarding] Error:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with Logo */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center gap-3">
              {/* Logo */}
              <Image
                src="/brand/tcredex-icon.svg"
                alt="tCredex"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {step === "complete" ? "You're all set!" : "Welcome to tCredex"}
                </h2>
              </div>
            </div>
          </div>
          {step !== "complete" && (
            <p className="text-sm text-gray-400 mt-1">
              Select your role to get started
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "complete" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-900/50 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-gray-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          )}

          {step === "role" && (
            <div className="space-y-2">
              {error && (
                <div className="mb-3 p-2.5 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}
              {orgTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleRoleSelect(type.id)}
                  disabled={isSubmitting}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                    {isSubmitting && selectedType === type.id ? (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      type.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white">{type.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{type.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "complete" && (
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
            <p className="text-xs text-center text-gray-500">
              AI-Powered Tax Credit Marketplace
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
