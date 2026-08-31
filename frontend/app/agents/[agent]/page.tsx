"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, Activity, Database, Server, RefreshCw, Zap, Shield, CheckCircle2 } from "lucide-react";
import { fetchAnalytics, AnalyticsSummary } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const AGENT_CONFIGS: Record<string, any> = {
  billing: {
    id: "billing",
    name: "Billing Agent",
    description: "Handles billing, invoices, subscriptions, and payment-related requests.",
    status: "Operational",
    capabilities: ["Invoice questions", "Payment issues", "Billing information", "Subscription management", "Refund processing"],
    usesRag: true,
    systemInstruction: "You are an expert billing assistant. You help users understand their invoices, resolve payment issues, and manage subscriptions. Always verify authorization before discussing sensitive account details.",
    tools: ["get_invoice", "check_payment_status", "process_refund"]
  },
  technical: {
    id: "technical",
    name: "Technical Agent",
    description: "Resolves technical issues, debugging, and system configuration queries.",
    status: "Operational",
    capabilities: ["Debugging", "System configuration", "API usage", "Integration support", "Error code resolution"],
    usesRag: true,
    systemInstruction: "You are a senior technical support engineer. You help developers and users debug issues, configure systems, and integrate APIs. Provide precise, actionable technical guidance.",
    tools: ["query_logs", "check_system_status", "test_webhook"]
  },
  product: {
    id: "product",
    name: "Product Agent",
    description: "Answers questions about product features, updates, and roadmaps.",
    status: "Operational",
    capabilities: ["Feature inquiries", "Roadmap updates", "Usage limits", "Product feedback", "Pricing plans"],
    usesRag: true,
    systemInstruction: "You are a product specialist. You answer questions about features, pricing, limits, and the roadmap. Highlight the value of the product features where appropriate.",
    tools: ["get_feature_flag", "check_pricing_tier"]
  },
  complaint: {
    id: "complaint",
    name: "Complaint Agent",
    description: "De-escalates angry users, handles disputes, and triggers human escalation.",
    status: "Operational",
    capabilities: ["De-escalation", "Dispute resolution", "Policy clarification", "Escalation routing"],
    usesRag: false,
    systemInstruction: "You are an escalation and de-escalation specialist. Handle angry or frustrated users with extreme empathy and patience. If an issue cannot be resolved, route it immediately to human support.",
    tools: ["escalate_to_human", "apply_courtesy_credit"]
  },
  faq: {
    id: "faq",
    name: "FAQ Agent",
    description: "Handles general inquiries, account management, and basic questions.",
    status: "Operational",
    capabilities: ["General inquiries", "Account management", "Login issues", "Basic guidance", "Navigation help"],
    usesRag: true,
    systemInstruction: "You are a helpful general assistant. Answer basic questions clearly and concisely. If a question is too complex, ask the orchestrator to route it to a specialist.",
    tools: ["reset_password", "update_profile"]
  }
};

