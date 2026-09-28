"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      window.location.replace(`/reset-password${search}${hash}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#09090B]/20 border-t-[#09090B] rounded-full animate-spin" />
    </div>
  );
}
