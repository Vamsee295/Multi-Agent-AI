"use client";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { AgentEcosystemSection } from "@/components/landing/AgentEcosystemSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { TechStackSection } from "@/components/landing/TechStackSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
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
