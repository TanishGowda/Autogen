import { useAuth } from "../hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Code2, Loader2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

export default function Login() {
  const { user, loading, signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (password.length < 6) {
          throw new Error("Password should be at least 6 characters.");
        }

        const result = await signUpWithPassword(email.trim(), password, fullName.trim());
        if (result.needsEmailConfirmation) {
          setSuccessMessage("Account created. Check your email to confirm your account.");
        } else {
          setSuccessMessage("Account created successfully.");
        }
      } else {
        await signInWithPassword(email.trim(), password);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      setErrorMessage(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AutoGen</span>
          </Link>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Transform your code into complete documentation
          </h1>
          <p className="text-lg text-primary-100 leading-relaxed mb-10">
            Upload source code and get architecture diagrams, use-case diagrams,
            and comprehensive test cases — all powered by AI.
          </p>
          <div className="space-y-4">
            {[
              "Architecture & UML diagram generation",
              "White-box & black-box test cases",
              "AI-powered code analysis & summaries",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-primary-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">
              Auto<span className="text-primary-600">Gen</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-surface-500 mb-6">
            {isSignUp
              ? "Sign up to start creating analyses."
              : "Sign in to access your projects and analysis results."}
          </p>

          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-100 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                !isSignUp ? "bg-white text-surface-900 shadow-sm" : "text-surface-500"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                isSignUp ? "bg-white text-surface-900 shadow-sm" : "text-surface-500"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Full name (optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-surface-200 rounded-lg text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-surface-200 rounded-lg text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-surface-200 rounded-lg text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-surface-400">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-surface-200 rounded-xl text-surface-700 font-semibold hover:bg-surface-50 hover:border-surface-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-xs text-surface-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
