"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, LayoutGrid, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError, setError: setAuthError } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [localError, setLocalError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const displayError = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setErrorCode(null);
    setAuthError(null);
    setStatus("loading");
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await login(normalizedEmail, password);
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/chat");
        }, 600);
      } else {
        setErrorCode(result.code || "UNKNOWN");
        setLocalError(result.error || "Invalid email or password. Please try again.");
        setStatus("idle");
      }
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed. Please try again.");
      setStatus("idle");
    }
  };

  const handleGoToVerify = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("verify_email_target", email.trim().toLowerCase());
    }
    router.push("/verify-email");
  };

  return (
    <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
      
      {/* Left Panel: Image 2 Design */}
      <AIExperiencePanel />

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative w-full lg:w-[50%]">
        
        {/* Mobile Header (Hidden on lg screens) */}
        <div className="lg:hidden w-full max-w-[400px] flex flex-col mb-12 relative">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
          <div className="flex items-center gap-2 text-text-primary font-bold tracking-tight text-[16px]">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            MULTI-AGENT AI
          </div>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-[400px] flex flex-col justify-center">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2">
              Sign in to your account
            </h2>
            <p className="text-[15px] text-[#71717A] font-medium">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Structured Error Banners */}
          {errorCode === "EMAIL_NOT_VERIFIED" ? (
            <div className="mb-6 px-4 py-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[14px] text-amber-900 flex flex-col gap-2">
              <div className="flex items-start">
                <span className="shrink-0 mt-0.5 mr-2 text-amber-600">⚠</span>
                <div>
                  <p className="font-semibold text-amber-950">Email not verified</p>
                  <p className="text-[13px] text-amber-800/90 mt-0.5">Please verify your email before signing in.</p>
                </div>
              </div>
              <div className="pl-6 pt-0.5">
                <button
                  type="button"
                  onClick={handleGoToVerify}
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-[#09090B] hover:underline"
                >
                  Verify email <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : errorCode === "EMAIL_NOT_FOUND" ? (
            <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-900 flex flex-col gap-2">
              <div className="flex items-start">
                <span className="shrink-0 mt-0.5 mr-2 text-red-600">⚠</span>
                <div>
                  <p className="font-semibold text-red-950">Email not found</p>
                  <p className="text-[13px] text-red-700/90 mt-0.5">We couldn&apos;t find an account with this email address.</p>
                </div>
              </div>
              <div className="pl-6 pt-0.5">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-red-900 hover:underline"
                >
                  Sign up for free <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : displayError ? (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-700 flex items-start">
              <span className="shrink-0 mt-0.5 mr-2">⚠</span>
              <span>{displayError}</span>
            </div>
          ) : null}

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

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-semibold text-[#09090B] mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[13px] pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 rounded-[4px] border border-[#E4E4E7] bg-white group-hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    className="absolute opacity-0 w-full h-full cursor-pointer peer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-2.5 h-2.5 bg-black rounded-[2px] scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-[#3F3F46] group-hover:text-[#09090B] transition-colors select-none font-medium">
                  Remember me for 30 days
                </span>
              </label>
              <Link href="/forgot-password" className="text-[#09090B] font-semibold hover:opacity-70 transition-opacity">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status !== "idle" || !email || !password}
              className={`w-full mt-6 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                ${status === "success" 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                  : "bg-[#09090B] hover:bg-[#27272A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              {status === "idle" && (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
              {status === "loading" && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              )}
              {status === "success" && (
                <>
                  Access Granted ✓
                </>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-[14px] text-[#71717A] mt-8 font-medium">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#09090B] font-bold hover:opacity-70 transition-opacity">
              Sign up for free
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}
