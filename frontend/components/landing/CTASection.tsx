"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function CTASection() {
  return (
    <section className="py-32 bg-white text-center border-b border-[#E4E4E7]">
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal delay={100} direction="up">
          <h2 className="text-[36px] sm:text-[48px] font-bold text-[#09090B] tracking-tight mb-6">
            Intelligence isn't one model. <br className="hidden sm:block" />
            <span className="text-[#71717A]">It's an orchestrated system.</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={200} direction="up">
          <p className="text-[16px] sm:text-[18px] text-[#A1A1AA] mb-10 font-medium max-w-xl mx-auto">
            Experience the next generation of autonomous customer support. Deploy specialized agents that collaborate to solve real problems.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={300} direction="up">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#09090B] text-white text-[14px] font-semibold rounded-xl hover:bg-[#27272A] transition-all shadow-sm hover:translate-y-[-1px]"
          >
            ENTER MULTI-AGENT AI <ArrowRight size={16} />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
