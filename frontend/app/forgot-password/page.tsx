"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, LayoutGrid, ArrowRight, ArrowLeft } from "lucide-react";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      // Use window.location.origin to dynamically build the redirect URL
      const redirectTo = `${window.location.origin}/update-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        if (resetError.message.toLowerCase().includes("rate limit")) {
          setError("Too many requests. Please wait a moment before trying again.");
        } else {
          // Fallback error, avoid revealing too much info
          setError("Unable to send the reset email. Please try again in a moment.");
        }
        setStatus("idle");
        return;
      }

      // Success
      setStatus("success");
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
      {/* Left Panel */}
      <AIExperiencePanel />

      {/* Right Panel: Forgot Password Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative w-full lg:w-[50%]">
        
        {/* Mobile Header (Hidden on lg screens) */}
        <div className="lg:hidden w-full max-w-[400px] flex flex-col mb-12 relative">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
          <div className="flex items-center gap-2 text-text-primary font-bold tracking-tight text-[16px]">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            MULTI-AGENT AI
          </div>
        </div>

        {/* Desktop Back Navigation */}
        <div className="hidden lg:flex w-full max-w-[400px] mb-8">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] flex flex-col justify-center">
          
          {status !== "success" ? (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2">
                  Forgot your password?
                </h2>
                <p className="text-[15px] text-[#71717A] font-medium leading-relaxed">
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-700 flex items-start">
                  <span className="shrink-0 mt-0.5 mr-2">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#09090B] mb-2">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA] group-focus-within:text-[#09090B] transition-colors">
                      <Mail size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full border border-[#E4E4E7] rounded-xl pl-10 pr-4 h-[46px] text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status !== "idle" || !email}
                  className={`w-full mt-6 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                    ${status === "loading"
                      ? "bg-[#09090B] text-white opacity-70 cursor-not-allowed"
                      : "bg-[#09090B] hover:bg-[#27272A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  {status === "idle" && (
                    <>
                      Send reset link <ArrowRight size={16} />
                    </>
                  )}
                  {status === "loading" && (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2 flex items-center gap-3">
                <span className="text-emerald-500">✓</span> Check your email
              </h2>
              <div className="space-y-4 text-[15px] text-[#71717A] font-medium leading-relaxed">
                <p>
                  If an account exists for this email address, you'll receive a password reset link shortly.
                </p>
                <p>
                  Please check your inbox and follow the link to create a new password.
                </p>
              </div>
              <Link 
                href="/login"
                className="mt-8 inline-flex items-center justify-center w-full rounded-xl h-[46px] bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#09090B] font-semibold text-[14px] transition-colors"
              >
                Return to login
              </Link>
            </div>
          )}

          {/* Login Link */}
          {status !== "success" && (
            <p className="text-center text-[14px] text-[#71717A] mt-8 font-medium">
              Remember your password?{" "}
              <Link href="/login" className="text-[#09090B] font-bold hover:opacity-70 transition-opacity">
                Sign in
              </Link>
            </p>
          )}
          
        </div>
      </div>
    </div>
  );
}
