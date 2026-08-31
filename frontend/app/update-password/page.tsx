"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, LayoutGrid, ArrowRight, ArrowLeft } from "lucide-react";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";
import { supabase } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState<"verifying" | "invalid" | "idle" | "loading" | "success">("verifying");
  const [error, setError] = useState("");

  // Verify the recovery session when the component mounts
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        // Wait briefly for Supabase to process the URL hash and set the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError || !session) {
          setStatus("invalid");
        } else {
          setStatus("idle");
        }
      } catch (err) {
        if (mounted) setStatus("invalid");
      }
    }

    checkSession();

    // Listen for the specific PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setStatus("idle");
      } else if (event === "SIGNED_OUT" && status !== "success") {
        setStatus("invalid");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
        setStatus("idle");
        return;
      }

      // Success
      setStatus("success");
      // Sign out the user so they can log in cleanly with their new password
      await supabase.auth.signOut();
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
        <AIExperiencePanel />
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative w-full lg:w-[50%]">
          <div className="w-8 h-8 border-2 border-[#09090B]/20 border-t-[#09090B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
      {/* Left Panel */}
      <AIExperiencePanel />

      {/* Right Panel: Update Password Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative w-full lg:w-[50%]">
        
        {/* Mobile Header (Hidden on lg screens) */}
        <div className="lg:hidden w-full max-w-[400px] flex flex-col mb-12 relative">
          <div className="flex items-center gap-2 text-text-primary font-bold tracking-tight text-[16px]">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            MULTI-AGENT AI
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[400px] flex flex-col justify-center">
          
          {status === "invalid" && (
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2">
                Password reset link expired
              </h2>
              <div className="space-y-4 text-[15px] text-[#71717A] font-medium leading-relaxed">
                <p>
                  This reset link is no longer valid or has already been used.
                </p>
                <p>
                  Please request a new password reset link to continue.
                </p>
              </div>
              <Link 
                href="/forgot-password"
                className="mt-8 inline-flex items-center justify-center w-full rounded-xl h-[46px] bg-[#09090B] hover:bg-[#27272A] text-white font-semibold text-[14px] transition-colors shadow-sm"
              >
                Request new reset link
              </Link>
            </div>
          )}

          {(status === "idle" || status === "loading") && (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2">
                  Reset your password
                </h2>
                <p className="text-[15px] text-[#71717A] font-medium leading-relaxed">
                  Create a new password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-700 flex items-start">
                  <span className="shrink-0 mt-0.5 mr-2">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Field */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#09090B] mb-2">
                    New password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full border border-[#E4E4E7] rounded-xl pl-4 pr-11 h-[46px] text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A1A1AA] hover:text-[#09090B] transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#09090B] mb-2">
                    Confirm password
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full border border-[#E4E4E7] rounded-xl pl-4 pr-11 h-[46px] text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A1A1AA] hover:text-[#09090B] transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status !== "idle" || !password || !confirmPassword}
                  className={`w-full mt-6 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                    ${status === "loading"
                      ? "bg-[#09090B] text-white opacity-70 cursor-not-allowed"
                      : "bg-[#09090B] hover:bg-[#27272A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  {status === "idle" && (
                    <>
                      Update password <ArrowRight size={16} />
                    </>
                  )}
                  {status === "loading" && (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2 flex items-center gap-3">
                <span className="text-emerald-500">✓</span> Password updated
              </h2>
              <div className="space-y-4 text-[15px] text-[#71717A] font-medium leading-relaxed">
                <p>
                  Your password has been successfully changed.
                </p>
              </div>
              <Link 
                href="/login"
                className="mt-8 inline-flex items-center justify-center w-full rounded-xl h-[46px] bg-[#09090B] hover:bg-[#27272A] text-white font-semibold text-[14px] transition-colors shadow-sm gap-2"
              >
                Continue to login <ArrowRight size={16} />
              </Link>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
