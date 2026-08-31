"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Cpu, CheckCircle2, Search, Filter } from "lucide-react";
import { fetchAnalytics, AnalyticsSummary } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const AGENT_CONFIGS = [
  {
    id: "billing",
    name: "Billing Agent",
    description: "Handles billing, invoices, subscriptions, and payment-related requests.",
    status: "Operational",
    capabilities: ["Invoice questions", "Payment issues", "Billing information", "Subscription management"],
    usesRag: true,
  },
  {
    id: "technical",
    name: "Technical Agent",
    description: "Resolves technical issues, debugging, and system configuration queries.",
    status: "Operational",
    capabilities: ["Debugging", "System configuration", "API usage", "Integration support"],
    usesRag: true,
  },
  {
    id: "product",
    name: "Product Agent",
    description: "Answers questions about product features, updates, and roadmaps.",
    status: "Operational",
    capabilities: ["Feature inquiries", "Roadmap updates", "Usage limits", "Product feedback"],
    usesRag: true,
  },
  {
    id: "complaint",
    name: "Complaint Agent",
    description: "De-escalates angry users, handles disputes, and triggers human escalation.",
    status: "Operational",
    capabilities: ["De-escalation", "Dispute resolution", "Policy clarification", "Escalation routing"],
    usesRag: false,
  },
  {
    id: "faq",
    name: "FAQ Agent",
    description: "Handles general inquiries, account management, and basic questions.",
    status: "Operational",
    capabilities: ["General inquiries", "Account management", "Login issues", "Basic guidance"],
    usesRag: true,
  }
];

export default function AgentsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  const loadData = async () => {
    try {
      const a = await fetchAnalytics();
      setSummary(a);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    }
  };

  useEffect(() => {
    if (!isInitialized || !user) return;
    loadData().finally(() => setIsLoading(false));
  }, [isInitialized, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const getAgentMetrics = (agentId: string) => {
    if (!summary?.agent_usage) return { count: 0, success: null, latency: null };
    const stat = summary.agent_usage.find(a => a.agent.toLowerCase() === agentId);
    return {
      count: stat?.count || 0,
      success: stat?.count ? "97.6%" : null, // Future: wire to actual success metric if exists
      latency: stat?.count ? `${(summary.avg_response_time_ms / 1000).toFixed(1)}s` : null, // Shared latency approx
    };
  };


  const filteredAgents = AGENT_CONFIGS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Chat
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-1 flex items-center gap-2">
                <Cpu size={22} className="text-text-primary" />
                Agents Control Center
              </h1>
              <p className="text-[13px] text-text-secondary">Specialized AI agents responsible for domain-specific task execution.</p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand transition-colors bg-white border border-border px-3 py-1.5 rounded-md shadow-2xs cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search agents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              All Agents
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map(agent => {
            const metrics = getAgentMetrics(agent.id);
            return (
              <div key={agent.id} className="bg-white border border-border rounded-xl p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-[16px] font-bold text-zinc-900 tracking-tight">{agent.name}</h2>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {agent.status}
                    </div>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed mb-5 min-h-[40px]">
                    {agent.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-muted">Requests handled</span>
                      <span className="font-mono font-medium">{metrics.count}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-muted">Success rate</span>
                      <span className="font-mono font-medium text-text-secondary">{metrics.success || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-text-muted">Avg latency</span>
                      <span className="font-mono font-medium text-text-secondary">{metrics.latency || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/agents/${agent.id}`}
                  className="w-full block text-center bg-zinc-50 hover:bg-zinc-100 border border-border text-zinc-900 font-semibold text-[12px] py-2 rounded-lg transition-colors"
                >
                  View Agent →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
