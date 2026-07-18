"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Clock, ThumbsUp, AlertTriangle, BarChart2, MessageSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  fetchAnalytics, fetchTickets, resolveTicket,
  AnalyticsSummary, TicketSummary,
} from "@/services/api";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/hooks/useAuth";

const AGENT_COLORS: Record<string, string> = {
  billing:   "#2563EB",
  technical: "#7C3AED",
  product:   "#D97706",
  complaint: "#DC2626",
  faq:       "#059669",
};

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  alert?: boolean;
  sub?: string;
}

function KpiCard({ title, value, icon, alert, sub }: KpiCardProps) {
  return (
    <div className={`bg-white border rounded-md p-5 ${alert ? "border-orange-200" : "border-border"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-text-muted uppercase tracking-wide">{title}</p>
        <div className={`p-1.5 rounded-md ${alert ? "bg-orange-50" : "bg-muted"}`}>
          {icon}
        </div>
      </div>
      <p className="text-[28px] font-semibold text-text-primary tracking-tight leading-none">
        {value}
      </p>
      {sub && <p className="text-[12px] text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-md shadow-card-md px-3 py-2 text-[12px]">
        <p className="font-semibold text-text-primary capitalize mb-0.5">{label}</p>
        <p className="text-text-secondary">{payload[0].value} messages</p>
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
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!isInitialized || !user) return;
    Promise.all([fetchAnalytics(), fetchTickets("open")])
      .then(([a, t]) => { setSummary(a); setTickets(t); })
      .finally(() => setIsLoading(false));
  }, [isInitialized, user]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveTicket(id);
      setTickets((prev) => prev.filter((t) => t.ticket_id !== id));
    } finally {
      setResolvingId(null);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas page-enter">

      {/* Page header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Back to Chat
          </Link>
          <div className="flex items-center gap-2.5">
            <BarChart2 size={20} className="text-brand" />
            <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">
              Analytics Dashboard
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* KPI grid */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Conversations"
              value={summary.total_conversations}
              icon={<Users size={16} className="text-text-muted" />}
            />
            <KpiCard
              title="Total Messages"
              value={summary.total_messages}
              icon={<MessageSquare size={16} className="text-text-muted" />}
            />
            <KpiCard
              title="Satisfaction"
              value={`${(summary.satisfaction_score * 100).toFixed(0)}%`}
              icon={<ThumbsUp size={16} className="text-emerald-600" />}
            />
            <KpiCard
              title="Avg Response Time"
              value={`${summary.avg_response_time_ms.toFixed(0)}ms`}
              icon={<Clock size={16} className="text-text-muted" />}
              sub={summary.avg_response_time_ms < 2000 ? "Within target" : "Above target"}
            />
            <KpiCard
              title="Escalations"
              value={summary.open_ticket_count}
              icon={<AlertTriangle size={16} className={summary.open_ticket_count > 0 ? "text-orange-500" : "text-text-muted"} />}
              alert={summary.open_ticket_count > 0}
              sub={summary.open_ticket_count > 0 ? "Requires attention" : "All clear"}
            />
            <KpiCard
              title="Top Agent"
              value={summary.most_used_agent === "N/A" ? "N/A" : summary.most_used_agent.charAt(0).toUpperCase() + summary.most_used_agent.slice(1)}
              icon={<BarChart2 size={16} className="text-brand" />}
            />
            <KpiCard
              title="KB Documents"
              value={summary.total_kb_documents}
              icon={<Users size={16} className="text-text-muted" />}
            />
            <KpiCard
              title="Avg Retrieval Time"
              value={`${summary.avg_retrieval_time_ms.toFixed(1)}ms`}
              icon={<Clock size={16} className="text-text-muted" />}
            />
            <KpiCard
              title="Avg Retrieved Chunks"
              value={summary.avg_chunks_retrieved.toFixed(1)}
              icon={<Users size={16} className="text-text-muted" />}
            />
          </div>
        )}

        {/* Chart + Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Bar chart */}
          <div className="lg:col-span-3 bg-white border border-border rounded-md p-5">
            <h2 className="text-[14px] font-semibold text-text-primary mb-1">Agent Usage</h2>
            <p className="text-[12px] text-text-muted mb-5">Messages handled per agent</p>
            {summary?.agent_usage.length ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.agent_usage}
                    margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    barCategoryGap="35%"
                  >
                    <XAxis
                      dataKey="agent"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "#F3F4F6" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {summary.agent_usage.map((entry, i) => (
                        <Cell key={i} fill={AGENT_COLORS[entry.agent] ?? "#6B7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-[13px] text-text-muted">
                No data available yet
              </div>
            )}
          </div>

          {/* Tickets panel */}
          <div className="lg:col-span-2 bg-white border border-border rounded-md p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-semibold text-text-primary">Open Tickets</h2>
                <p className="text-[12px] text-text-muted">Escalations awaiting resolution</p>
              </div>
              {tickets.length > 0 && (
                <span className="bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                  {tickets.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-64 pr-1">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2">
                    <ThumbsUp size={14} className="text-emerald-600" />
                  </div>
                  <p className="text-[13px] font-medium text-text-secondary">All caught up</p>
                  <p className="text-[12px] text-text-muted">No open escalations</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.ticket_id}
                    ticket={ticket}
                    onResolve={handleResolve}
                    isResolving={resolvingId === ticket.ticket_id}
                  />
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
