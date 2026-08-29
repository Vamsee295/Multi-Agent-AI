"use client";

import { LayoutGrid } from "lucide-react";

export function AIExperiencePanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center w-[50%] bg-[#111111] text-white p-12 xl:p-24 relative overflow-hidden">
      {/* Subtle background glow effects matching the image */}
      <div className="absolute top-[20%] right-[15%] w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[480px] mx-auto flex flex-col items-start">
        
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
          Welcome to the future of<br />productivity
        </h1>
        
        {/* Supporting Text */}
        <p className="text-[16px] text-[#A1A1AA] leading-relaxed max-w-[420px] mb-20 font-medium">
          Join thousands of teams who trust our platform to streamline their workflow and boost collaboration.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 w-full max-w-[400px]">
          <div>
            <div className="text-[24px] font-bold text-white mb-1">50K+</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Active Users</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white mb-1">99.9%</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Uptime</div>
          </div>
          <div>
            <div className="text-[24px] font-bold text-white mb-1">24/7</div>
            <div className="text-[13px] text-[#A1A1AA] font-medium">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
