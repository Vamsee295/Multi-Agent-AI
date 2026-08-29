"use client";

import { ScrollReveal } from "./ScrollReveal";

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-24 bg-[#09090B] text-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <ScrollReveal delay={100} direction="up">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight mb-4">
              How it works.
            </h2>
            <p className="text-[16px] text-[#A1A1AA] max-w-2xl mx-auto font-medium">
              A look under the hood at the orchestration, intent detection, and vector retrieval pipeline.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={250} direction="up">
          <div className="max-w-4xl mx-auto bg-[#18181B] border border-[#27272A] rounded-2xl p-8 sm:p-12 overflow-x-auto shadow-2xl">
            {/* Minimalist Architecture Diagram */}
            <div className="min-w-[600px] h-[400px] relative">
              <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                {/* User Node */}
                <rect x="340" y="0" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="400" y="22" className="fill-white/80 text-[11px] font-medium tracking-widest" textAnchor="middle">USER QUERY</text>
                
                {/* Arrow Down */}
                <path d="M400 36 L400 70" className="stroke-white/20" strokeWidth="1" />
                <polygon points="397,66 403,66 400,70" className="fill-white/20" />

                {/* Orchestrator / Router */}
                <rect x="300" y="70" width="200" height="44" rx="8" className="fill-white/10 stroke-white/40" strokeWidth="1.5" />
                <text x="400" y="96" className="fill-white text-[12px] font-bold tracking-widest" textAnchor="middle">AI ORCHESTRATOR</text>

                {/* Arrows to Agents */}
                <path d="M400 114 L400 130" className="stroke-white/20" strokeWidth="1" />
                <path d="M150 130 L650 130" className="stroke-white/20" strokeWidth="1" />
                
                <path d="M150 130 L150 160" className="stroke-white/20" strokeWidth="1" />
                <polygon points="147,156 153,156 150,160" className="fill-white/20" />
                
                <path d="M316 130 L316 160" className="stroke-white/20" strokeWidth="1" />
                <polygon points="313,156 319,156 316,160" className="fill-white/20" />

                <path d="M483 130 L483 160" className="stroke-white/20" strokeWidth="1" />
                <polygon points="480,156 486,156 483,160" className="fill-white/20" />

                <path d="M650 130 L650 160" className="stroke-white/40" strokeWidth="1.5" />
                <polygon points="647,156 653,156 650,160" className="fill-white/40" />
                
                <circle cx="650" cy="145" r="3" className="fill-white animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />

                {/* Agents */}
                <rect x="90" y="160" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="150" y="182" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">BILLING AGENT</text>

                <rect x="256" y="160" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="316" y="182" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">TECH AGENT</text>

                <rect x="423" y="160" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="483" y="182" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">PRODUCT AGENT</text>

                <rect x="590" y="160" width="120" height="36" rx="6" className="fill-white/10 stroke-white/40" strokeWidth="1" />
                <text x="650" y="182" className="fill-white text-[11px] font-bold tracking-wider" textAnchor="middle">FAQ AGENT</text>

                {/* Arrows to RAG/Memory */}
                <path d="M150 196 L150 220" className="stroke-white/20" strokeWidth="1" />
                <path d="M316 196 L316 220" className="stroke-white/20" strokeWidth="1" />
                <path d="M483 196 L483 220" className="stroke-white/20" strokeWidth="1" />
                <path d="M650 196 L650 220" className="stroke-white/40" strokeWidth="1.5" />
                <path d="M150 220 L650 220" className="stroke-white/20" strokeWidth="1" />
                
                <path d="M400 220 L400 250" className="stroke-white/40" strokeWidth="1.5" />
                <polygon points="397,246 403,246 400,250" className="fill-white/40" />

                {/* RAG Memory Box */}
                <rect x="300" y="250" width="200" height="50" rx="8" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="400" y="274" className="fill-white/90 text-[12px] font-bold tracking-widest" textAnchor="middle">VECTOR DB (FAISS)</text>
                <text x="400" y="290" className="fill-white/50 text-[10px] font-medium tracking-widest" textAnchor="middle">RAG MEMORY</text>

                {/* Arrow to Result */}
                <path d="M400 300 L400 340" className="stroke-white/40" strokeWidth="1.5" />
                <polygon points="397,336 403,336 400,340" className="fill-white/40" />
                <circle cx="400" cy="320" r="3" className="fill-white animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />

                {/* Result */}
                <rect x="320" y="340" width="160" height="40" rx="6" className="fill-white stroke-white" strokeWidth="1" />
                <text x="400" y="364" className="fill-[#09090B] text-[12px] font-bold tracking-widest" textAnchor="middle">FINAL RESPONSE</text>

              </svg>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
