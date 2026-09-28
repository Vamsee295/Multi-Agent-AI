"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { SystemCapabilitiesStrip } from "@/components/landing/SystemCapabilitiesStrip";
import { LiveQueryDemoSection } from "@/components/landing/LiveQueryDemoSection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { AgentEcosystemSection } from "@/components/landing/AgentEcosystemSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { TechStackSection } from "@/components/landing/TechStackSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function RootPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (
        hash.includes("error_code=otp_expired") ||
        hash.includes("type=recovery") ||
        search.includes("error_code=otp_expired") ||
        search.includes("type=recovery")
      ) {
        window.location.replace(`/reset-password${search}${hash}`);
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-white w-full max-w-full overflow-x-hidden relative">
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden">
        <HeroSection />
        <SystemCapabilitiesStrip />
        <LiveQueryDemoSection />
        <LifecycleSection />
        <AgentEcosystemSection />
        <ArchitectureSection />
        <TechStackSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
