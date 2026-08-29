"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Eyebrow */}
        <ScrollReveal delay={100} direction="down">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#09090B] font-medium text-[12px] tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#09090B] animate-pulse" />
            AUTONOMOUS AI ORCHESTRATION
          </div>
        </ScrollReveal>

        {/* Headline */}
        <ScrollReveal delay={200} direction="up">
          <h1 className="text-[42px] sm:text-[56px] lg:text-[72px] font-bold text-[#09090B] tracking-tight leading-[1.05] mb-8 max-w-4xl">
            AI agents that <br className="hidden sm:block" />
            <span className="text-[#09090B]">think, act, and adapt.</span>
          </h1>
        </ScrollReveal>

        {/* Subtitle */}
        <ScrollReveal delay={300} direction="up">
          <p className="text-[16px] sm:text-[18px] text-[#71717A] max-w-2xl leading-relaxed mb-12 font-medium">
            Multi-Agent AI coordinates specialized agents to observe intent, retrieve knowledge, execute domain tasks, and adapt to complex customer support workflows autonomously.
          </p>
        </ScrollReveal>

        {/* Actions */}
        <ScrollReveal delay={400} direction="up">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-[#09090B] text-white text-[14px] font-semibold rounded-xl hover:bg-[#27272A] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              GET STARTED <ArrowRight size={16} />
            </Link>
            <a 
              href="#architecture" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#09090B] border border-[#E4E4E7] text-[14px] font-semibold rounded-xl hover:bg-[#F4F4F5] transition-all flex items-center justify-center"
            >
              EXPLORE ARCHITECTURE
            </a>
          </div>
        </ScrollReveal>

        {/* Minimalist Architectural Visual */}
        <ScrollReveal delay={500} direction="up" className="w-full max-w-3xl">
          <div className="mt-24 relative w-full h-[280px]">
            {/* Decorative faint background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Diagram Lines & Nodes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              
              {/* Main Orchestrator Node */}
              <rect x="330" y="80" width="140" height="40" rx="8" className="fill-white stroke-[#09090B]" strokeWidth="1.5" />
              <text x="400" y="104" className="fill-[#09090B] text-[12px] font-bold tracking-wider" textAnchor="middle">AI CORE</text>
              <circle cx="400" cy="100" r="28" className="fill-black/[0.03] stroke-[#09090B]/30 animate-[pulse_4s_ease-in-out_infinite]" strokeWidth="1" />

              {/* Top Node (Observe) */}
              <rect x="350" y="10" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="400" y="30" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">OBSERVE</text>
              
              {/* Line Observe -> Core */}
              <path d="M400 42 L400 80" className="stroke-[#E4E4E7]" strokeWidth="1" strokeDasharray="4 4" />
              <polygon points="397,76 403,76 400,80" className="fill-[#A1A1AA]" />

              {/* Bottom Nodes */}
              {/* Execute */}
              <rect x="250" y="180" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="300" y="200" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">EXECUTE</text>
              
              {/* Memory */}
              <rect x="450" y="180" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="500" y="200" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">MEMORY</text>

              {/* Bottom Final */}
              <rect x="350" y="240" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="400" y="260" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">REPLAN</text>

              {/* Lines Core -> Bottom Nodes */}
              <path d="M370 120 L300 180" className="stroke-[#09090B]/30" strokeWidth="1.5" />
              <circle cx="335" cy="150" r="3" className="fill-[#09090B] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              
              <path d="M430 120 L500 180" className="stroke-[#E4E4E7]" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Lines Execute/Memory -> Replan */}
              <path d="M300 212 L380 240" className="stroke-[#E4E4E7]" strokeWidth="1" />
              <path d="M500 212 L420 240" className="stroke-border" strokeWidth="1" />
            </svg>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
