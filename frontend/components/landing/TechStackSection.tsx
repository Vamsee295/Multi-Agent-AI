"use client";

import { ScrollReveal } from "./ScrollReveal";

export function TechStackSection() {
  const techs = [
    { category: "Frontend", items: ["React 18", "Next.js 14", "Tailwind CSS", "TypeScript"] },
    { category: "Backend", items: ["Python 3.11", "FastAPI", "Uvicorn", "Pydantic"] },
    { category: "AI & LLMs", items: ["OpenAI GPT-4", "Google Gemini", "Groq Llama 3", "Sentence Transformers"] },
    { category: "Data & Storage", items: ["FAISS Vector Store", "MongoDB Atlas", "PyPDF", "Local Storage"] },
  ];

  return (
    <section id="tech" className="py-24 bg-white border-b border-[#E4E4E7]">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {techs.map((group, idx) => (
            <ScrollReveal key={idx} delay={100 * (idx + 1)} direction="up">
              <div className="flex flex-col">
                <h4 className="text-[14px] font-bold text-[#09090B] mb-4 pb-2 border-b border-[#E4E4E7]">
                  {group.category}
                </h4>
                <ul className="space-y-3">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-[14px] text-[#71717A] flex items-center gap-2 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#09090B]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
