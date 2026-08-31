"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, ArrowRight, ArrowLeft, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AIExperiencePanel } from "@/components/auth/AIExperiencePanel";

const OTP_LENGTH = 8;

export default function VerifyEmailPage() {
  const router = useRouter();
  const { verifyEmailOtp, resendSignupOtp, error: authError, setError: setAuthError } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load target email from sessionStorage or query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("verify_email_target");
      if (stored) {
        setEmail(stored);
      } else {
        const params = new URLSearchParams(window.location.search);
        const qEmail = params.get("email");
        if (qEmail) {
          setEmail(qEmail);
        }
      }
    }
  }, []);

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      // Handle paste into a box
      const pasted = cleanVal.slice(0, OTP_LENGTH).split("");
      pasted.forEach((char, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIdx]?.focus();

      if (newOtp.every((digit) => digit !== "")) {
        handleVerify(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto advance
    if (cleanVal && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 8 filled
    if (newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      if (otp.every((d) => d !== "")) {
        handleVerify(otp.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < OTP_LENGTH) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError("");

    const targetIdx = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[targetIdx]?.focus();

    if (pastedData.length === OTP_LENGTH) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (tokenString?: string) => {
    const code = tokenString || otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete 8-digit verification code.");
      return;
    }

    if (!email) {
      setError("No email address found to verify. Please register again.");
      return;
    }

    setError("");
    setResendStatus(null);
    setStatus("verifying");

    try {
      const result = await verifyEmailOtp(email, code);

      if (!result.success) {
        setError(result.error || "That verification code is incorrect. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("success");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("verify_email_target");
      }
      setTimeout(() => {
        router.push("/chat");
      }, 800);
    } catch (err: any) {
      setError(err.message || "We couldn't verify the code. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setError("");
    setResendStatus(null);

    const result = await resendSignupOtp(email);
    if (!result.success) {
      setError(result.error || "Couldn't send a new code. Please try again.");
    } else {
      setResendStatus("Verification code sent.");
      setResendCooldown(60);
    }
  };

  const displayError = error || authError;

  return (
    <div className="flex min-h-screen bg-white w-full page-enter overflow-hidden">
      {/* Left Panel */}
      <AIExperiencePanel />

      {/* Right Panel: OTP Verification Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 relative w-full lg:w-[50%]">
        {/* Mobile Header (Hidden on lg screens) */}
        <div className="lg:hidden w-full max-w-[460px] flex flex-col mb-6 relative">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to signup
          </Link>
          <div className="flex items-center gap-2 text-text-primary font-bold tracking-tight text-[16px]">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            MULTI-AGENT AI
          </div>
        </div>

        {/* Desktop Back Navigation */}
        <div className="hidden lg:flex w-full max-w-[460px] mb-6">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <ArrowLeft size={14} /> Back to signup
          </Link>
        </div>

        {/* Verification Container */}
        <div className="w-full max-w-[460px] flex flex-col justify-center">
          <div className="mb-6 text-center lg:text-left">
            <div className="w-11 h-11 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center mb-4 mx-auto lg:mx-0 shadow-sm">
              <ShieldCheck size={22} className="text-[#09090B]" />
            </div>
            <h2 className="text-[26px] font-bold text-[#09090B] tracking-tight mb-2">
              Verify your email
            </h2>
            <div className="space-y-1">
              <p className="text-[14px] text-[#71717A] font-medium">
                We sent an 8-digit verification code to
              </p>
              <p className="text-[15px] font-bold text-[#09090B] break-all select-all font-mono">
                {email || "your email address"}
              </p>
            </div>
          </div>

          {displayError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[14px] text-red-700 flex items-start">
              <span className="shrink-0 mt-0.5 mr-2">⚠</span>
              <span>{displayError}</span>
            </div>
          )}

          {resendStatus && (
            <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[14px] text-emerald-700 flex items-center gap-2">
              <span className="shrink-0">✓</span>
              <span>{resendStatus}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* 8 Individual OTP Boxes */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{1}"
                  maxLength={1}
                  value={digit}
                  disabled={status === "verifying" || status === "success"}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-10 h-12 sm:w-[48px] sm:h-[54px] md:w-[50px] md:h-[54px] text-center text-[19px] sm:text-[21px] font-bold text-[#09090B] rounded-xl border transition-all bg-white
                    ${
                      digit
                        ? "border-[#09090B] ring-2 ring-black/5 bg-[#FAFAFA]"
                        : "border-[#E4E4E7] focus:border-black focus:ring-2 focus:ring-black/5"
                    }
                    ${status === "verifying" ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                />
              ))}
            </div>

            {/* Resend Code & Timer */}
            <div className="flex items-center justify-between text-[13px] pt-0.5">
              <span className="text-[#71717A] font-medium">Didn&apos;t receive the code?</span>
              {resendCooldown > 0 ? (
                <span className="text-[#A1A1AA] font-mono font-medium">
                  Resend in 00:{resendCooldown.toString().padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#09090B] font-bold hover:underline transition-all flex items-center gap-1"
                >
                  <RotateCcw size={13} /> Resend code
                </button>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={status === "verifying" || otp.some((d) => d === "")}
              className={`w-full mt-4 rounded-xl h-[46px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm
                ${
                  status === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-[#09090B] hover:bg-[#27272A] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
            >
              {status === "idle" && (
                <>
                  Verify email <ArrowRight size={16} />
                </>
              )}
              {status === "verifying" && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying code...
                </>
              )}
              {status === "success" && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> Email verified ✓ Your account is ready
                </div>
              )}
            </button>

            {/* Change Email Link */}
            <div className="pt-1 text-center">
              <Link
                href="/register"
                className="text-[13px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors inline-flex items-center gap-1.5"
              >
                ← Change email address
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
