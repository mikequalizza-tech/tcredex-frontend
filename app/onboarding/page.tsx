"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Building2, Briefcase, TrendingUp, ArrowRight, Check, ArrowLeft } from "lucide-react";

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

  const [step, setStep] = useState<"role" | "org" | "complete">("role");
  const [selectedType, setSelectedType] = useState<OrgType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/signin");
    return null;
  }

  const handleComplete = async () => {
    if (!selectedType || !orgName.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationType: selectedType,
          organizationName: orgName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to complete onboarding");
        return;
      }

      setStep("complete");

      // Redirect based on role
      setTimeout(() => {
        if (selectedType === "sponsor") {
          router.push("/dashboard");
        } else if (selectedType === "cde") {
          router.push("/dashboard/pipeline");
        } else {
          router.push("/deals");
        }
      }, 1500);
    } catch (err) {
      console.error("[Onboarding] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            {step === "org" && (
              <button
                onClick={() => setStep("role")}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {step === "complete" ? "You're all set!" : step === "role" ? "Welcome to tCredex" : "Organization Details"}
              </h2>
            </div>
          </div>
          {step !== "complete" && (
            <p className="text-sm text-gray-500 mt-1">
              {step === "role" ? "Select your role to get started" : "Enter your organization name"}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "complete" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">Redirecting to your dashboard...</p>
            </div>
          )}

          {step === "role" && (
            <div className="space-y-2">
              {orgTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setStep("org");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">{type.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{type.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === "org" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  autoFocus
                  placeholder={
                    selectedType === "sponsor"
                      ? "e.g., Acme Development Corp"
                      : selectedType === "cde"
                      ? "e.g., Community Capital Fund"
                      : "e.g., Impact Investments LLC"
                  }
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && orgName.trim()) {
                      handleComplete();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={isSubmitting || !orgName.trim()}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "complete" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Secured by tCredex
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
