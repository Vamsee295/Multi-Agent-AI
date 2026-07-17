"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 page-enter">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center mb-3 shadow-card">
            <MessageSquare size={20} className="text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">
            TechMart Support
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-lg shadow-card-md p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-border rounded-md px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted bg-white input-focus transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border rounded-md px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted bg-white input-focus transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-brand hover:bg-brand-dark text-white rounded-md py-2.5 text-[14px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-text-muted mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
