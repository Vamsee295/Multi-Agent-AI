"use client";

import { LayoutGrid, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AIExperiencePanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center w-[50%] bg-[#111111] text-white p-12 xl:p-24 relative overflow-hidden">
      {/* Subtle background glow effects matching the image */}
      <div className="absolute top-[20%] right-[15%] w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Navigation */}
      <div className="absolute top-12 left-12 xl:top-16 xl:left-16 z-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[480px] mx-auto flex flex-col items-start mt-8">
        
        {/* Brand */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-white">
            MULTI-AGENT AI
          </span>
        </div>
        
        {/* Headline */}
        <h1 className="text-[40px] xl:text-[48px] font-bold tracking-tight leading-[1.1] mb-6 text-white">
          Autonomous intelligence,<br />orchestrated.
        </h1>
        
        {/* Supporting Text */}
        <p className="text-[16px] text-[#A1A1AA] leading-relaxed max-w-[420px] mb-20 font-medium">
          A real-time orchestration pipeline where user intent is observed, routed to specialized agents, context is retrieved, and responses are intelligently aggregated.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 w-full max-w-[400px]">
          <div>
            <div className="text-[24px] font-bold text-white mb-1">4</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Domain Agents</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white mb-1">FAISS</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Vector Memory</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white mb-1">Groq</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Llama Inference</div>
          </div>
        </div>
      </div>
    </div>
  );
}
