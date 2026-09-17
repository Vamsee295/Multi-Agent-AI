"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { HelpFlowLogo } from "@/components/HelpFlowLogo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 border-b border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="group">
          <HelpFlowLogo size="md" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-[#71717A] uppercase tracking-wider">
          <a href="#how-it-works" className="hover:text-[#09090B] transition-colors">How it Works</a>
          <a href="#agents" className="hover:text-[#09090B] transition-colors">Agents</a>
          <a href="#architecture" className="hover:text-[#09090B] transition-colors">Architecture</a>
          <a href="#tech" className="hover:text-[#09090B] transition-colors">Tech</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-[13px] font-semibold text-[#71717A] hover:text-[#09090B] transition-colors">
            Login
          </Link>
          <Link href="/register" className="text-[13px] font-semibold bg-[#09090B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors">
            Get Started →
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[#09090B]" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-[#E4E4E7] px-6 py-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col gap-4 text-[14px] font-semibold text-[#71717A]">
            <a href="#how-it-works" onClick={() => setIsOpen(false)}>How it Works</a>
            <a href="#agents" onClick={() => setIsOpen(false)}>Agents</a>
            <a href="#architecture" onClick={() => setIsOpen(false)}>Architecture</a>
            <a href="#tech" onClick={() => setIsOpen(false)}>Technology</a>
          </div>
          <div className="h-[1px] w-full bg-[#E4E4E7]" />
          <div className="flex flex-col gap-3">
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-center py-2 text-[14px] font-semibold text-[#09090B] border border-[#E4E4E7] rounded-lg">
              Login
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="text-center py-2 text-[14px] font-semibold bg-[#09090B] text-white rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
