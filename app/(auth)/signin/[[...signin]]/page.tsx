import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/brand/tcredex-icon.svg"
              alt="tCredex"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to tCredex</h1>
          <p className="text-gray-400">Sign in to access your deals, matches, and closing rooms.</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-800 shadow-xl rounded-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
            },
          }}
        />
        <div className="mt-4 text-center">
          <Link
            href="/reset-password"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
