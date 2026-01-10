import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to tCredex</h1>
          <p className="text-gray-400">Sign in to access your deals, matches, and closing rooms.</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-800 shadow-xl",
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
      </div>
    </div>
  );
}
