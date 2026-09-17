"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  History,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  fetchMyTickets,
  fetchTicketDetail,
  TicketSummary,
  TicketDetail,
  EscalationEvent,
  resolveTicket,
  deleteTicket,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
  StatusBadge,
  PriorityBadge,
  reasonLabel,
  formatTimestamp,
  isActiveEscalation,
  isResolvedEscalation,
  isActiveStatus,
} from "@/components/ticketUi";

const ACTIVE_FILTER = "active";
const RESOLVED_FILTER = "resolved";

export default function TicketsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [activeTickets, setActiveTickets] = useState<TicketSummary[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "resolved">(ACTIVE_FILTER);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketSummary | TicketDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  // Read ?id= query param from URL on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialId = params.get("id");
      if (initialId) {
        setSelectedTicketId(initialId);
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([
        fetchMyTickets(ACTIVE_FILTER),
        fetchMyTickets(RESOLVED_FILTER),
      ]);
      const activeList = (a || []).filter((t) => isActiveEscalation(t.status));
      const resolvedList = (r || []).filter((t) => isResolvedEscalation(t.status));
      setActiveTickets(activeList);
      setResolvedTickets(resolvedList);
    } catch (e) {
      console.error("Failed to fetch tickets:", e);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !user) return;
    loadData().finally(() => setIsLoading(false));
  }, [isInitialized, user, loadData]);

  const loadDetail = useCallback(async (ticketId: string) => {
    setIsLoadingDetail(true);
    try {
      const d = await fetchTicketDetail(ticketId);
      setDetail(d);
    } catch (e) {
      console.error("Failed to fetch ticket detail:", e);
      setDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadDetail(selectedTicketId);
    } else {
      setDetail(null);
    }
  }, [selectedTicketId, loadDetail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    if (selectedTicketId) await loadDetail(selectedTicketId);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const openConversation = (sessionId?: string) => {
    if (!sessionId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("helpflow_session_id", sessionId);
    }
    router.push("/chat");
  };

  const handleResolveConfirm = async () => {
    if (!detail) return;
    setIsResolving(true);
    try {
      const updated = await resolveTicket(detail.ticket_id);
      setActiveTickets(prev => prev.filter(t => t.ticket_id !== updated.ticket_id));
      setResolvedTickets(prev => [updated, ...prev]);
      setShowResolveModal(false);

      const freshDetail = await fetchTicketDetail(updated.ticket_id);
      setDetail(freshDetail);

      alert("Escalation resolved successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to resolve escalation. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTicket(ticketToDelete.ticket_id);
      setResolvedTickets((prev) => prev.filter((t) => t.ticket_id !== ticketToDelete.ticket_id));
      setActiveTickets((prev) => prev.filter((t) => t.ticket_id !== ticketToDelete.ticket_id));

      if (selectedTicketId === ticketToDelete.ticket_id) {
        setSelectedTicketId(null);
        setDetail(null);
      }
      setShowDeleteModal(false);
      setTicketToDelete(null);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      alert("Unable to delete escalation. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const tabTickets = activeTab === RESOLVED_FILTER ? resolvedTickets : activeTickets;
  const filteredTickets = tabTickets.filter(
    (t) =>
      t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trigger_message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Ticket size={22} className="text-text-primary" />
                My Escalations
              </h1>
              <p className="text-[13px] text-text-secondary">
                Cases handed to human support. Follow status and history as your team works them.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-100 p-1 rounded-lg border border-border">
                <button
                  onClick={() => setActiveTab(ACTIVE_FILTER)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                    activeTab === ACTIVE_FILTER
                      ? "bg-white text-zinc-900 shadow-sm border border-border"
                      : "text-text-secondary hover:text-zinc-900"
                  }`}
                >
                  Active ({activeTickets.length})
                </button>
                <button
                  onClick={() => setActiveTab(RESOLVED_FILTER)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                    activeTab === RESOLVED_FILTER
                      ? "bg-white text-zinc-900 shadow-sm border border-border"
                      : "text-text-secondary hover:text-zinc-900"
                  }`}
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
                placeholder="Search tickets by ID, subject, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Ticket List */}
          <div className={`lg:col-span-1 space-y-3 ${selectedTicketId ? "hidden lg:block" : "block"}`}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white border border-border rounded-xl shimmer" />
                ))}
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => setSelectedTicketId(ticket.ticket_id)}
                  className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all group relative ${
                    selectedTicketId === ticket.ticket_id
                      ? "border-zinc-800 ring-1 ring-zinc-800"
                      : "border-border hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="text-[12px] font-mono text-zinc-500">{ticket.ticket_id}</span>
                    <span className="flex items-center gap-1.5">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      {!isActiveStatus(ticket.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketToDelete(ticket);
                            setShowDeleteModal(true);
                          }}
                          title="Delete resolved escalation"
                          className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1 truncate">
                    {ticket.trigger_message || "System escalation"}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <span className="text-zinc-600">{reasonLabel(ticket.reason)}</span>
                    <span>·</span>
                    <span>{formatTimestamp(ticket.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <CheckCircle2 size={32} className="text-zinc-800 mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">
                  {activeTab === RESOLVED_FILTER ? "No resolved cases" : "All caught up"}
                </p>
                <p className="text-[13px] text-text-secondary">
                  {activeTab === RESOLVED_FILTER
                    ? "None of your escalated cases have been resolved yet."
                    : "You have no open escalations right now."}
                </p>
              </div>
            )}
          </div>

          {/* Ticket Detail View */}
          <div className={`lg:col-span-2 ${!selectedTicketId ? "hidden lg:block" : "block"}`}>
            {selectedTicketId ? (
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
                {isLoadingDetail ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : detail ? (
                  <>
                    {/* Detail Header */}
                    <div className="p-5 border-b border-border bg-zinc-50/50">
                      <button
                        onClick={() => setSelectedTicketId(null)}
                        className="lg:hidden flex items-center gap-1 text-[12px] font-medium text-text-muted hover:text-zinc-900 mb-3"
                      >
                        <ArrowLeft size={14} /> Back to list
                      </button>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-[18px] font-bold text-zinc-900">{detail.ticket_id}</h2>
                            <StatusBadge status={detail.status} size="lg" />
                            <PriorityBadge priority={detail.priority} />
                          </div>
                          <p className="text-[14px] text-zinc-800 font-medium">
                            {detail.trigger_message || "System escalation"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {detail.session_id && (
                            <button
                              onClick={() => openConversation(detail.session_id)}
                              className="shrink-0 flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg px-3 py-1.5 hover:bg-zinc-100 bg-white transition-colors"
                            >
                              <ExternalLink size={13} />
                              View conversation
                            </button>
                          )}
                          {!isActiveStatus(detail.status) && (
                            <button
                              onClick={() => {
                                setTicketToDelete(detail);
                                setShowDeleteModal(true);
                              }}
                              className="shrink-0 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 bg-white transition-colors"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detail Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      <section>
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                          Case Summary
                        </h3>
                        <div className="bg-zinc-50 border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
                          <div>
                            <span className="text-text-muted block mb-1">Reason</span>
                            <span className="font-medium text-zinc-900">{reasonLabel(detail.reason)}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Category</span>
                            <span className="font-medium text-zinc-900 capitalize">
                              {detail.category || "General"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Priority</span>
                            <span className="font-medium text-zinc-900">
                              {(detail.priority || "MEDIUM").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Created</span>
                            <span className="font-medium text-zinc-900">{formatTimestamp(detail.created_at)}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Assigned Team</span>
                            <span className="font-medium text-zinc-900">{detail.assigned_team || "Customer Success"}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Resolved</span>
                            <span className="font-medium text-zinc-900">{formatTimestamp(detail.resolved_at)}</span>
                          </div>
                        </div>
                      </section>

                      {detail.ai_summary && (
                        <section>
                          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                            AI Summary
                          </h3>
                          <div className="bg-white border border-border rounded-lg p-4 text-[13px] text-zinc-800">
                            {detail.ai_summary}
                          </div>
                        </section>
                      )}

                      {(detail.events?.length || 0) > 0 && (
                        <section>
                          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <History size={13} />
                            Timeline
                          </h3>
                          <div className="relative pl-5 space-y-4">
                            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-zinc-200" />
                            {(detail.events || []).map((ev: EscalationEvent, i) => (
                              <div key={i} className="relative">
                                <div
                                  className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                    ev.status && ["RESOLVED", "CLOSED"].includes(ev.status)
                                      ? "bg-zinc-900"
                                      : "bg-zinc-400"
                                  }`}
                                />
                                <p className="text-[13px] font-medium text-zinc-800">{ev.message || ev.type}</p>
                                <p className="text-[11px] text-text-muted mt-0.5">{formatTimestamp(ev.created_at)}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      <section>
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                          Current Status
                        </h3>
                        {isActiveStatus(detail.status) ? (
                          <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-5 text-center">
                            <p className="text-[13px] text-zinc-600">
                              This case is being handled by the support team. A human agent will respond in your
                              conversation thread shortly.
                            </p>
                            {detail.session_id && (
                              <button
                                onClick={() => openConversation(detail.session_id)}
                                className="mt-3 text-[12px] font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-700 block mx-auto"
                              >
                                Continue the conversation
                              </button>
                            )}
                            <div className="mt-4 pt-4 border-t border-dashed border-zinc-200">
                              <button
                                onClick={() => setShowResolveModal(true)}
                                className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
                              >
                                Resolve Escalation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-zinc-900">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              <span className="text-[13px] font-medium">
                                This case has been {detail.status === "CLOSED" ? "closed" : "resolved"}.
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setTicketToDelete(detail);
                                setShowDeleteModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-[12px] font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Trash2 size={13} />
                              Delete Escalation
                            </button>
                          </div>
                        )}
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[13px] text-text-muted">
                    Couldn&apos;t load this ticket.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[500px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted bg-white">
                <Ticket size={32} className="text-zinc-300 mb-3" />
                <p className="text-[13px] font-medium text-zinc-500">Select a ticket to view its status</p>
                <ChevronRight size={16} className="text-zinc-300 mt-2" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => !isResolving && setShowResolveModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-[#E4E4E7] z-10 animate-fade-in">
            <h3 className="text-lg font-bold leading-6 text-[#09090B]">
              Resolve Escalation?
            </h3>
            <div className="mt-2">
              <p className="text-sm text-[#71717A] leading-relaxed font-medium">
                Are you sure you want to mark this escalation as resolved?
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-[#E4E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#09090B] hover:bg-[#F4F4F5] transition-colors focus:outline-none disabled:opacity-50"
                onClick={() => setShowResolveModal(false)}
                disabled={isResolving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-transparent bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors"
                onClick={handleResolveConfirm}
                disabled={isResolving}
              >
                {isResolving ? "Resolving..." : "Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setTicketToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title={`Delete Escalation ${ticketToDelete?.ticket_id ? `(${ticketToDelete.ticket_id})` : ""}?`}
        description="Are you sure you want to permanently delete this resolved escalation? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}