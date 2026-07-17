"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { registerUser, loginUser } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await registerUser(name, email, password);
      const { access_token } = await loginUser(email, password);
      window.localStorage.setItem("access_token", access_token);
      window.dispatchEvent(new Event("storage"));
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
            Create Account
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Get started with TechMart Support
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
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-border rounded-md px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted bg-white input-focus transition-all"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-text-muted mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
