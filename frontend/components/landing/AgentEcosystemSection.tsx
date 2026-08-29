"use client";

import { CreditCard, Wrench, PackageSearch, AlertTriangle, FileText, Database } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export function AgentEcosystemSection() {
  const agents = [
    {
      icon: <CreditCard size={20} className="text-[#09090B]" />,
      title: "Billing Agent",
      desc: "Manages payment inquiries, subscription states, invoicing details, and processes refund requests securely.",
    },
    {
      icon: <Wrench size={20} className="text-[#09090B]" />,
      title: "Technical Agent",
      desc: "Troubleshoots system errors, assists with login issues, and guides users through software installation.",
    },
    {
      icon: <PackageSearch size={20} className="text-[#09090B]" />,
      title: "Product Agent",
      desc: "Provides detailed feature breakdowns, pricing comparisons, and real-time product availability.",
    },
    {
      icon: <AlertTriangle size={20} className="text-[#09090B]" />,
      title: "Complaint Agent",
      desc: "Handles customer dissatisfaction, priority escalations, and ensures empathetic resolution pathways.",
    },
    {
      icon: <FileText size={20} className="text-[#09090B]" />,
      title: "FAQ Agent",
      desc: "Instantly retrieves answers regarding company policies, shipping logistics, and warranty documentation.",
    },
    {
      icon: <Database size={20} className="text-[#09090B]" />,
      title: "RAG Memory Core",
      desc: "Powers all agents with semantic search over the FAISS vector database, maintaining multi-turn context.",
    },
  ];

  return (
    <section id="agents" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <ScrollReveal delay={100} direction="up">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-[32px] sm:text-[40px] font-bold text-[#09090B] tracking-tight mb-4 leading-tight">
              One system.<br/>Specialized agents.
            </h2>
            <p className="text-[16px] text-[#71717A] font-medium">
              Instead of relying on a single general-purpose model, Multi-Agent AI utilizes specialized domain experts that collaborate to solve complex support workflows.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, idx) => (
            <ScrollReveal key={idx} delay={100 * (idx + 1)} direction="up">
              <div className="p-7 rounded-2xl border-2 border-[#09090B] bg-white shadow-sm transition-all hover:shadow-lg hover:translate-y-[-2px] h-full flex flex-col justify-start">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-[#09090B]/10 bg-[#F4F4F5]">
                  {agent.icon}
                </div>
                <h3 className="text-[17px] font-bold mb-2 text-[#09090B]">
                  {agent.title}
                </h3>
                <p className="text-[14px] leading-relaxed font-medium text-[#52525B]">
                  {agent.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
