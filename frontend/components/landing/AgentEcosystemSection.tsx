"use client";

import { useState } from "react";
import { CreditCard, Wrench, PackageSearch, AlertTriangle, FileText, Database, ArrowRight } from "lucide-react";
import { AgentDetailModal, AgentData } from "./AgentDetailModal";
import { ScrollReveal } from "./ScrollReveal";

export function AgentEcosystemSection() {
  const agents: AgentData[] = [
    {
      id: "billing",
      icon: <CreditCard size={22} className="text-white" />,
      title: "Billing Agent",
      subtitle: "PAYMENT & SUBSCRIPTIONS",
      desc: "Specialized intelligence for billing inquiries, subscription lifecycles, and policy-grounded refunds.",
      meta: {
        domain: "Payment & Subscriptions",
        role: "Specialized Agent",
        knowledge: "RAG / FAISS",
        output: "Grounded Billing Response",
      },
      responsibilities: [
        "Billing inquiries & invoices",
        "Subscription & plan questions",
        "Transaction & refund assistance",
        "Policy-grounded billing responses",
      ],
      pipeline: ["User Query", "Intent Detection", "Billing Agent", "RAG / FAISS", "Groq Response"],
      activePipelineIndex: 2,
    },
    {
      id: "technical",
      icon: <Wrench size={22} className="text-white" />,
      title: "Technical Agent",
      subtitle: "TECHNICAL SUPPORT",
      desc: "Specialized intelligence for technical diagnosis, troubleshooting steps, and installation workflows.",
      meta: {
        domain: "Technical Support",
        role: "Specialized Agent",
        knowledge: "RAG / FAISS",
        output: "Troubleshooting Resolution",
      },
      responsibilities: [
        "Technical issue diagnosis",
        "Step-by-step troubleshooting",
        "Login & auth issue resolution",
        "Installation & setup guidance",
      ],
      pipeline: ["User Query", "Intent Detection", "Technical Agent", "RAG / FAISS", "Groq Response"],
      activePipelineIndex: 2,
    },
    {
      id: "product",
      icon: <PackageSearch size={22} className="text-white" />,
      title: "Product Agent",
      subtitle: "PRODUCT INTELLIGENCE",
      desc: "Specialized intelligence for product catalogs, feature comparisons, and availability queries.",
      meta: {
        domain: "Product Intelligence",
        role: "Specialized Agent",
        knowledge: "RAG / FAISS",
        output: "Product Information",
      },
      responsibilities: [
        "Product catalog lookup",
        "Feature & spec explanations",
        "Tier & pricing comparisons",
        "Stock & availability guidance",
      ],
      pipeline: ["User Query", "Intent Detection", "Product Agent", "RAG / FAISS", "Groq Response"],
      activePipelineIndex: 2,
    },
    {
      id: "complaint",
      icon: <AlertTriangle size={22} className="text-white" />,
      title: "Complaint Agent",
      subtitle: "CUSTOMER ESCALATION",
      desc: "Specialized intelligence for dissatisfaction detection, sentiment handling, and priority escalation.",
      meta: {
        domain: "Customer Escalation",
        role: "Specialized Agent",
        knowledge: "Sentiment Analysis",
        output: "Priority Escalation",
      },
      responsibilities: [
        "Complaint & dispute detection",
        "Sentiment-aware tone matching",
        "Priority ticket classification",
        "Human agent escalation trigger",
      ],
      pipeline: ["User Query", "Intent Detection", "Sentiment Analysis", "Complaint Agent", "Escalation / Response"],
      activePipelineIndex: 3,
    },
    {
      id: "faq",
      icon: <FileText size={22} className="text-white" />,
      title: "FAQ Agent",
      subtitle: "KNOWLEDGE-BASED SUPPORT",
      desc: "Specialized intelligence for knowledge base search, policy lookup, and documentation answers.",
      meta: {
        domain: "Knowledge-Based Support",
        role: "Specialized Agent",
        knowledge: "Documentation / FAISS",
        output: "Grounded FAQ Response",
      },
      responsibilities: [
        "General FAQ resolution",
        "Documentation search",
        "Company policy retrieval",
        "Knowledge-grounded answers",
      ],
      pipeline: ["User Query", "Intent Detection", "FAQ Agent", "Semantic Retrieval", "Groq Response"],
      activePipelineIndex: 2,
    },
    {
      id: "rag",
      icon: <Database size={22} className="text-white" />,
      title: "RAG Memory Core",
      subtitle: "SHARED KNOWLEDGE & RETRIEVAL LAYER",
      desc: "Shared vector memory infrastructure supplying dense semantic context across all domain agents.",
      meta: {
        domain: "Shared Knowledge Layer",
        role: "Vector Memory Core",
        knowledge: "FAISS Index / Embeddings",
        output: "Semantic Context Chunks",
      },
      responsibilities: [
        "Query embedding generation",
        "FAISS dense similarity search",
        "Context chunk extraction",
        "Grounding for domain agents",
      ],
      pipeline: ["User Query", "Embeddings", "FAISS Search", "Context Chunks", "Agent Context"],
      activePipelineIndex: 2,
      isInfrastructure: true,
    },
  ];

  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  return (
    <section id="agents" className="py-24 bg-white border-b border-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal delay={100} direction="up">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-[12px] font-bold tracking-widest text-[#71717A] uppercase mb-4">
              Orchestrated Domain Experts
            </h2>
            <h3 className="text-[32px] sm:text-[40px] font-bold text-[#09090B] tracking-tight mb-4 leading-tight">
              One system.<br />Specialized agents.
            </h3>
            <p className="text-[16px] text-[#71717A] font-medium leading-relaxed">
              Instead of relying on a single general-purpose prompt, Multi-Agent AI routes queries to autonomous domain specialists grounded by a shared retrieval core.
            </p>
          </div>
        </ScrollReveal>

        {/* 6-Grid Agent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, idx) => (
            <ScrollReveal key={idx} delay={100 * (idx + 1)} direction="up">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedAgent(agent);
                  }
                }}
                onClick={() => setSelectedAgent(agent)}
                className={`p-7 rounded-2xl border transition-all duration-200 h-full flex flex-col justify-between cursor-pointer group relative select-none
                  ${
                    agent.isInfrastructure
                      ? "border-[#D4D4D8] bg-[#FAFAFA] hover:border-[#09090B] hover:bg-white shadow-sm hover:shadow-md hover:-translate-y-1"
                      : "border-[#E4E4E7] bg-white hover:border-[#09090B] shadow-sm hover:shadow-md hover:-translate-y-1"
                  }
                `}
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#09090B] text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                      {agent.icon}
                    </div>
                    {agent.isInfrastructure ? (
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-[#E4E4E7] text-[#3F3F46] rounded-md">
                        INFRASTRUCTURE
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#A1A1AA] group-hover:text-[#09090B] transition-colors">
                        <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    )}
                  </div>

                  <h4 className="text-[18px] font-bold mb-1 text-[#09090B] tracking-tight">
                    {agent.title}
                  </h4>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-[#71717A] uppercase mb-3">
                    {agent.subtitle}
                  </p>
                  <p className="text-[14px] leading-relaxed font-medium text-[#52525B]">
                    {agent.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F4F4F5] flex items-center justify-between text-[12px] font-medium text-[#71717A] group-hover:text-[#09090B] transition-colors">
                  <span>Inspect agent node</span>
                  <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Centered Modal */}
      <AgentDetailModal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        agent={selectedAgent}
      />
    </section>
  );
}
