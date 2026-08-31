"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Search, Filter, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { fetchTickets, resolveTicket, TicketSummary } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export default function TicketsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [openTickets, setOpenTickets] = useState<TicketSummary[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");
  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  const loadData = async () => {
    try {
      const [o, r] = await Promise.all([
        fetchTickets("open"),
        fetchTickets("resolved")
      ]);
      setOpenTickets(o);
      setResolvedTickets(r);
    } catch (e) {
      console.error("Failed to fetch tickets:", e);
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

  const handleResolve = async (ticketId: string) => {
    try {
      setIsResolving(true);
      await resolveTicket(ticketId);
      await loadData();
      setSelectedTicket(null);
    } catch (e) {
      console.error("Failed to resolve ticket:", e);
    } finally {
      setIsResolving(false);
    }
  };


  const activeTickets = activeTab === "open" ? openTickets : resolvedTickets;
  const filteredTickets = activeTickets.filter(t => 
    t.ticket_id.includes(searchQuery) || 
    t.trigger_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.agents_invoked.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Analytics
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-1 flex items-center gap-2">
                <Ticket size={22} className="text-text-primary" />
                Escalations
              </h1>
              <p className="text-[13px] text-text-secondary">Review requests requiring human attention.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-100 p-1 rounded-lg border border-border">
                <button 
                  onClick={() => setActiveTab("open")}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${activeTab === "open" ? "bg-white text-zinc-900 shadow-sm border border-border" : "text-text-secondary hover:text-zinc-900"}`}
                >
                  Open ({openTickets.length})
                </button>
                <button 
                  onClick={() => setActiveTab("resolved")}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${activeTab === "resolved" ? "bg-white text-zinc-900 shadow-sm border border-border" : "text-text-secondary hover:text-zinc-900"}`}
                >
                  Resolved ({resolvedTickets.length})
                </button>
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

          <div className="flex items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
            </div>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              Priority
            </button>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              Agent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          
          {/* Ticket List */}
          <div className={`lg:col-span-1 space-y-3 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
            {filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.ticket_id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
                    selectedTicket?.ticket_id === ticket.ticket_id 
                      ? 'border-zinc-800 ring-1 ring-zinc-800' 
                      : 'border-border hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[12px] font-mono text-zinc-500">#{ticket.ticket_id.slice(-6)}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                      (ticket as any).priority === 'High' ? 'bg-red-50 text-red-600' :
                      (ticket as any).priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {(ticket as any).priority || 'Standard'}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1 truncate">
                    {ticket.trigger_message || "System Escalation"}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <span className="capitalize text-zinc-700 font-medium bg-zinc-100 px-1.5 rounded">
                      {ticket.agents_invoked[0] || 'Orchestrator'}
                    </span>
                    <span>·</span>
                    <span>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">All caught up</p>
                <p className="text-[13px] text-text-secondary">No {activeTab} escalations at the moment.</p>
              </div>
            )}
          </div>

          {/* Ticket Detail View */}
          <div className={`lg:col-span-2 ${!selectedTicket ? 'hidden lg:block' : 'block'}`}>
            {selectedTicket ? (
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
                {/* Detail Header */}
                <div className="p-5 border-b border-border bg-zinc-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden flex items-center gap-1 text-[12px] font-medium text-text-muted hover:text-zinc-900 mb-3"
                    >
                      <ArrowLeft size={14} /> Back to list
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[18px] font-bold text-zinc-900">#{selectedTicket.ticket_id.slice(-6)}</h2>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${
                        selectedTicket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <p className="text-[14px] text-zinc-800 font-medium">
                      {selectedTicket.trigger_message || "System escalation triggered"}
                    </p>
                  </div>
                  
                  {selectedTicket.status === 'open' && (
                    <button
                      onClick={() => handleResolve(selectedTicket.ticket_id)}
                      disabled={isResolving}
                      className="shrink-0 flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {isResolving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Resolve Ticket
                    </button>
                  )}
                </div>

                {/* Detail Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  
                  <section>
                    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Escalation Reason</h3>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 text-red-900 text-[13px]">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Agent unable to safely resolve</p>
                        <p className="opacity-90">The <span className="capitalize font-medium">{selectedTicket.agents_invoked[0] || 'Orchestrator'} Agent</span> detected high frustration or a complex edge case that requires human intervention.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Agent Analysis</h3>
                    <div className="bg-zinc-50 border border-border rounded-lg p-4 grid grid-cols-2 gap-4 text-[13px]">
                      <div>
                        <span className="text-text-muted block mb-1">Agent Used</span>
                        <span className="font-medium text-zinc-900 capitalize">{selectedTicket.agents_invoked[0] || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Intent Confidence</span>
                        <span className="font-mono text-zinc-900">{(selectedTicket.intent_confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Assigned Team</span>
                        <span className="font-medium text-zinc-900">{(selectedTicket as any).assigned_team || 'General Support'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-1">Created At</span>
                        <span className="font-mono text-zinc-900">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Action Required</h3>
                    {selectedTicket.status === 'open' ? (
                      <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-5 text-center">
                        <p className="text-[13px] text-zinc-600">Awaiting human resolution. Review the conversation and contact the user directly to resolve this issue.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5 flex items-center justify-center gap-2 text-emerald-700">
                        <CheckCircle2 size={16} />
                        <span className="text-[13px] font-medium">Ticket resolved by human agent</span>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted bg-white">
                <Ticket size={32} className="text-zinc-300 mb-3" />
                <p className="text-[13px] font-medium text-zinc-500">Select a ticket to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
