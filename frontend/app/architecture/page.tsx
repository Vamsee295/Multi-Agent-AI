"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Server, Database, Brain, Cpu, MessageSquare, Network, Globe, Activity } from "lucide-react";
import { checkHealth, HealthResponse } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export default function ArchitecturePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  const loadData = async () => {
    try {
      const h = await checkHealth();
      setHealth(h);
    } catch (e) {
      console.error("Failed to fetch health:", e);
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


  const getStatusColor = (status?: string) => {
    if (status === "ok" || status === "Operational") return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (status === "warning") return "text-amber-500 bg-amber-50 border-amber-100";
    if (status === "error") return "text-red-500 bg-red-50 border-red-100";
    return "text-zinc-500 bg-zinc-50 border-zinc-200";
  };

  const getStatusBadge = (status?: string) => {
    return (
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border flex items-center gap-1.5 ${getStatusColor(status)}`}>
        {status === "ok" || status === "Operational" ? (
           <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ONLINE</>
        ) : (
           <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> OFFLINE</>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Workspace
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-1 flex items-center gap-2">
                <Network size={22} className="text-text-primary" />
                System Architecture
              </h1>
              <p className="text-[13px] text-text-secondary">Live orchestration pipeline and component health telemetry.</p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand transition-colors bg-white border border-border px-3 py-1.5 rounded-md shadow-2xs cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Refresh Telemetry
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10">
        
        {/* Architecture Diagram Container */}
        <div className="relative max-w-4xl mx-auto space-y-12">
          
          {/* User & Client Tier */}
          <div className="flex justify-center">
            <div className="w-64 bg-white border-2 border-dashed border-border rounded-xl p-5 text-center shadow-sm relative">
              <Globe size={24} className="text-zinc-400 mx-auto mb-2" />
              <h3 className="text-[14px] font-bold text-zinc-900">Next.js Client</h3>
              <p className="text-[12px] text-text-secondary">React / Tailwind / Supabase</p>
              
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-px h-12 bg-border">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-border" />
              </div>
            </div>
          </div>

          {/* Orchestrator Tier */}
          <div className="flex justify-center relative">
            <div className="w-96 bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6 shadow-xl relative z-10 text-center">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Brain size={20} className="text-white" />
                  <h3 className="text-[16px] font-bold text-white">Multi-Agent Orchestrator</h3>
                </div>
                {getStatusBadge(health?.status || "ok")}
              </div>
              <p className="text-[13px] text-zinc-400 text-left leading-relaxed mb-4">
                The central routing engine. Analyzes user intent, delegates tasks to specialized domain agents, and aggregates responses. Powered by Groq fast inference.
              </p>
              <div className="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-zinc-700">
                <span className="text-[12px] font-mono text-zinc-300">FastAPI Backend</span>
                <span className="text-[11px] bg-zinc-700 text-white px-2 py-0.5 rounded font-medium">v1.2.0</span>
              </div>
            </div>

            {/* Downward connecting lines */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-px h-12 bg-border z-0" />
            <div className="absolute -bottom-12 left-1/4 -translate-x-1/2 w-px h-12 bg-border z-0" />
            <div className="absolute -bottom-12 left-3/4 -translate-x-1/2 w-px h-12 bg-border z-0" />
            
            {/* Horizontal bus */}
            <div className="absolute -bottom-12 left-1/4 right-1/4 h-px bg-border z-0" />
          </div>

          {/* Domain Agents Tier */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
            {/* Agent 1 */}
            <div className="bg-white border-2 border-border rounded-xl p-5 shadow-sm text-center">
               <Cpu size={20} className="text-zinc-700 mx-auto mb-2" />
               <h3 className="text-[14px] font-bold text-zinc-900 mb-1">Billing Agent</h3>
               {getStatusBadge("ok")}
            </div>
            
            {/* Agent 2 */}
            <div className="bg-white border-2 border-border rounded-xl p-5 shadow-sm text-center">
               <Cpu size={20} className="text-zinc-700 mx-auto mb-2" />
               <h3 className="text-[14px] font-bold text-zinc-900 mb-1">Technical Agent</h3>
               {getStatusBadge("ok")}
            </div>

            {/* Agent 3 */}
            <div className="bg-white border-2 border-border rounded-xl p-5 shadow-sm text-center">
               <Cpu size={20} className="text-zinc-700 mx-auto mb-2" />
               <h3 className="text-[14px] font-bold text-zinc-900 mb-1">Product Agent</h3>
               {getStatusBadge("ok")}
            </div>

            {/* Downward connections to services */}
            <div className="absolute -bottom-12 left-1/6 -translate-x-1/2 w-px h-12 bg-border/50 z-0" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-px h-12 bg-border/50 z-0" />
            <div className="absolute -bottom-12 left-5/6 -translate-x-1/2 w-px h-12 bg-border/50 z-0" />
            <div className="absolute -bottom-12 left-1/6 right-1/6 h-px bg-border/50 z-0" />
          </div>

          {/* Infrastructure Tier */}
          <div className="grid grid-cols-3 gap-6 relative z-10 pt-4">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center">
              <Database size={18} className="text-zinc-500 mb-2" />
              <h4 className="text-[12px] font-bold text-zinc-900 mb-1">Supabase Auth & DB</h4>
              {getStatusBadge(health?.database_connected ? "ok" : "error")}
            </div>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center">
              <Activity size={18} className="text-zinc-500 mb-2" />
              <h4 className="text-[12px] font-bold text-zinc-900 mb-1">{health?.llm_provider || 'Groq'} Inference</h4>
              {getStatusBadge(health?.status === "ok" ? "ok" : "error")}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center">
              <Server size={18} className="text-zinc-500 mb-2" />
              <h4 className="text-[12px] font-bold text-zinc-900 mb-1">FAISS Vector Store</h4>
              {getStatusBadge((health?.knowledge_base_chunks_indexed || 0) > 0 ? "ok" : "error")}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
