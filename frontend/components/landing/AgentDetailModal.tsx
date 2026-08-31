"use client";

import React, { useEffect, useRef } from "react";
import { X, ArrowRight, ArrowDown } from "lucide-react";

export type AgentData = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  desc: string;
  meta: {
    domain: string;
    role: string;
    knowledge: string;
    output: string;
  };
  responsibilities: string[];
  pipeline: string[];
  activePipelineIndex?: number;
  isInfrastructure?: boolean;
};

interface AgentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentData | null;
}

export function AgentDetailModal({ isOpen, onClose, agent }: AgentDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !agent) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-3xl bg-white border border-[#E4E4E7] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-[#E4E4E7] bg-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#09090B] text-white flex items-center justify-center shrink-0 shadow-sm">
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="agent-modal-title" className="text-[20px] sm:text-[24px] font-bold text-[#09090B] tracking-tight">
                  {agent.title}
                </h3>
                {agent.isInfrastructure && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-[#F4F4F5] border border-[#E4E4E7] rounded-md text-[#52525B]">
                    INFRASTRUCTURE
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono font-bold tracking-widest text-[#71717A] uppercase mt-0.5">
                {agent.subtitle}
              </p>
              <p className="text-[13px] sm:text-[14px] font-medium text-[#52525B] mt-2 leading-relaxed max-w-xl">
                {agent.desc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-2 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 max-h-[calc(85vh-180px)]">
          {/* 2x2 Architectural Metadata Grid */}
          <div>
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#71717A] uppercase mb-3">
              Architecture Metadata
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl">
                <span className="block text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider">
                  Domain
                </span>
                <span className="block text-[13px] font-bold text-[#09090B] mt-1 leading-snug">
                  {agent.meta.domain}
                </span>
              </div>
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl">
                <span className="block text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider">
                  Role
                </span>
                <span className="block text-[13px] font-bold text-[#09090B] mt-1 leading-snug">
                  {agent.meta.role}
                </span>
              </div>
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl">
                <span className="block text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider">
                  Knowledge
                </span>
                <span className="block text-[13px] font-bold text-[#09090B] mt-1 leading-snug">
                  {agent.meta.knowledge}
                </span>
              </div>
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl">
                <span className="block text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider">
                  Output
                </span>
                <span className="block text-[13px] font-bold text-[#09090B] mt-1 leading-snug">
                  {agent.meta.output}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Execution Flow */}
          <div>
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#71717A] uppercase mb-3">
              Pipeline Execution Flow
            </h4>
            <div className="p-4 sm:p-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl">
              {/* Desktop / Tablet Horizontal Pipeline */}
              <div className="hidden sm:flex items-center justify-between gap-1.5 overflow-x-auto py-2">
                {agent.pipeline.map((step, idx) => {
                  const isActive = idx === agent.activePipelineIndex;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all text-center shrink-0 border
                          ${
                            isActive
                              ? "bg-[#09090B] text-white border-[#09090B] shadow-md ring-2 ring-black/5"
                              : "bg-white text-[#52525B] border-[#E4E4E7]"
                          }`}
                      >
                        {step}
                      </div>
                      {idx < agent.pipeline.length - 1 && (
                        <ArrowRight size={14} className="text-[#A1A1AA] shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile Vertical Pipeline */}
              <div className="flex sm:hidden flex-col space-y-2">
                {agent.pipeline.map((step, idx) => {
                  const isActive = idx === agent.activePipelineIndex;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        className={`px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all text-left border
                          ${
                            isActive
                              ? "bg-[#09090B] text-white border-[#09090B] shadow-sm"
                              : "bg-white text-[#52525B] border-[#E4E4E7]"
                          }`}
                      >
                        {step}
                      </div>
                      {idx < agent.pipeline.length - 1 && (
                        <div className="pl-4 py-0.5 text-[#A1A1AA]">
                          <ArrowDown size={14} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core Responsibilities */}
          <div>
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-[#71717A] uppercase mb-3">
              Core Responsibilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {agent.responsibilities.map((resp, i) => (
                <div
                  key={i}
                  className="px-3.5 py-2.5 bg-white border border-[#E4E4E7] rounded-xl flex items-center gap-3 text-[13px] font-medium text-[#3F3F46]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#09090B] shrink-0" />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <span className="text-[12px] font-mono text-[#71717A]">
            Node Inspection • Multi-Agent AI
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#09090B] hover:bg-[#27272A] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
