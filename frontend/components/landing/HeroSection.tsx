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
              START ORCHESTRATING <ArrowRight size={16} />
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
        <ScrollReveal delay={500} direction="up" className="w-full max-w-4xl">
          <div className="mt-20 relative w-full h-[400px]">
            {/* Decorative faint background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Diagram Lines & Nodes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              
              <defs>
                {/* Glow filter for active nodes */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* LINES & PARTICLES */}
              {/* 1 to 2 */}
              <path d="M400 42 L400 70" className="stroke-[#E4E4E7]" strokeWidth="1" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M400 42 L400 70" />
              </circle>

              {/* 2 to 3 */}
              <path d="M400 102 L400 130" className="stroke-[#E4E4E7]" strokeWidth="1" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M400 102 L400 130" />
              </circle>

              {/* 3 to 4a & 4b */}
              <path d="M400 162 L260 200" className="stroke-[#E4E4E7]" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="2s" repeatCount="indefinite" path="M400 162 L260 200" />
              </circle>

              <path d="M400 162 L540 200" className="stroke-[#E4E4E7]" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="2s" repeatCount="indefinite" path="M400 162 L540 200" />
              </circle>

              {/* 4a & 4b to 5 */}
              <path d="M260 232 L400 270" className="stroke-[#E4E4E7]" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="2s" repeatCount="indefinite" path="M260 232 L400 270" />
              </circle>

              <path d="M540 232 L400 270" className="stroke-[#E4E4E7]" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle r="3" className="fill-[#09090B]">
                <animateMotion dur="2s" repeatCount="indefinite" path="M540 232 L400 270" />
              </circle>

              {/* 5 to 6 */}
              <path d="M400 302 L400 330" className="stroke-[#09090B]/30" strokeWidth="1.5" />
              <circle r="4" className="fill-[#09090B]">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M400 302 L400 330" />
              </circle>

              {/* NODES */}
              {/* 1. User Query */}
              <rect x="350" y="10" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="400" y="30" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">USER QUERY</text>

              {/* 2. Observe */}
              <g className="group cursor-pointer">
                <rect x="310" y="70" width="180" height="32" rx="6" className="fill-white stroke-[#09090B] transition-all duration-300" strokeWidth="1.5" filter="url(#glow)" />
                <text x="400" y="90" className="fill-[#09090B] text-[10px] font-bold tracking-wider" textAnchor="middle">OBSERVE (Intent &amp; Sentiment)</text>
              </g>

              {/* 3. Router */}
              <rect x="350" y="130" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="400" y="150" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">ROUTER</text>

              {/* 4a. Agents */}
              <g className="group cursor-pointer">
                <rect x="170" y="200" width="180" height="32" rx="6" className="fill-white stroke-[#09090B] transition-all duration-300" strokeWidth="1.5" />
                <text x="260" y="220" className="fill-[#09090B] text-[10px] font-bold tracking-wider" textAnchor="middle">SPECIALIZED AGENTS</text>
                <circle cx="185" cy="216" r="3" className="fill-green-500 animate-pulse" />
              </g>

              {/* 4b. RAG / FAISS */}
              <g className="group cursor-pointer">
                <rect x="450" y="200" width="180" height="32" rx="6" className="fill-white stroke-[#09090B] transition-all duration-300" strokeWidth="1.5" />
                <text x="540" y="220" className="fill-[#09090B] text-[10px] font-bold tracking-wider" textAnchor="middle">RAG / FAISS</text>
                <circle cx="465" cy="216" r="3" className="fill-blue-500 animate-pulse" />
              </g>

              {/* 5. Aggregator */}
              <rect x="350" y="270" width="100" height="32" rx="6" className="fill-white stroke-[#E4E4E7]" strokeWidth="1" />
              <text x="400" y="290" className="fill-[#71717A] text-[10px] font-semibold tracking-wider" textAnchor="middle">AGGREGATOR</text>

              {/* 6. Final Response */}
              <g className="group cursor-pointer">
                <rect x="300" y="330" width="200" height="36" rx="8" className="fill-[#09090B] stroke-[#09090B] transition-all duration-300 shadow-xl" strokeWidth="1" />
                <text x="400" y="352" className="fill-white text-[11px] font-bold tracking-wider" textAnchor="middle">FINAL GROUNDED RESPONSE</text>
              </g>

            </svg>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
