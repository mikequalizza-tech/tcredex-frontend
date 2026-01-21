"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Building2, Briefcase, TrendingUp, Eye, EyeOff, Check } from "lucide-react";

type RoleType = "sponsor" | "cde" | "investor";

const roleOptions: { id: RoleType; title: string; description: string; icon: React.ReactNode }[] = [
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

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    role: "" as RoleType | "",
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRoleSelect = (role: RoleType) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.password || !formData.organizationName || !formData.role) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            organization_name: formData.organizationName,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
        },
      });

      if (authError) {
        setError(authError.message);
        setIsSubmitting(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create account");
        setIsSubmitting(false);
        return;
      }

      // 2. Create organization and user via API (uses service role to bypass RLS)
      const userName = formData.firstName
        ? `${formData.firstName} ${formData.lastName || ""}`.trim()
        : formData.email.split("@")[0];

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          email: formData.email,
          name: userName,
          role: formData.role,
          organizationName: formData.organizationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Signup API error:", errorData);
        setError(errorData.error || "Failed to complete signup");
        setIsSubmitting(false);
        return;
      }

      // Success - check if email confirmation is required
      if (authData.user.identities?.length === 0) {
        // Email confirmation required
        router.push("/signup/verify?email=" + encodeURIComponent(formData.email));
      } else {
        // Auto-confirmed, redirect to dashboard
        router.push(redirectTo);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join tCredex</h1>
          <p className="text-gray-400">Create your account to start exploring tax credit opportunities.</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your Company LLC"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Your Role *</label>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleRoleSelect(option.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      formData.role === option.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 hover:border-gray-600 bg-gray-800"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === option.id ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-400"
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{option.title}</h3>
                      <p className="text-xs text-gray-400">{option.description}</p>
                    </div>
                    {formData.role === option.id && (
                      <Check className="h-5 w-5 text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="acceptTerms"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-400">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/signin" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
