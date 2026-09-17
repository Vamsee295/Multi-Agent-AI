"use client";

import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";
import {
  MessageSquare,
  Eye,
  GitFork,
  CreditCard,
  Terminal,
  Package,
  HelpCircle,
  Database,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";

export function ArchitectureSection() {
  const [activeNode, setActiveNode] = useState<string | null>("observe");
  const [mobileExpandedNode, setMobileExpandedNode] = useState<string | null>("agents");

  const tooltips: Record<string, { title: string; desc: string; icon: any; tag: string }> = {
    user: {
      title: "User Query",
      desc: "Raw customer message received via real-time WebSocket or REST chat endpoint.",
      icon: MessageSquare,
      tag: "Input Stage",
    },
    observe: {
      title: "Observe Node",
      desc: "Analyzes raw message intent, emotional sentiment (frustration, neutral, positive), and priority urgency using fast inference.",
      icon: Eye,
      tag: "Intent Engine",
    },
    router: {
      title: "Router & Dispatcher",
      desc: "Dynamically routes the structured query to one or multiple domain specialist agents in parallel.",
      icon: GitFork,
      tag: "Orchestrator",
    },
    agents: {
      title: "Specialized Agents",
      desc: "4 isolated agent workers (Billing, Tech, Product, FAQ) process domain-specific logic and query local knowledge.",
      icon: Layers,
      tag: "Multi-Agent Swarm",
    },
    rag: {
      title: "Vector DB (FAISS)",
      desc: "Embeds query chunks and retrieves relevant enterprise policy docs and technical manuals with sub-50ms latency.",
      icon: Database,
      tag: "RAG Memory",
    },
    aggregator: {
      title: "Response Aggregator",
      desc: "Synthesizes multi-agent outputs into a coherent, empathetic, professional response grounded in verified facts.",
      icon: Sparkles,
      tag: "Synthesis Core",
    },
    final: {
      title: "Final Verified Response",
      desc: "Delivered to user with citations, agent attribution, and automated confidence metrics.",
      icon: Sparkles,
      tag: "Delivered Output",
    },
  };

  const agentsList = [
    { id: "billing", name: "Billing Agent", icon: CreditCard },
    { id: "tech", name: "Tech Agent", icon: Terminal },
    { id: "product", name: "Product Agent", icon: Package },
    { id: "faq", name: "FAQ Agent", icon: HelpCircle, active: true },
  ];

  return (
    <section id="architecture" className="py-20 sm:py-28 bg-[#09090B] text-white relative overflow-hidden">
      {/* Subtle monochrome ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal delay={100} direction="up">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              SYSTEM PIPELINE
            </div>
            <h2 className="text-[28px] sm:text-[40px] md:text-[44px] font-bold tracking-tight mb-4">
              How it works.
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#A1A1AA] max-w-2xl mx-auto font-medium leading-relaxed px-2">
              A look under the hood at the orchestration, intent detection, and vector retrieval pipeline. Tap or hover over nodes to see details.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={250} direction="up">
          <div className="max-w-4xl mx-auto bg-[#131316] border border-[#27272A] rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-2xl relative backdrop-blur-sm">
            
            {/* ── DESKTOP / TABLET SVG ARCHITECTURE (md:block) ── */}
            <div className="hidden md:block">
              {/* Tooltip Overlay */}
              <div className="absolute top-6 left-6 w-72 pointer-events-none transition-all duration-300 z-20">
                {activeNode && tooltips[activeNode] && (
                  <div className="bg-[#1C1C21]/95 border border-[#3F3F46] p-4 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-white/10 px-2 py-0.5 rounded">
                        {tooltips[activeNode].tag}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-bold text-white mb-1">
                      {tooltips[activeNode].title}
                    </h4>
                    <p className="text-[12px] text-[#A1A1AA] leading-relaxed">
                      {tooltips[activeNode].desc}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full relative flex items-center justify-center">
                <svg
                  className="w-full h-auto max-w-[780px]"
                  viewBox="0 0 800 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 1. User Node */}
                  <g
                    onMouseEnter={() => setActiveNode("user")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="330"
                      y="10"
                      width="140"
                      height="36"
                      rx="8"
                      className="fill-[#1E1E24] stroke-white/20 hover:stroke-white/60 transition-colors"
                      strokeWidth="1"
                    />
                    <text x="400" y="32" className="fill-white/90 text-[11px] font-bold tracking-widest" textAnchor="middle">
                      USER QUERY
                    </text>
                  </g>

                  {/* Connector 1 -> 2 */}
                  <path d="M400 46 L400 70" className="stroke-white/20" strokeWidth="1.2" />
                  <circle r="3" className="fill-white">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M400 46 L400 70" />
                  </circle>

                  {/* 2. Observe Node */}
                  <g
                    onMouseEnter={() => setActiveNode("observe")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    <rect
                      x="290"
                      y="70"
                      width="220"
                      height="48"
                      rx="10"
                      className="fill-[#1E1E24] stroke-white/40 hover:stroke-white hover:fill-white/10 transition-all"
                      strokeWidth="1.5"
                    />
                    <text x="400" y="92" className="fill-white text-[12px] font-bold tracking-widest" textAnchor="middle">
                      OBSERVE
                    </text>
                    <text x="400" y="108" className="fill-zinc-400 text-[10px] font-medium tracking-wider" textAnchor="middle">
                      Intent &amp; Sentiment Analysis
                    </text>
                  </g>

                  {/* Connector 2 -> 3 */}
                  <path d="M400 118 L400 144" className="stroke-white/20" strokeWidth="1.2" />
                  <circle r="3" className="fill-white">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M400 118 L400 144" />
                  </circle>

                  {/* 3. Router Node */}
                  <g
                    onMouseEnter={() => setActiveNode("router")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="330"
                      y="144"
                      width="140"
                      height="38"
                      rx="8"
                      className="fill-[#1E1E24] stroke-white/30 hover:stroke-white transition-colors"
                      strokeWidth="1.5"
                    />
                    <text x="400" y="167" className="fill-white font-bold text-[11px] tracking-widest" textAnchor="middle">
                      ROUTER
                    </text>
                  </g>

                  {/* Branch lines from Router to 4 Agents */}
                  <path d="M400 182 L400 196" className="stroke-white/20" strokeWidth="1.2" />
                  <path d="M150 196 L650 196" className="stroke-white/20" strokeWidth="1.2" />

                  <path d="M150 196 L150 220" className="stroke-white/20" strokeWidth="1.2" />
                  <circle r="2.5" className="fill-white/60">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M150 196 L150 220" />
                  </circle>

                  <path d="M316 196 L316 220" className="stroke-white/20" strokeWidth="1.2" />
                  <circle r="2.5" className="fill-white/60">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M316 196 L316 220" />
                  </circle>

                  <path d="M483 196 L483 220" className="stroke-white/20" strokeWidth="1.2" />
                  <circle r="2.5" className="fill-white/60">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M483 196 L483 220" />
                  </circle>

                  <path d="M650 196 L650 220" className="stroke-white/50" strokeWidth="1.5" />
                  <circle r="3" className="fill-white">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M650 196 L650 220" />
                  </circle>

                  {/* 4. Agents */}
                  <g
                    onMouseEnter={() => setActiveNode("agents")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect x="85" y="220" width="130" height="38" rx="8" className="fill-[#1E1E24] stroke-white/20 hover:stroke-white transition-all" strokeWidth="1" />
                    <text x="150" y="243" className="fill-zinc-300 text-[11px] font-semibold tracking-wider" textAnchor="middle">
                      BILLING AGENT
                    </text>

                    <rect x="251" y="220" width="130" height="38" rx="8" className="fill-[#1E1E24] stroke-white/20 hover:stroke-white transition-all" strokeWidth="1" />
                    <text x="316" y="243" className="fill-zinc-300 text-[11px] font-semibold tracking-wider" textAnchor="middle">
                      TECH AGENT
                    </text>

                    <rect x="418" y="220" width="130" height="38" rx="8" className="fill-[#1E1E24] stroke-white/20 hover:stroke-white transition-all" strokeWidth="1" />
                    <text x="483" y="243" className="fill-zinc-300 text-[11px] font-semibold tracking-wider" textAnchor="middle">
                      PRODUCT AGENT
                    </text>

                    <rect x="585" y="220" width="130" height="38" rx="8" className="fill-[#27272A] stroke-white/60 hover:stroke-white transition-all" strokeWidth="1.5" />
                    <text x="650" y="243" className="fill-white text-[11px] font-bold tracking-wider" textAnchor="middle">
                      FAQ AGENT
                    </text>
                  </g>

                  {/* Connectors from Agents to RAG Vector DB */}
                  <path d="M150 258 L150 286" className="stroke-white/20" strokeWidth="1.2" />
                  <path d="M316 258 L316 286" className="stroke-white/20" strokeWidth="1.2" />
                  <path d="M483 258 L483 286" className="stroke-white/20" strokeWidth="1.2" />
                  <path d="M650 258 L650 286" className="stroke-white/50" strokeWidth="1.5" />

                  <path d="M150 286 L650 286" className="stroke-white/20" strokeWidth="1.2" />

                  <path d="M400 286 L400 314" className="stroke-white/50" strokeWidth="1.5" />
                  <circle r="3" className="fill-white">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M400 286 L400 314" />
                  </circle>

                  {/* 5. RAG Memory Box */}
                  <g
                    onMouseEnter={() => setActiveNode("rag")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="290"
                      y="314"
                      width="220"
                      height="48"
                      rx="10"
                      className="fill-[#1E1E24] stroke-white/40 hover:stroke-white transition-all"
                      strokeWidth="1.5"
                    />
                    <text x="400" y="335" className="fill-white font-bold text-[12px] tracking-widest" textAnchor="middle">
                      VECTOR DB (FAISS)
                    </text>
                    <text x="400" y="351" className="fill-zinc-400 text-[10px] font-medium tracking-wider" textAnchor="middle">
                      RAG Knowledge Context
                    </text>
                  </g>

                  {/* Connector 5 -> 6 */}
                  <path d="M400 362 L400 388" className="stroke-white/40" strokeWidth="1.5" />
                  <circle r="3" className="fill-white">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M400 362 L400 388" />
                  </circle>

                  {/* 6. Aggregate Node */}
                  <g
                    onMouseEnter={() => setActiveNode("aggregator")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="330"
                      y="388"
                      width="140"
                      height="38"
                      rx="8"
                      className="fill-[#1E1E24] stroke-white/40 hover:stroke-white transition-colors"
                      strokeWidth="1.5"
                    />
                    <text x="400" y="411" className="fill-white font-bold text-[11px] tracking-widest" textAnchor="middle">
                      AGGREGATOR
                    </text>
                  </g>

                  {/* Connector 6 -> 7 */}
                  <path d="M400 426 L400 450" className="stroke-white/50" strokeWidth="1.8" />
                  <circle r="3.5" className="fill-white">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M400 426 L400 450" />
                  </circle>

                  {/* 7. Final Result */}
                  <g
                    onMouseEnter={() => setActiveNode("final")}
                    onMouseLeave={() => setActiveNode(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="300"
                      y="450"
                      width="200"
                      height="42"
                      rx="8"
                      className="fill-[#1E1E24] stroke-white/60 hover:stroke-white hover:fill-[#27272A] transition-all"
                      strokeWidth="1.5"
                    />
                    <text x="400" y="476" className="fill-white text-[12px] font-bold tracking-widest" textAnchor="middle">
                      FINAL RESPONSE
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* ── MOBILE ADAPTIVE PIPELINE (md:hidden) ── */}
            <div className="block md:hidden w-full space-y-3">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-300">
                  <Info size={13} className="text-white" /> Tap any step for details
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Sequential Flow</span>
              </div>

              {/* Step 1: User Query */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "user" ? null : "user")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "user"
                    ? "bg-zinc-800/90 border-white/40 shadow-md"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
                      <MessageSquare size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">1. User Query</div>
                      <div className="text-[11px] text-zinc-400">Inbound support message</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "user" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "user" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.user.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-gradient-to-b from-zinc-700 to-zinc-500 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-white -left-[2px] top-1/2 -translate-y-1/2 absolute animate-ping" />
                </div>
              </div>

              {/* Step 2: Observe Node */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "observe" ? null : "observe")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "observe"
                    ? "bg-zinc-800/90 border-white/40 shadow-lg"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                      <Eye size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">2. Observe Node</div>
                      <div className="text-[11px] text-zinc-400 font-medium">Intent &amp; Sentiment Analysis</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "observe" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "observe" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.observe.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-zinc-700" />
              </div>

              {/* Step 3: Router Node */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "router" ? null : "router")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "router"
                    ? "bg-zinc-800/90 border-white/40 shadow-md"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
                      <GitFork size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">3. Intelligent Router</div>
                      <div className="text-[11px] text-zinc-400">Autonomous Domain Dispatch</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "router" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "router" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.router.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-zinc-700" />
              </div>

              {/* Step 4: 4 Specialized Agents (2x2 Grid) */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "agents" ? null : "agents")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "agents"
                    ? "bg-zinc-900 border-white/40 shadow-lg"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                      <Layers size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">4. Specialized Agents</div>
                      <div className="text-[11px] text-zinc-400">Parallel Domain Processing</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "agents" ? "rotate-180" : ""}`} />
                </div>

                {/* 2x2 Agent Badges Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {agentsList.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div
                        key={agent.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${
                          agent.active
                            ? "bg-zinc-800 border-white/40 text-white"
                            : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <Icon size={13} className={agent.active ? "text-white" : "text-zinc-400"} />
                        <span className="text-[11px] font-semibold tracking-tight truncate">
                          {agent.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {mobileExpandedNode === "agents" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.agents.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-zinc-700" />
              </div>

              {/* Step 5: Vector DB (FAISS) */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "rag" ? null : "rag")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "rag"
                    ? "bg-zinc-800/90 border-white/40 shadow-md"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                      <Database size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">5. Vector DB (FAISS)</div>
                      <div className="text-[11px] text-zinc-400 font-medium">RAG Semantic Retrieval</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "rag" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "rag" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.rag.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-zinc-700" />
              </div>

              {/* Step 6: Aggregator */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "aggregator" ? null : "aggregator")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "aggregator"
                    ? "bg-zinc-800/90 border-white/40 shadow-md"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">6. Aggregator</div>
                      <div className="text-[11px] text-zinc-400">Response Synthesis</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "aggregator" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "aggregator" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed">
                    {tooltips.aggregator.desc}
                  </div>
                )}
              </div>

              {/* Connector line */}
              <div className="flex justify-center my-0.5">
                <div className="w-0.5 h-4 bg-zinc-700" />
              </div>

              {/* Step 7: Final Response */}
              <div
                onClick={() => setMobileExpandedNode(mobileExpandedNode === "final" ? null : "final")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  mobileExpandedNode === "final"
                    ? "bg-zinc-800/90 border-white/60 shadow-lg shadow-black/40"
                    : "bg-[#18181D] border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white tracking-wide uppercase">7. Final Response</div>
                      <div className="text-[11px] text-zinc-400 font-medium">Delivered to Customer</div>
                    </div>
                  </div>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${mobileExpandedNode === "final" ? "rotate-180" : ""}`} />
                </div>
                {mobileExpandedNode === "final" && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/60 text-[12px] text-zinc-300 leading-relaxed font-normal">
                    {tooltips.final.desc}
                  </div>
                )}
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
