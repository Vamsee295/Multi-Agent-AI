"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, LayoutGrid, ArrowRight, ArrowLeft } from "lucide-react";
import { HelpFlowLogo } from "@/components/HelpFlowLogo";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const formEmail = (formData.get("email") as string) || email;
    const emailEl = typeof document !== "undefined" ? (document.getElementById("forgot-email") as HTMLInputElement | null) : null;
    const targetEmail = (formEmail || emailEl?.value || "").trim().toLowerCase();

    if (!targetEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmittedEmail(targetEmail);
    setStatus("loading");

    try {
      // Dynamic origin: keeps localhost:3000 during dev and helpflow.tech in production
      const appUrl =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || "https://helpflow.tech");
      const redirectTo = `${appUrl}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });

      if (resetError) {
        if (resetError.message.toLowerCase().includes("rate limit")) {
          setError("Too many requests. Please wait a moment before trying again.");
        } else {
          setError(resetError.message || "Unable to send the reset email. Please try again in a moment.");
        }
        setStatus("idle");
        return;
      }

      // Success
      setStatus("success");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
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
          <HelpFlowLogo size="sm" showWordmark={true} />
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
                  <label htmlFor="forgot-email" className="block text-[13px] font-semibold text-[#09090B] mb-2">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA] group-focus-within:text-[#09090B] transition-colors">
                      <Mail size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                      placeholder="Enter your email"
                      className="w-full border border-[#E4E4E7] rounded-xl pl-10 pr-4 h-[46px] text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className={`w-full mt-6 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                    ${status === "loading"
                      ? "bg-[#09090B] text-white opacity-70 cursor-not-allowed"
                      : "bg-[#09090B] hover:bg-[#27272A] text-white cursor-pointer active:scale-[0.99]"
                    }`}
                >
                  {status === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight size={16} />
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
                  If an account exists for{" "}
                  <span className="text-[#09090B] font-semibold break-all">
                    {submittedEmail}
                  </span>
                  , you'll receive a password reset link shortly.
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
