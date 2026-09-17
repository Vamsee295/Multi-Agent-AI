"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  RefreshCw,
  Search,
  ChevronRight,
  ArrowLeft,
  UserPlus,
  Send,
  CheckCircle2,
  History,
  ShieldCheck,
  Clock,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import {
  fetchSupportQueue,
  fetchSupportTicketDetail,
  fetchTicketConversation,
  takeCase,
  assignEscalation,
  updatePriority,
  updateStatus,
  resolveEscalation,
  closeEscalation,
  reopenEscalation,
  sendHumanMessage,
  SupportQueueResponse,
  TicketDetail,
  ConversationTurn,
  EscalationPriority,
  EscalationStatus,
  getApiErrorMessage,
} from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  StatusBadge,
  PriorityBadge,
  reasonLabel,
  formatTimestamp,
  STATUS_META,
  PRIORITY_META,
} from "@/components/ticketUi";

const STATUS_ORDER = [
  "OPEN",
  "ESCALATED",
  "PENDING_HUMAN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
] as const;
const PRIORITY_ORDER: EscalationPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const ACTIVE_STAT_KEYS = ["OPEN", "ESCALATED", "PENDING_HUMAN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "REOPENED"] as const;

/** Mirrors backend `STATUS_TRANSITIONS` so the UI only offers legal moves. */
const NEXT_TRANSITIONS: Record<string, EscalationStatus[]> = {
  OPEN: ["ESCALATED", "PENDING_HUMAN", "CLOSED"],
  ESCALATED: ["PENDING_HUMAN", "ASSIGNED", "CLOSED"],
  PENDING_HUMAN: ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "PENDING_HUMAN", "WAITING_FOR_CUSTOMER", "CLOSED"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED", "PENDING_HUMAN", "CLOSED"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "PENDING_HUMAN", "RESOLVED"],
};

const isActive = (status?: string | null) =>
  !!status && (ACTIVE_STAT_KEYS as readonly string[]).includes(status);

export default function SupportQueuePage() {
  const router = useRouter();
  const { user, role, isInitialized } = useAuth();

  const isSupport = role === "support" || role === "admin";

  // ── Queue state ────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState<SupportQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected ticket detail
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Action state
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState("");
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const loadingRef = useRef(false);

  // ── Auth gating ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && user && !isSupport) {
      router.replace("/chat");
    }
  }, [isInitialized, user, isSupport, router]);

  const loadQueue = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const q = await fetchSupportQueue({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assigned_agent:
          assignedFilter === "me"
            ? user?.id
            : assignedFilter === "assignee"
            ? "assignee"
            : undefined,
        search: searchQuery || undefined,
        limit: 200,
      });
      setQueue(q);
      setActionError(null);
    } catch (err) {
      console.error("Failed to fetch support queue:", err);
      setActionError(getApiErrorMessage(err, "Couldn't load the support queue."));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, assignedFilter, searchQuery, user?.id]);

  const loadDetail = useCallback(async (ticketId: string) => {
    try {
      setIsLoadingDetail(true);
      const [d, c] = await Promise.all([
        fetchSupportTicketDetail(ticketId),
        fetchTicketConversation(ticketId),
      ]);
      setDetail(d);
      setConversation(c);
      setActionError(null);
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
      setActionError(getApiErrorMessage(err, "Couldn't load this ticket."));
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Debounce queue loading for filter/search changes.
  useEffect(() => {
    if (!isInitialized || !user || !isSupport || isLoading) return;
    const t = setTimeout(loadQueue, 250);
    return () => clearTimeout(t);
  }, [loadQueue, isInitialized, user, isSupport, statusFilter, priorityFilter, assignedFilter, searchQuery, isLoading]);

  useEffect(() => {
    if (!isInitialized || !user || !isSupport) return;
    loadQueue().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, user, isSupport]);

  useEffect(() => {
    if (!selectedTicketId) return;
    loadDetail(selectedTicketId);
  }, [selectedTicketId, loadDetail]);

  // Poll queue (plus the open ticket detail) every 10s while visible.
  useEffect(() => {
    if (!isInitialized || !user || !isSupport) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      loadQueue();
      if (selectedTicketId) loadDetail(selectedTicketId);
    }, 10_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, user, isSupport, selectedTicketId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQueue();
    if (selectedTicketId) await loadDetail(selectedTicketId);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const runAction = useCallback(
    async (fn: () => Promise<unknown>, successMsg: string) => {
      if (!selectedTicketId) return;
      setIsWorking(true);
      setActionError(null);
      setActionNotice(null);
      try {
        await fn();
        await Promise.all([loadQueue(), loadDetail(selectedTicketId)]);
        setActionNotice(successMsg);
        setTimeout(() => setActionNotice(null), 3500);
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Action failed. Please try again."));
      } finally {
        setIsWorking(false);
      }
    },
    [selectedTicketId, loadQueue, loadDetail]
  );

  const handleTakeCase = () =>
    runAction(() => takeCase(selectedTicketId!), `You're now handling ${selectedTicketId}.`);

  const handleAssign = () => {
    if (!assignTarget.trim()) return;
    runAction(
      () => assignEscalation(selectedTicketId!, assignTarget.trim()),
      `Assigned ${selectedTicketId} to ${assignTarget.trim()}.`
    ).then(() => setAssignOpen(false));
  };

  const handlePriority = (p: EscalationPriority) =>
    runAction(
      () => updatePriority(selectedTicketId!, p),
      `Priority set to ${p} on ${selectedTicketId}.`
    ).then(() => setPriorityMenuOpen(false));

  const handleStatus = (s: EscalationStatus) =>
    runAction(
      () => updateStatus(selectedTicketId!, s),
      `Status updated to ${s} on ${selectedTicketId}.`
    ).then(() => setStatusMenuOpen(false));

  const handleResolve = () =>
    runAction(() => resolveEscalation(selectedTicketId!), `${selectedTicketId} marked resolved.`);

  const handleClose = () =>
    runAction(() => closeEscalation(selectedTicketId!), `${selectedTicketId} closed.`);

  const handleReopen = () =>
    runAction(() => reopenEscalation(selectedTicketId!), `${selectedTicketId} reopened.`);

  const handleSendHumanMessage = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setIsWorking(true);
    setActionError(null);
    try {
      await sendHumanMessage(selectedTicketId, replyText.trim(), true);
      setReplyText("");
      await Promise.all([loadQueue(), loadDetail(selectedTicketId)]);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Couldn't post your reply."));
    } finally {
      setIsWorking(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const stats = queue?.stats;
  const status = detail?.status;
  const statusActive = isActive(status);
  const nextStatuses = NEXT_TRANSITIONS[status || ""] || [];

  if (isInitialized && user && !isSupport) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-[14px] font-medium text-zinc-700">Support access required</p>
          <p className="text-[12px] text-text-muted mt-1">Redirecting to workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Chat
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-1 flex items-center gap-2">
                <Inbox size={22} className="text-text-primary" />
                Support Queue
              </h1>
              <p className="text-[13px] text-text-secondary">
                Escalated customer cases. Take cases, reply as human support, and move tickets to resolution.
              </p>
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

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Open", value: stats?.open, cls: "text-zinc-900" },
              { label: "Critical", value: stats?.critical, cls: "text-zinc-900 font-bold" },
              { label: "High", value: stats?.high, cls: "text-zinc-900 font-semibold" },
              { label: "Pending Human", value: stats?.pending_human, cls: "text-zinc-900" },
              { label: "In Progress", value: stats?.in_progress, cls: "text-zinc-900" },
              { label: "Resolved", value: stats?.resolved, cls: "text-zinc-900" },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-50 border border-border rounded-lg px-3 py-2.5">
                <p className="text-[20px] font-bold leading-none mb-1.5">
                  <span className={stat.cls}>{stat.value ?? "—"}</span>
                </p>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6">
        {actionError && (
          <div className="mb-4 bg-zinc-100 border border-zinc-300 text-zinc-900 text-[13px] font-medium rounded-lg px-4 py-2.5">
            {actionError}
          </div>
        )}
        {actionNotice && (
          <div className="mb-4 bg-zinc-900 text-white text-[13px] font-medium rounded-lg px-4 py-2.5">
            {actionNotice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative">
          {/* ── Left: filters + queue list ─────────────────────────────────── */}
          <div
            className={`lg:col-span-1 space-y-3 ${selectedTicketId ? "hidden lg:block" : "block"}`}
          >
            {/* Filters */}
            <div className="bg-white border border-border rounded-xl p-3 space-y-2 shadow-sm">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search tickets…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] font-medium border border-border rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="">All statuses</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] font-medium border border-border rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="">All priorities</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[12px] font-medium border border-border rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="">Assigned to anyone</option>
                <option value="me">Mine</option>
                <option value="assignee">Any assigned agent</option>
              </select>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-white border border-border rounded-xl shimmer" />
                ))}
              </div>
            ) : (queue?.items || []).length > 0 ? (
              queue!.items.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => setSelectedTicketId(ticket.ticket_id)}
                  className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
                    selectedTicketId === ticket.ticket_id
                      ? "border-zinc-800 ring-1 ring-zinc-800"
                      : "border-border hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[12px] font-mono text-zinc-500">{ticket.ticket_id}</span>
                    <span className="flex items-center gap-1.5">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1 truncate">
                    {ticket.subject}
                  </h3>
                  <p className="text-[12px] text-text-secondary mb-2 line-clamp-2">
                    {ticket.last_customer_message || ticket.ai_summary || "No customer message yet."}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
                    <span className="truncate">
                      {ticket.customer_name || "Customer"} · {ticket.category || "General"}
                    </span>
                    <span className="shrink-0 font-mono">{formatTimestamp(ticket.created_at, false)}</span>
                  </div>
                  {ticket.assigned_agent && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-600">
                      <UserPlus size={11} />
                      <span className="truncate">{ticket.assigned_agent}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">Queue is clear</p>
                <p className="text-[13px] text-text-secondary">
                  No escalated cases match your filters.
                </p>
              </div>
            )}
          </div>

          {/* ── Main: detail ────────────────────────────────────────────────── */}
          <div className={`lg:col-span-2 ${!selectedTicketId ? "hidden lg:block" : "block"}`}>
            {selectedTicketId ? (
              <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : detail ? (
                  <>
                    {/* Detail header */}
                    <div className="px-5 py-4 border-b border-border bg-zinc-50/50">
                      <button
                        onClick={() => setSelectedTicketId(null)}
                        className="lg:hidden flex items-center gap-1 text-[12px] font-medium text-text-muted hover:text-zinc-900 mb-3"
                      >
                        <ArrowLeft size={14} /> Back to queue
                      </button>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-[18px] font-bold text-zinc-900">{detail.ticket_id}</h2>
                            <StatusBadge status={detail.status} size="lg" />
                            <PriorityBadge priority={detail.priority} />
                          </div>
                          <p className="text-[13px] text-text-secondary truncate">
                            {detail.customer_name || "Customer"}
                            {detail.customer_email ? ` · ${detail.customer_email}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stacked sections */}
                    <div className="p-5 space-y-6">
                      {/* Summary grid */}
                      <section>
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                          Case Summary
                        </h3>
                        <div className="bg-zinc-50 border border-border rounded-lg p-4 grid grid-cols-2 gap-4 text-[13px]">
                          <div className="col-span-2">
                            <span className="text-text-muted block mb-1">Subject</span>
                            <span className="font-medium text-zinc-900 block">
                              {detail.trigger_message || "System escalation"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Category</span>
                            <span className="font-medium text-zinc-900 capitalize block">
                              {detail.category || "General"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Reason</span>
                            <span className="font-medium text-zinc-900 block">
                              {reasonLabel(detail.reason)}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Source</span>
                            <span className="font-medium text-zinc-900 capitalize block">
                              {detail.source || "AI"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Team</span>
                            <span className="font-medium text-zinc-900 block">
                              {detail.assigned_team || "Customer Success"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Created</span>
                            <span className="font-medium text-zinc-900 block">
                              {formatTimestamp(detail.created_at)}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Last Updated</span>
                            <span className="font-medium text-zinc-900 block">
                              {formatTimestamp(detail.updated_at)}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Assigned To</span>
                            <span className="font-medium text-zinc-900 block">
                              {detail.assigned_agent || "Unassigned"}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted block mb-1">Resolved</span>
                            <span className="font-medium text-zinc-900 block">
                              {formatTimestamp(detail.resolved_at)}
                            </span>
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

                      {/* Timeline */}
                      {(detail.events?.length || 0) > 0 && (
                        <section>
                          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <History size={13} />
                            Timeline
                          </h3>
                          <div className="relative pl-5 space-y-3">
                            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-zinc-200" />
                            {detail.events!.map((ev, i) => (
                              <div key={i} className="relative">
                                <div
                                  className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                    ev.status && ["RESOLVED", "CLOSED"].includes(ev.status)
                                      ? "bg-emerald-500"
                                      : ev.status === "IN_PROGRESS"
                                      ? "bg-zinc-900"
                                      : "bg-zinc-400"
                                  }`}
                                />
                                <p className="text-[13px] font-medium text-zinc-800">
                                  {ev.message || ev.type}
                                </p>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                  {formatTimestamp(ev.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Conversation + human reply */}
                      <section>
                        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
                          Conversation
                        </h3>
                        <div className="bg-zinc-50 border border-border rounded-lg p-4">
                          {conversation.length > 0 ? (
                            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                              {conversation.map((turn, i) => (
                                <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                                  <div
                                    className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${
                                      turn.role === "user"
                                        ? "bg-zinc-900 text-white"
                                        : turn.role === "human"
                                        ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                                        : "bg-white text-zinc-800 border border-border"
                                    }`}
                                  >
                                    {turn.role === "human" && (
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-800 mb-0.5">
                                        Human Support{turn.author_name ? ` · ${turn.author_name}` : ""}
                                      </p>
                                    )}
                                    <p>{turn.content}</p>
                                    <p
                                      className={`text-[10px] mt-1 ${
                                        turn.role === "user" ? "text-zinc-400" : "text-text-muted"
                                      }`}
                                    >
                                      {formatTimestamp(turn.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[12px] text-text-muted text-center py-6">
                              No messages in this conversation thread.
                            </p>
                          )}

                          {statusActive && (
                            <div className="mt-3 pt-3 border-t border-border flex items-end gap-2">
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendHumanMessage();
                                  }
                                }}
                                placeholder="Reply as human support…"
                                className="flex-1 px-3 py-2 text-[13px] border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 resize-none"
                              />
                              <button
                                onClick={handleSendHumanMessage}
                                disabled={isWorking || !replyText.trim()}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isWorking ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send size={13} />
                                )}
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-text-muted">
                    <AlertTriangle size={24} className="text-zinc-300 mb-2" />
                    <p className="text-[13px]">Couldn&apos;t load this ticket.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="min-h-[420px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted bg-white">
                <Inbox size={32} className="text-zinc-300 mb-3" />
                <p className="text-[13px] font-medium text-zinc-500">
                  Select a case to see details
                </p>
                <ChevronRight size={16} className="text-zinc-300 mt-2" />
              </div>
            )}
          </div>

          {/* ── Right: actions sidebar ──────────────────────────────────────── */}
          <div
            className={`lg:col-span-1 ${!selectedTicketId ? "hidden lg:block" : "block"}`}
          >
            {detail ? (
              <div className="lg:sticky lg:top-6 bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-zinc-50/50">
                  <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Actions
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {!statusActive ? (
                    <p className="text-[12px] text-text-muted px-1 py-2 leading-relaxed">
                      This ticket is {STATUS_META[status || ""]?.label.toLowerCase() || "closed"}.
                      No further actions are available.
                    </p>
                  ) : (
                    <>
                      {!detail.assigned_agent && (
                        <button
                          onClick={handleTakeCase}
                          disabled={isWorking}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserPlus size={13} />
                          Take Case
                        </button>
                      )}

                      {detail.assigned_agent && (
                        <p className="text-[12px] text-zinc-600 bg-zinc-50 border border-border rounded-lg px-3 py-2 truncate">
                          Assigned to <span className="font-medium text-zinc-900">{detail.assigned_agent}</span>
                        </p>
                      )}

                      <div className="pt-1">
                        <button
                          onClick={() => setAssignOpen((v) => !v)}
                          disabled={isWorking}
                          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 bg-white transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center gap-1.5">
                            <UserPlus size={13} />
                            Assign to…
                          </span>
                          <span className="text-zinc-400">{assignOpen ? "−" : "+"}</span>
                        </button>
                        {assignOpen && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              value={assignTarget}
                              onChange={(e) => setAssignTarget(e.target.value)}
                              placeholder="Agent ID"
                              className="flex-1 pl-3 pr-3 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 transition-all"
                            />
                            <button
                              onClick={handleAssign}
                              disabled={isWorking || !assignTarget.trim()}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => setPriorityMenuOpen((v) => !v)}
                          disabled={isWorking}
                          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 bg-white transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center gap-1.5">
                            <Gauge size={13} />
                            Priority: {PRIORITY_META[detail.priority]?.label}
                          </span>
                          <span className="text-zinc-400">{priorityMenuOpen ? "−" : "+"}</span>
                        </button>
                        {priorityMenuOpen && (
                          <div className="mt-2 space-y-1">
                            {PRIORITY_ORDER.map((p) => (
                              <button
                                key={p}
                                onClick={() => handlePriority(p)}
                                disabled={isWorking}
                                className={`w-full text-left px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                                  detail.priority === p
                                    ? "bg-zinc-900 text-white"
                                    : "text-zinc-700 hover:bg-zinc-50"
                                }`}
                              >
                                {PRIORITY_META[p].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => setStatusMenuOpen((v) => !v)}
                          disabled={isWorking}
                          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 bg-white transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} />
                            Change status
                          </span>
                          <span className="text-zinc-400">{statusMenuOpen ? "−" : "+"}</span>
                        </button>
                        {statusMenuOpen && (
                          <div className="mt-2 space-y-1">
                            {nextStatuses.length === 0 ? (
                              <p className="text-[12px] text-text-muted px-1 py-1">
                                No further transitions for this status.
                              </p>
                            ) : (
                              nextStatuses.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatus(s)}
                                  disabled={isWorking}
                                  className={`w-full text-left px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                                    status === s ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50"
                                  }`}
                                >
                                  {STATUS_META[s].label}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border space-y-2">
                        {nextStatuses.includes("RESOLVED") && (
                          <button
                            onClick={handleResolve}
                            disabled={isWorking}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={13} />
                            Resolve
                          </button>
                        )}
                        {nextStatuses.includes("CLOSED") && (
                          <button
                            onClick={handleClose}
                            disabled={isWorking}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 bg-white transition-colors disabled:opacity-50"
                          >
                            Close
                          </button>
                        )}
                        {nextStatuses.includes("REOPENED") && (
                          <button
                            onClick={handleReopen}
                            disabled={isWorking}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 bg-white transition-colors disabled:opacity-50"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="min-h-[200px] hidden lg:flex border border-dashed border-border rounded-xl items-center justify-center text-text-muted">
                <p className="text-[12px]">Select a case to enable actions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}