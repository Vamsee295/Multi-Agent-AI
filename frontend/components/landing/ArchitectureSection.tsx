"use client";

import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

export function ArchitectureSection() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const tooltips: Record<string, { title: string, desc: string }> = {
    observe: { title: "Observe Node", desc: "Detects user intent and sentiment using a lightweight LLM model before dispatching." },
    router: { title: "Router", desc: "Directs the structured query to the most appropriate specialized agents based on intent." },
    agents: { title: "Specialized Agents", desc: "Domain-specific agents (Billing, Tech, Product, FAQ) process the query in parallel." },
    rag: { title: "Vector DB (FAISS)", desc: "Retrieves semantically similar documentation and context for the agents." },
    aggregator: { title: "Aggregator", desc: "Synthesizes multiple agent responses into a single cohesive answer via Groq LLM." },
  };

  return (
    <section id="architecture" className="py-24 bg-[#09090B] text-white relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <ScrollReveal delay={100} direction="up">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight mb-4">
              How it works.
            </h2>
            <p className="text-[16px] text-[#A1A1AA] max-w-2xl mx-auto font-medium">
              A look under the hood at the orchestration, intent detection, and vector retrieval pipeline. Hover over nodes to see details.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={250} direction="up">
          <div className="max-w-4xl mx-auto bg-[#18181B] border border-[#27272A] rounded-2xl p-8 sm:p-12 shadow-2xl relative">
            
            {/* Tooltip Overlay */}
            <div className="absolute top-8 left-8 w-64 h-32 pointer-events-none transition-opacity duration-300">
              {activeNode && tooltips[activeNode] && (
                <div className="bg-[#27272A] border border-[#3F3F46] p-4 rounded-xl shadow-xl">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider mb-2">{tooltips[activeNode].title}</h4>
                  <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{tooltips[activeNode].desc}</p>
                </div>
              )}
            </div>

            {/* Minimalist Architecture Diagram */}
            <div className="w-full h-[500px] relative overflow-x-auto">
              <svg className="min-w-[600px] w-full h-full" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                {/* 1. User Node */}
                <rect x="340" y="0" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20" strokeWidth="1" />
                <text x="400" y="22" className="fill-white/80 text-[11px] font-medium tracking-widest" textAnchor="middle">USER QUERY</text>
                
                <path d="M400 36 L400 60" className="stroke-white/20" strokeWidth="1" />
                <circle r="3" className="fill-white">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M400 36 L400 60" />
                </circle>

                {/* 2. Observe Node */}
                <g 
                  onMouseEnter={() => setActiveNode("observe")} 
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer transition-all duration-300 hover:opacity-80"
                >
                  <rect x="300" y="60" width="200" height="44" rx="8" className="fill-white/10 stroke-white/40" strokeWidth="1.5" />
                  <text x="400" y="80" className="fill-white text-[12px] font-bold tracking-widest" textAnchor="middle">OBSERVE</text>
                  <text x="400" y="96" className="fill-white/60 text-[10px] font-medium tracking-wider" textAnchor="middle">Intent &amp; Sentiment</text>
                </g>
                
                <path d="M400 104 L400 130" className="stroke-white/20" strokeWidth="1" />
                <circle r="3" className="fill-white">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M400 104 L400 130" />
                </circle>

                {/* 3. Router Node */}
                <g 
                  onMouseEnter={() => setActiveNode("router")} 
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer transition-all duration-300 hover:opacity-80"
                >
                  <rect x="340" y="130" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/40" strokeWidth="1.5" />
                  <text x="400" y="152" className="fill-white/90 text-[11px] font-bold tracking-widest" textAnchor="middle">ROUTER</text>
                </g>

                {/* Arrows to Agents */}
                <path d="M400 166 L400 180" className="stroke-white/20" strokeWidth="1" />
                <path d="M150 180 L650 180" className="stroke-white/20" strokeWidth="1" />
                
                <path d="M150 180 L150 210" className="stroke-white/20" strokeWidth="1" />
                <circle r="2" className="fill-white/60"><animateMotion dur="2s" repeatCount="indefinite" path="M150 180 L150 210" /></circle>
                
                <path d="M316 180 L316 210" className="stroke-white/20" strokeWidth="1" />
                <circle r="2" className="fill-white/60"><animateMotion dur="2s" repeatCount="indefinite" path="M316 180 L316 210" /></circle>

                <path d="M483 180 L483 210" className="stroke-white/20" strokeWidth="1" />
                <circle r="2" className="fill-white/60"><animateMotion dur="2s" repeatCount="indefinite" path="M483 180 L483 210" /></circle>

                <path d="M650 180 L650 210" className="stroke-white/40" strokeWidth="1.5" />
                <circle r="3" className="fill-white"><animateMotion dur="1.5s" repeatCount="indefinite" path="M650 180 L650 210" /></circle>
                
                {/* 4. Agents */}
                <g 
                  onMouseEnter={() => setActiveNode("agents")} 
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer"
                >
                  <rect x="90" y="210" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20 hover:stroke-white/60 transition-all duration-300" strokeWidth="1" />
                  <text x="150" y="232" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">BILLING AGENT</text>

                  <rect x="256" y="210" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20 hover:stroke-white/60 transition-all duration-300" strokeWidth="1" />
                  <text x="316" y="232" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">TECH AGENT</text>

                  <rect x="423" y="210" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/20 hover:stroke-white/60 transition-all duration-300" strokeWidth="1" />
                  <text x="483" y="232" className="fill-white/70 text-[11px] font-medium tracking-wider" textAnchor="middle">PRODUCT AGENT</text>

                  <rect x="590" y="210" width="120" height="36" rx="6" className="fill-white/10 stroke-white/60 hover:stroke-white transition-all duration-300" strokeWidth="1.5" />
                  <text x="650" y="232" className="fill-white text-[11px] font-bold tracking-wider" textAnchor="middle">FAQ AGENT</text>
                </g>

                {/* Arrows to RAG/Memory */}
                <path d="M150 246 L150 280" className="stroke-white/20" strokeWidth="1" />
                <path d="M316 246 L316 280" className="stroke-white/20" strokeWidth="1" />
                <path d="M483 246 L483 280" className="stroke-white/20" strokeWidth="1" />
                <path d="M650 246 L650 280" className="stroke-white/40" strokeWidth="1.5" />
                
                <path d="M150 280 L650 280" className="stroke-white/20" strokeWidth="1" />
                
                <path d="M400 280 L400 310" className="stroke-white/40" strokeWidth="1.5" />
                <circle r="3" className="fill-white"><animateMotion dur="1.5s" repeatCount="indefinite" path="M400 280 L400 310" /></circle>

                {/* 5. RAG Memory Box */}
                <g 
                  onMouseEnter={() => setActiveNode("rag")} 
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <rect x="300" y="310" width="200" height="44" rx="8" className="fill-[#27272A] stroke-white/40" strokeWidth="1.5" />
                  <text x="400" y="330" className="fill-white/90 text-[12px] font-bold tracking-widest" textAnchor="middle">VECTOR DB (FAISS)</text>
                  <text x="400" y="346" className="fill-white/50 text-[10px] font-medium tracking-widest" textAnchor="middle">RAG Context</text>
                </g>

                <path d="M400 354 L400 380" className="stroke-white/40" strokeWidth="1.5" />
                <circle r="3" className="fill-white"><animateMotion dur="2s" repeatCount="indefinite" path="M400 354 L400 380" /></circle>

                {/* 6. Aggregate Node */}
                <g 
                  onMouseEnter={() => setActiveNode("aggregator")} 
                  onMouseLeave={() => setActiveNode(null)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <rect x="340" y="380" width="120" height="36" rx="6" className="fill-[#27272A] stroke-white/40" strokeWidth="1.5" />
                  <text x="400" y="402" className="fill-white/90 text-[11px] font-bold tracking-widest" textAnchor="middle">AGGREGATOR</text>
                </g>

                <path d="M400 416 L400 440" className="stroke-white/40" strokeWidth="1.5" />
                <circle r="4" className="fill-white"><animateMotion dur="1.5s" repeatCount="indefinite" path="M400 416 L400 440" /></circle>

                {/* 7. Final Result */}
                <rect x="320" y="440" width="160" height="40" rx="6" className="fill-white stroke-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" strokeWidth="1" />
                <text x="400" y="464" className="fill-[#09090B] text-[12px] font-bold tracking-widest" textAnchor="middle">FINAL RESPONSE</text>

              </svg>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
