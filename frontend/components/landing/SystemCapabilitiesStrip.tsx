"use client";

import { ScrollReveal } from "./ScrollReveal";
import { Cpu, Database, Network, Zap } from "lucide-react";

export function SystemCapabilitiesStrip() {
  return (
    <div className="w-full bg-[#FAFAFA] border-y border-[#E4E4E7] py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={200} direction="up" className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E4E4E7] shadow-sm text-[#09090B]">
              <Network size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#09090B]">5 Agents</span>
              <span className="text-[12px] font-medium text-[#71717A] uppercase tracking-wider">Specialized Routing</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#E4E4E7]" />

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E4E4E7] shadow-sm text-[#09090B]">
              <Database size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#09090B]">FAISS / 384d</span>
              <span className="text-[12px] font-medium text-[#71717A] uppercase tracking-wider">all-MiniLM-L6-v2</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#E4E4E7]" />

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E4E4E7] shadow-sm text-[#09090B]">
              <Cpu size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#09090B]">Parallel</span>
              <span className="text-[12px] font-medium text-[#71717A] uppercase tracking-wider">Thread Execution</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-[#E4E4E7]" />

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#E4E4E7] shadow-sm text-[#09090B]">
              <Zap size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#09090B]">Groq LPU</span>
              <span className="text-[12px] font-medium text-[#71717A] uppercase tracking-wider">Ultra-Low Latency</span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-[#E4E4E7]" />

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[12px] font-bold tracking-wider uppercase">System Operational</span>
          </div>

        </ScrollReveal>
      </div>
    </div>
  );
}
