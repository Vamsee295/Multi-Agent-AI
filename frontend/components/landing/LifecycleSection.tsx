"use client";

import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

export function LifecycleSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const steps = [
    {
      num: "01",
      title: "OBSERVE",
      desc: "Analyze incoming queries in real-time to detect user intent, sentiment, and required domain expertise.",
    },
    {
      num: "02",
      title: "PLAN",
      desc: "Decompose complex requests and intelligently route them to the specialized agents best equipped to handle them.",
    },
    {
      num: "03",
      title: "EXECUTE",
      desc: "Agents retrieve semantic context from the FAISS vector database (RAG) and generate accurate, domain-specific responses.",
    },
    {
      num: "04",
      title: "REPLAN",
      desc: "Evaluate the outcome, persist the interaction to short-term memory, and adapt strategy if the query remains unresolved.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#FAFAFA] border-y border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-6">
        
        <ScrollReveal delay={100} direction="up">
          <div className="text-center mb-16">
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#09090B] tracking-tight mb-4">
              From intention to execution.
            </h2>
            <p className="text-[16px] text-[#71717A] max-w-2xl mx-auto font-medium">
              Our autonomous orchestration pipeline ensures that every request is analyzed, routed, and resolved with precision.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-6 left-12 right-12 h-[1px] bg-[#E4E4E7]">
            {/* Animated progress line */}
            <div 
              className="h-full bg-[#09090B] transition-all duration-700 ease-in-out" 
              style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }} 
            />
          </div>

          {steps.map((step, idx) => (
            <ScrollReveal key={step.num} delay={150 * (idx + 1)} direction="up">
              <div 
                className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left pt-2 cursor-pointer group"
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
              >
                
                {/* Number Node */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold tracking-wider mb-6 transition-all duration-300
                  ${activeIdx === idx ? "bg-[#09090B] text-white shadow-md ring-4 ring-black/5 scale-110" : "bg-white border border-[#E4E4E7] text-[#71717A] group-hover:bg-[#09090B] group-hover:text-white group-hover:border-[#09090B]"}
                `}>
                  {step.num}
                </div>

                {/* Title & Desc */}
                <h3 className={`text-[14px] font-bold tracking-widest uppercase mb-3 transition-colors duration-500 ${activeIdx === idx ? "text-[#09090B]" : "text-[#71717A] group-hover:text-[#3F3F46]"}`}>
                  {step.title}
                </h3>
                <p className={`text-[14px] leading-relaxed max-w-[260px] font-medium transition-colors duration-500 ${activeIdx === idx ? "text-[#3F3F46]" : "text-[#A1A1AA]"}`}>
                  {step.desc}
                </p>
                
                {/* Micro-architecture visual indicator */}
                {activeIdx === idx && (
                  <div className="mt-4 flex gap-1 animate-pulse">
                    <div className="w-2 h-1 bg-[#09090B] rounded-full" />
                    <div className="w-4 h-1 bg-[#09090B] rounded-full" />
                    <div className="w-2 h-1 bg-[#09090B] rounded-full" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
