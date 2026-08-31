"use client";

import { ScrollReveal } from "./ScrollReveal";
import { ArrowRight } from "lucide-react";

export function TechStackSection() {
  const techs = [
    { 
      category: "Frontend", 
      items: [
        "React 18",
        "Next.js 14",
        "Tailwind CSS",
        "TypeScript"
      ] 
    },
    { 
      category: "Backend", 
      items: [
        "Python 3.11",
        "FastAPI",
        "Uvicorn",
        "Docker"
      ] 
    },
    { 
      category: "AI & LLMs", 
      items: [
        "Groq LPU",
        "all-MiniLM",
        "Transformers"
      ] 
    },
    { 
      category: "Data & Auth", 
      items: [
        "FAISS",
        "MongoDB",
        "Supabase",
        "JWT"
      ] 
    },
  ];

  return (
    <section id="tech" className="py-24 bg-[#FAFAFA] border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-6">
        
        <ScrollReveal delay={100} direction="up">
          <div className="text-center mb-16">
            <h2 className="text-[12px] font-bold tracking-widest text-[#71717A] uppercase mb-4">
              Built with Real Technology
            </h2>
            <h3 className="text-[28px] sm:text-[36px] font-bold text-[#09090B] tracking-tight">
              Production-grade stack.
            </h3>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {techs.map((group, idx) => (
            <ScrollReveal key={idx} delay={100 * (idx + 1)} direction="up">
              <div className="flex flex-col h-full p-6 bg-white border border-[#E4E4E7] rounded-2xl shadow-sm">
                <h4 className="text-[14px] font-bold text-[#09090B] mb-5 pb-3 border-b border-[#E4E4E7]">
                  {group.category}
                </h4>
                <div className="flex flex-col space-y-3 flex-1">
                  {group.items.map((item, i) => (
                    <div 
                      key={i} 
                      className="group px-3.5 py-2.5 bg-[#F4F4F5] hover:bg-[#09090B] border border-[#E4E4E7] hover:border-[#09090B] rounded-xl transition-all duration-200 flex items-center justify-between cursor-default select-none shadow-none hover:shadow-sm"
                    >
                      <span className="text-[13px] font-bold text-[#09090B] group-hover:text-white transition-all duration-200 group-hover:translate-x-1">
                        {item}
                      </span>
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A1A1AA] group-hover:hidden transition-opacity" />
                        <ArrowRight size={13} className="hidden group-hover:block text-white transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
