"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E4E4E7] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
          
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-[#09090B] mb-4">
              <div className="w-6 h-6 bg-[#09090B] rounded flex items-center justify-center">
                <LayoutGrid size={12} className="text-white" />
              </div>
              <span className="text-[14px] font-bold tracking-widest uppercase">Multi-Agent AI</span>
            </div>
            <p className="text-[13px] text-[#71717A] leading-relaxed font-medium">
              An intelligent customer support system powered by specialized agents, vector retrieval, and Large Language Models.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-24">
            <div>
              <h4 className="text-[13px] font-semibold text-[#09090B] mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-[13px] text-[#71717A] font-medium">
                <li><a href="#how-it-works" className="hover:text-[#09090B] transition-colors">How it Works</a></li>
                <li><a href="#agents" className="hover:text-[#09090B] transition-colors">Specialized Agents</a></li>
                <li><a href="#architecture" className="hover:text-[#09090B] transition-colors">Architecture</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[13px] font-semibold text-[#09090B] mb-4 uppercase tracking-wider">System</h4>
              <ul className="space-y-3 text-[13px] text-[#71717A] font-medium">
                <li><Link href="/login" className="hover:text-[#09090B] transition-colors">Login Workspace</Link></li>
                <li><a href="#tech" className="hover:text-[#09090B] transition-colors">Tech Stack</a></li>
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#09090B] transition-colors">GitHub Repository</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-[#E4E4E7] text-[12px] text-[#A1A1AA]">
          <p>© {new Date().getFullYear()} Multi-Agent AI System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed for autonomous orchestration.</p>
        </div>
      </div>
    </footer>
  );
}