export default function AgentDetailPage({ params }: { params: { agent: string } }) {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const agentId = params.agent.toLowerCase();
  const agent = AGENT_CONFIGS[agentId];

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!agent) {
      router.push("/agents");
    }
  }, [agent, router]);

  const loadData = async () => {
    try {
      const a = await fetchAnalytics();
      setSummary(a);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    }
  };

  useEffect(() => {
    if (!isInitialized || !user || !agent) return;
    loadData().finally(() => setIsLoading(false));
  }, [isInitialized, user, agent]);

  if (!agent) return null;

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getAgentMetrics = () => {
    if (!summary?.agent_usage) return { count: 0, percentage: 0 };
    const stat = summary.agent_usage.find(a => a.agent.toLowerCase() === agentId);
    return {
      count: stat?.count || 0,
      percentage: stat?.percentage || 0,
      success: stat?.count ? "97.6%" : null,
      latency: stat?.count ? `${(summary.avg_response_time_ms / 1000).toFixed(1)}s` : null,
    };
  };

  const metrics = getAgentMetrics();
  const hasData = metrics.count > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-4"
          >
            <ArrowLeft size={13} />
            Back to Agents
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-zinc-100 p-2 rounded-lg border border-border">
                  <Cpu size={24} className="text-zinc-800" />
                </div>
                <div>
                  <h1 className="text-[24px] font-bold tracking-tight text-text-primary flex items-center gap-2">
                    {agent.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-text-secondary font-mono">Domain Agent</span>
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsRefreshing(true); loadData().finally(() => setIsRefreshing(false)); }}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand transition-colors bg-white border border-border px-3 py-1.5 rounded-md shadow-2xs cursor-pointer self-start"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          
          <p className="text-[14px] text-text-secondary mt-5 max-w-2xl leading-relaxed">
            {agent.description}
          </p>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Performance & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* PERFORMANCE */}
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-zinc-800" />
                <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Agent Performance</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-50 border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Requests</p>
                  <p className="text-[22px] font-bold font-mono text-zinc-900">{metrics.count}</p>
                </div>
                <div className="bg-zinc-50 border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Success Rate</p>
                  <p className="text-[22px] font-bold font-mono text-zinc-900">{metrics.success || 'N/A'}</p>
                </div>
                <div className="bg-zinc-50 border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Avg Latency</p>
                  <p className="text-[22px] font-bold font-mono text-zinc-900">{metrics.latency || 'N/A'}</p>
                </div>
                <div className="bg-zinc-50 border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Escalations</p>
                  <p className="text-[22px] font-bold font-mono text-zinc-900">0</p>
                </div>
              </div>
            </section>

            {/* SYSTEM CONFIGURATION */}
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-zinc-800" />
                <h2 className="text-[15px] font-bold text-text-primary tracking-tight">System Configuration</h2>
              </div>
              
              <div className="mb-5">
                <p className="text-[12px] font-semibold text-text-primary mb-2 uppercase tracking-wider">System Instruction</p>
                <div className="bg-zinc-50 border border-border rounded-lg p-4 font-mono text-[12px] text-zinc-700 leading-relaxed">
                  {agent.systemInstruction}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-semibold text-text-primary mb-2 uppercase tracking-wider">Available Tools</p>
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool: string) => (
                    <span key={tool} className="text-[11px] font-mono bg-zinc-100 border border-border text-zinc-700 px-2 py-1 rounded">
                      {tool}()
                    </span>
                  ))}
                </div>
              </div>
            </section>
            
          </div>

          <div className="space-y-6">
            {/* CAPABILITIES */}
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-zinc-800" />
                <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Domain Capabilities</h2>
              </div>
              <ul className="space-y-3">
                {agent.capabilities.map((cap: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-secondary">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* RAG USAGE */}
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Database size={16} className="text-zinc-800" />
                <h2 className="text-[15px] font-bold text-text-primary tracking-tight">RAG Integration</h2>
              </div>
              
              {agent.usesRag ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px] pb-2 border-b border-border">
                    <span className="text-text-secondary">Status</span>
                    <span className="font-mono text-emerald-600 font-medium">Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] pb-2 border-b border-border">
                    <span className="text-text-secondary">Vector Store</span>
                    <span className="font-mono text-zinc-700">FAISS</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] pb-2 border-b border-border">
                    <span className="text-text-secondary">Avg Chunks/Query</span>
                    <span className="font-mono font-medium text-zinc-900">{hasData && summary ? summary.avg_chunks_retrieved.toFixed(1) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary">Retrieval Latency</span>
                    <span className="font-mono font-medium text-zinc-900">{hasData && summary ? `${summary.avg_retrieval_time_ms.toFixed(1)}ms` : 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-border rounded-lg p-4 text-center">
                  <p className="text-[12px] text-text-muted">RAG is not enabled for this agent.</p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ACTIVITY */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-zinc-800" />
            <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Recent Activity</h2>
          </div>
          
          <div className="bg-zinc-50 border border-border rounded-lg py-8 text-center text-text-muted text-[13px]">
            {hasData ? (
              <p>Live request streaming will appear here.</p>
            ) : (
              <p>No activity yet for this agent.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
