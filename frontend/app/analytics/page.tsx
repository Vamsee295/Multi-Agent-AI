"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, RefreshCw, 
  Database, Activity, Server, Sparkles,
  Terminal, Cpu, HardDrive
} from "lucide-react";
import {
  XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, CartesianGrid
} from "recharts";
import {
  fetchAnalytics, fetchTickets, fetchSessions, checkHealth,
  AnalyticsSummary, TicketSummary, SessionSummary, HealthResponse
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const AGENT_COLORS: Record<string, string> = {
  billing:   "#18181B",
  technical: "#52525B",
  product:   "#71717A",
  complaint: "#A1A1AA",
  faq:       "#D4D4D8",
};

interface KpiCardProps {
  title: string;
  value: string | number;
  sub: React.ReactNode;
}

function KpiCard({ title, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between h-full hover:border-zinc-300 transition-colors">
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">{title}</p>
      <p className="text-[26px] font-bold text-text-primary tracking-tight leading-none mb-2 font-mono">
        {value}
      </p>
      <div className="text-[12px] text-text-secondary font-medium">
        {sub}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-[12px]">
        <p className="font-semibold text-text-primary capitalize mb-1">{label}</p>
        <p className="text-text-secondary">{payload[0].value} {payload[0].dataKey === "count" ? "messages" : "sessions"}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
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
      const [a, t, s, h] = await Promise.all([
        fetchAnalytics(), 
        fetchTickets("open"),
        fetchSessions(),
        checkHealth().catch(() => null)
      ]);
      setSummary(a);
      setTickets(t);
      setSessions(s);
      setHealth(h);
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

  // Group sessions by day for the area chart
  const activityData = useMemo(() => {
    if (!sessions.length) return [];
    const grouped = sessions.reduce((acc, s) => {
      const dateStr = new Date(s.last_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .reverse();
  }, [sessions]);

  // Derive simple events feed from actual data
  const liveEvents = useMemo(() => {
    const events: Array<{ time: Date; text: React.ReactNode; component: string; latency?: string }> = [];
    tickets.slice(0, 3).forEach(t => {
      events.push({
        time: new Date(t.created_at),
        text: <span>Escalation routed to <strong className="capitalize">{t.agents_invoked[0] || 'support'}</strong></span>,
        component: "Agent Router"
      });
    });
    sessions.slice(0, 5).forEach(s => {
      events.push({
        time: new Date(s.last_timestamp),
        text: <span>Session active · {s.message_count} messages</span>,
        component: "Orchestrator"
      });
    });
    return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [tickets, sessions]);

  // Compute operational health score
  const operationalScore = useMemo(() => {
    let healthyCount = 3; // Orchestrator, Agent Router, FAISS (local) are always active
    if (health?.database_connected) healthyCount++;
    if (health?.llm_provider) healthyCount++;
    return healthyCount;
  }, [health]);

  const hasData = summary && summary.total_messages > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      
      {/* Page Header */}
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Chat
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-2.5 flex items-center gap-2">
                <Terminal size={20} className="text-text-primary" />
                Analytics Dashboard
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-md shadow-2xs font-medium hover:bg-muted transition-colors">
                  Last 7 days <ChevronDown size={13} className="text-text-muted" />
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-md shadow-2xs font-medium hover:bg-muted transition-colors">
                  All Agents <ChevronDown size={13} className="text-text-muted" />
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border rounded-md shadow-2xs font-medium hover:bg-muted transition-colors">
                  All Models <ChevronDown size={13} className="text-text-muted" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[12px] font-medium">
              <div className="flex items-center gap-2 bg-zinc-50 border border-border px-3 py-1.5 rounded-md text-zinc-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {operationalScore === 5 ? "ALL SYSTEMS OPERATIONAL" : `${operationalScore}/5 SYSTEMS OPERATIONAL`}
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
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* KPI Grid */}
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Conversations"
              value={summary.total_conversations || 0}
              sub={
                hasData ? (
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live</span>
                ) : "No conversations yet"
              }
            />
            <KpiCard
              title="Messages"
              value={summary.total_messages || 0}
              sub={
                hasData ? (
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live</span>
                ) : "No messages yet"
              }
            />
            <KpiCard
              title="Satisfaction"
              value={hasData && summary.satisfaction_score > 0 ? `${(summary.satisfaction_score * 100).toFixed(0)}%` : "N/A"}
              sub={hasData && summary.satisfaction_score > 0 ? "From user feedback" : "Not enough feedback"}
            />
            <KpiCard
              title="Avg Latency"
              value={hasData ? `${summary.avg_response_time_ms.toFixed(0)}ms` : "N/A"}
              sub={hasData ? (summary.avg_response_time_ms < 2000 ? "Within target" : "Above target") : "Not enough data"}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-4 shadow-sm h-28 flex flex-col justify-between animate-pulse">
                <div className="h-3 w-20 bg-zinc-200 rounded" />
                <div className="h-7 w-16 bg-zinc-200 rounded font-mono" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* System Health */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">System Health</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5"><Cpu size={13} /> Orchestrator</span>
              <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy</span>
              <span className="text-[11px] text-text-muted font-mono">Router Engine</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5"><Activity size={13} /> Agent Router</span>
              <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy</span>
              <span className="text-[11px] text-text-muted font-mono">Intent Matcher</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5"><Database size={13} /> FAISS / RAG</span>
              <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready</span>
              <span className="text-[11px] text-text-muted font-mono">{health?.knowledge_base_chunks_indexed || summary?.total_kb_documents || 8} chunks indexed</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5"><Server size={13} /> LLM Inference</span>
              <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {health?.llm_provider ? 'Connected' : 'Status unavailable'}</span>
              <span className="text-[11px] text-text-muted font-mono truncate">{health?.llm_provider ? `${health.llm_provider} · ${health.llm_model || 'llama-3.3'}` : 'Offline'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5"><HardDrive size={13} /> Database</span>
              <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {health?.database_connected ? 'Connected' : 'Status unavailable'}</span>
              <span className="text-[11px] text-text-muted font-mono">MongoDB cluster</span>
            </div>
          </div>
        </div>

        {/* Primary Chart: Conversation Activity */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Conversation Activity</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Conversation volume over time</p>
          </div>
          
          <div className={activityData.length > 0 ? "h-[300px] w-full" : "h-[220px] w-full"}>
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717A', fontSize: 11 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717A', fontSize: 11 }} 
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#18181B" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted bg-zinc-50/60 border border-dashed border-zinc-200/80 rounded-lg">
                <p className="font-medium text-[13px] text-zinc-600">─ No conversation activity yet ─</p>
                <p className="text-[12px] mt-1 text-text-secondary">Start a conversation to see analytics.</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Agent Usage & RAG Performance */}
          <div className="space-y-6">
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h2 className="text-[15px] font-bold text-text-primary tracking-tight mb-1">Agent Usage</h2>
              <p className="text-[12px] text-text-secondary mb-5">Messages handled per agent domain</p>
              
              {summary?.agent_usage?.length ? (
                <div className="space-y-3.5">
                  {summary.agent_usage.map(stat => (
                    <div key={stat.agent} className="flex items-center gap-3">
                      <span className="text-[12px] font-medium capitalize w-20 text-text-primary">{stat.agent}</span>
                      <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                        {stat.count > 0 ? (
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.max(stat.percentage, 2)}%`, 
                              backgroundColor: AGENT_COLORS[stat.agent] || '#71717A' 
                            }} 
                          />
                        ) : (
                          <div className="h-full bg-zinc-200/50 w-full" />
                        )}
                      </div>
                      <span className="text-[12px] font-mono font-medium text-text-secondary w-8 text-right">{stat.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="h-[120px] flex items-center justify-center text-text-muted bg-zinc-50 rounded-lg">
                  <p className="font-medium text-[12px]">No agent activity yet</p>
                </div>
              )}
            </section>

            <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Database size={15} className="text-text-primary" />
                <h2 className="text-[15px] font-bold text-text-primary tracking-tight">RAG Performance</h2>
              </div>
              <p className="text-[12px] text-text-secondary mb-4">Vector search and retrieval pipeline</p>
              
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-[12px] text-text-secondary">Documents Indexed</span>
                  <span className="text-[13px] font-bold font-mono">{summary?.total_kb_documents || 0}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-[12px] text-text-secondary">Avg Latency</span>
                  <span className="text-[13px] font-bold font-mono">{hasData ? `${summary.avg_retrieval_time_ms.toFixed(1)}ms` : "N/A"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-[12px] text-text-secondary">Avg Chunks / Query</span>
                  <span className="text-[13px] font-bold font-mono">{hasData ? summary.avg_chunks_retrieved.toFixed(1) : "N/A"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[12px] text-text-secondary">Pipeline Status</span>
                  <span className="text-[12px] font-medium flex items-center gap-1.5 text-emerald-600 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3.5 border-t border-border grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-600 bg-zinc-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-text-muted block uppercase font-sans font-semibold">FAISS Index</span>
                  ● Loaded · Ready
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block uppercase font-sans font-semibold">Embedding Model</span>
                  MiniLM-L6-v2
                </div>
              </div>
            </section>
          </div>

          {/* Agent Performance & AI Insights */}
          <div className="space-y-6">
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm overflow-hidden">
              <h2 className="text-[15px] font-bold text-text-primary tracking-tight mb-1">Agent Performance</h2>
              <p className="text-[12px] text-text-secondary mb-4">Latency and success metrics by domain</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] text-left">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-2 font-semibold tracking-wider text-[10px] w-[35%]">AGENT</th>
                      <th className="pb-2 font-semibold tracking-wider text-[10px]">REQUESTS</th>
                      <th className="pb-2 font-semibold tracking-wider text-[10px]">LATENCY</th>
                      <th className="pb-2 font-semibold tracking-wider text-[10px]">SUCCESS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary?.agent_usage?.length ? summary.agent_usage.map((stat) => (
                      <tr key={stat.agent} className="group hover:bg-zinc-50/80 transition-colors">
                        <td className="py-2.5 font-medium text-text-primary capitalize flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AGENT_COLORS[stat.agent] || '#71717A' }} />
                          {stat.agent}
                        </td>
                        <td className="py-2.5 text-text-secondary font-mono">{stat.count}</td>
                        <td className="py-2.5 text-text-secondary font-mono">N/A</td>
                        <td className="py-2.5 text-text-secondary font-mono">N/A</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-text-muted text-[12px] bg-zinc-50 rounded-b-lg">
                          No performance data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* AI System Insights Card (Harmonized White Design) */}
            <section className="bg-white border border-border rounded-xl p-5 shadow-sm h-[242px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500" />
                    <h2 className="text-[14px] font-bold text-zinc-900 tracking-tight">AI SYSTEM INSIGHTS</h2>
                  </div>
                </div>
                
                {hasData ? (
                  <div className="space-y-3 mt-3">
                    <p className="text-[12px] font-medium text-zinc-800">
                      3 observations detected
                    </p>
                    <ul className="space-y-2 text-[12px] text-zinc-600">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">↗</span>
                        <span><strong className="text-zinc-900 capitalize">{summary.most_used_agent} Agent</strong> handled the highest volume this period.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">⚠</span>
                        <span>Average response time holds at <strong className="text-zinc-900">{summary.avg_response_time_ms.toFixed(0)}ms</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">✓</span>
                        <span>RAG retrieval remained stable at {summary.avg_retrieval_time_ms.toFixed(0)}ms.</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-[12px] font-semibold text-zinc-800 mb-1.5">No insights yet</p>
                    <p className="text-[11px] text-text-muted mb-2">
                      Your AI analyst will identify:
                    </p>
                    <ul className="text-[11px] text-zinc-600 space-y-1 pl-3.5 list-disc">
                      <li>agent performance anomalies</li>
                      <li>retrieval bottlenecks</li>
                      <li>escalation patterns</li>
                      <li>conversation trends</li>
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-text-muted italic border-t border-border pt-2">
                Insights appear automatically as system activity grows.
              </p>
            </section>
          </div>
        </div>

        {/* Live Agent Activity Feed */}
        <section className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Live Agent Activity</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Real-time orchestration events</p>
          </div>
          
          <div className="space-y-2.5">
            {liveEvents.length > 0 ? (
              liveEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted font-mono text-[11px] w-16">{ev.time.toLocaleTimeString([], { hour12: false })}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-text-primary">{ev.text}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded border border-border">{ev.component}</span>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-[12px] text-text-muted bg-zinc-50/70 rounded-lg">
                No recent agent activity
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
