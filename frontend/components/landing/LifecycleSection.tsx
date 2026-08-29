"use client";

import { ScrollReveal } from "./ScrollReveal";

export function LifecycleSection() {
  const steps = [
    {
      num: "01",
      title: "OBSERVE",
      desc: "Analyze incoming queries in real-time to detect user intent, sentiment, and required domain expertise.",
      active: false,
    },
    {
      num: "02",
      title: "PLAN",
      desc: "Decompose complex requests and intelligently route them to the specialized agents best equipped to handle them.",
      active: true,
    },
    {
      num: "03",
      title: "EXECUTE",
      desc: "Agents retrieve semantic context from the FAISS vector database (RAG) and generate accurate, domain-specific responses.",
      active: false,
    },
    {
      num: "04",
      title: "REPLAN",
      desc: "Evaluate the outcome, persist the interaction to short-term memory, and adapt strategy if the query remains unresolved.",
      active: false,
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
          <div className="hidden md:block absolute top-6 left-12 right-12 h-[1px] bg-[#E4E4E7]" />

          {steps.map((step, idx) => (
            <ScrollReveal key={step.num} delay={150 * (idx + 1)} direction="up">
              <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left pt-2">
                
                {/* Number Node */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold tracking-wider mb-6 transition-colors
                  ${step.active ? "bg-[#09090B] text-white shadow-md ring-4 ring-black/5" : "bg-white border border-[#E4E4E7] text-[#71717A]"}
                `}>
                  {step.num}
                </div>

                {/* Title & Desc */}
                <h3 className={`text-[14px] font-bold tracking-widest uppercase mb-3 ${step.active ? "text-[#09090B]" : "text-[#71717A]"}`}>
                  {step.title}
                </h3>
                <p className="text-[14px] text-[#71717A] leading-relaxed max-w-[260px] font-medium">
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
