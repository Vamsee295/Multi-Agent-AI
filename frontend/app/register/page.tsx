"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, LayoutGrid, ArrowRight, User, CheckCircle2, ArrowLeft, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "existing">("idle");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("loading");
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await register(name, normalizedEmail, password);
      
      if (result.emailExists) {
        setStatus("existing");
        return;
      }

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
        setStatus("idle");
        return;
      }

      if (result.requiresEmailConfirmation) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("verify_email_target", normalizedEmail);
        }
        setStatus("success");
        router.push("/verify-email");
      } else {
        setStatus("success");
        setTimeout(() => {
          router.push("/chat");
        }, 600);
      }
      
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setStatus("idle");
    }
  };

  const handleResetForm = () => {
    setEmail("");
    setPassword("");
    setStatus("idle");
    setError("");
  };

  return (
    <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
      
      {/* Left Panel: Image 2 Design */}
      <AIExperiencePanel />

      {/* Right Panel: Register Form */}
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

        {/* Register Form Container */}
        <div className="w-full max-w-[400px] flex flex-col justify-center">
          
          {status === "existing" ? (
             <div className="text-center py-4 page-enter">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-sm">
                <UserCircle2 size={28} />
              </div>
              <h2 className="text-[26px] font-bold text-[#09090B] tracking-tight mb-2">
                Email already exists
              </h2>
              <p className="text-[14px] text-[#71717A] font-medium leading-relaxed mb-8">
                This email is already registered. Sign in to continue using your account.
              </p>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full rounded-xl h-[46px] text-[14px] font-semibold bg-[#09090B] hover:bg-[#27272A] text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  Sign in <ArrowRight size={16} />
                </Link>
                
                <Link
                  href="/forgot-password"
                  className="w-full rounded-xl h-[46px] text-[14px] font-semibold bg-white border border-[#E4E4E7] hover:bg-[#FAFAFA] text-[#09090B] transition-all flex items-center justify-center shadow-sm"
                >
                  Forgot password?
                </Link>
              </div>
              
              <div className="mt-8">
                <button
                   onClick={handleResetForm}
                   className="text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : emailSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-[26px] font-bold text-[#09090B] tracking-tight mb-2">
                Check your email
              </h2>
              <p className="text-[14px] text-[#71717A] font-medium leading-relaxed mb-8">
                We sent a verification link to <span className="text-[#09090B] font-semibold">{email}</span>. Please verify your email to activate your account.
              </p>

              <Link
                href="/login"
                className="w-full rounded-xl h-[46px] text-[14px] font-semibold bg-[#09090B] hover:bg-[#27272A] text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Go to Sign in <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-[28px] font-bold text-[#09090B] tracking-tight mb-2">
                  Create your account
                </h2>
                <p className="text-[15px] text-[#71717A] font-medium">
                  Enter your details to access your dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-700 flex items-start">
                  <span className="shrink-0 mt-0.5 mr-2">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#09090B] mb-2">
                    Full name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA] group-focus-within:text-[#09090B] transition-colors">
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full border border-[#E4E4E7] rounded-xl pl-10 pr-4 h-[46px] text-[14px] text-[#09090B] placeholder:text-[#A1A1AA] bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                    />
                  </div>
                </div>

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
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status !== "idle" || !name || !email || !password}
                  className={`w-full mt-6 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                    ${status === "success" 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-[#09090B] hover:bg-[#27272A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  {status === "idle" && (
                    <>
                      Create account <ArrowRight size={16} />
                    </>
                  )}
                  {status === "loading" && (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  )}
                  {status === "success" && (
                    <>
                      Account Created ✓
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <p className="text-center text-[14px] text-[#71717A] mt-8 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-[#09090B] font-bold hover:opacity-70 transition-opacity">
                  Sign in
                </Link>
              </p>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}
