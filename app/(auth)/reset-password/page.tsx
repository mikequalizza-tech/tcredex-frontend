"use client";


import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  // Step 1: Send password reset email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = getSupabase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };


  // Step 2: Update password using the code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = getSupabase();
    try {
      // This will only work if the user is on the magic link from their email
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/brand/tcredex-icon.svg"
              alt="tCredex"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <h1 className="text-xl font-semibold text-white">Reset Password</h1>
          </div>
          <p className="text-sm text-gray-400">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && "Enter the code sent to your email"}
            {step === "success" && "Your password has been reset"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Reset Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter 6-digit code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !code || !newPassword}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Didn't receive code? Try again
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-900/50 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300 mb-4">Your password has been reset successfully.</p>
              <Link
                href="/signin"
                className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "success" && (
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
            <p className="text-sm text-center text-gray-400">
              Remember your password?{" "}
              <Link href="/signin" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
