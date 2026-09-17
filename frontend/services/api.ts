import axios, { AxiosError } from "axios";
import { supabase } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

let cachedToken: string | null = null;
let lastTokenCheck = 0;

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token || null;
    lastTokenCheck = Date.now();
  });
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      const now = Date.now();
      // Only fetch from storage if not cached or cache is older than 60s
      if (!cachedToken || now - lastTokenCheck > 60_000) {
        const { data: { session } } = await supabase.auth.getSession();
        cachedToken = session?.access_token || null;
        lastTokenCheck = now;
      }
      if (cachedToken) {
        config.headers.Authorization = `Bearer ${cachedToken}`;
      }
    } catch (err) {
      console.warn("Could not retrieve active Supabase session for request:", err);
    }
  }
  return config;
});

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: string | { msg: string }[] }>;
    if (!ax.response) {
      return "Couldn't reach the server. Make sure the backend is running on " + API_BASE_URL;
    }
    const detail = ax.response.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (ax.response.status === 403) return "You don't have access to this conversation.";
    if (ax.response.status === 401) return "Please sign in to continue.";
  }
  return fallback;
}

export type AgentName = "billing" | "technical" | "product" | "complaint" | "faq" | "general";
export type SentimentLabel = "positive" | "neutral" | "frustrated" | "angry";

export interface RetrievedChunk {
  source: string;
  text: string;
  score: number;
}

export interface EscalationDetail {
  ticket_id: string;
  reason: string;
  source: string;
  priority: string;
  status: string;
  assigned_team: string;
  ai_summary?: string | null;
  category?: string | null;
  created_at: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  agents_invoked: AgentName[];
  intent_confidence: number;
  retrieved_context: RetrievedChunk[];
  escalated: boolean;
  escalation_details?: EscalationDetail;
  sentiment: SentimentLabel;
  sentiment_score: number;
  response_time_ms: number;
  created_at: string;
  conversation_mode?: "AI" | "HUMAN" | "RESOLVED";
}

export interface ConversationTurn {
  role: "user" | "assistant" | "human";
  content: string;
  timestamp: string;
  agents_invoked?: AgentName[];
  author_name?: string | null;
}

export interface SessionSummary {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
  title?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role?: string;
}

export interface HealthResponse {
  status: string;
  database_connected: boolean;
  knowledge_base_chunks_indexed: number;
  llm_provider: string;
  llm_model?: string;
  version: string;
}

// ---------- Analytics ----------
export interface AgentUsageStat {
  agent: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  total_conversations: number;
  total_messages: number;
  avg_response_time_ms: number;
  avg_retrieval_time_ms: number;
  most_used_agent: string;
  total_kb_documents: number;
  avg_chunks_retrieved: number;
  satisfaction_score: number;
  escalation_count: number;
  open_ticket_count: number;
  agent_usage: AgentUsageStat[];
}

// ---------- Tickets / Escalations ----------
export type EscalationReason =
  | "USER_REQUESTED_HUMAN"
  | "AI_RESPONSE_UNHELPFUL"
  | "LOW_CONFIDENCE"
  | "KNOWLEDGE_NOT_FOUND"
  | "REPEATED_FAILURE"
  | "PAYMENT_DISPUTE"
  | "REFUND_REQUEST"
  | "SECURITY_ISSUE"
  | "FRAUD"
  | "SERIOUS_COMPLAINT"
  | "OTHER";

export type EscalationSource = "USER" | "AI" | "SYSTEM";
export type EscalationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type EscalationStatus =
  | "OPEN"
  | "ESCALATED"
  | "PENDING_HUMAN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export interface TicketSummary {
  ticket_id: string;
  session_id: string;
  trigger_message: string;
  agents_invoked: string[];
  intent_confidence: number;
  status: string;
  priority: string;
  created_at: string;
  reason?: string;
  source?: string;
  category?: string | null;
  assigned_team?: string;
  assigned_agent?: string | null;
  ai_summary?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface EscalationEvent {
  type: string;
  status?: string | null;
  message?: string | null;
  actor?: string | null;
  actor_type?: string | null;
  created_at: string;
}

export interface TicketDetail extends TicketSummary {
  user_id?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  last_customer_message?: string | null;
  events?: EscalationEvent[];
}

export interface SupportQueueStats {
  open: number;
  high: number;
  critical: number;
  pending_human: number;
  in_progress: number;
  resolved: number;
}

export interface SupportQueueItem {
  ticket_id: string;
  subject: string;
  customer_name?: string | null;
  customer_email?: string | null;
  category?: string | null;
  reason?: string;
  source?: string;
  priority: string;
  status: string;
  assigned_team: string;
  assigned_agent?: string | null;
  ai_summary?: string | null;
  last_customer_message?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface SupportQueueResponse {
  items: SupportQueueItem[];
  total: number;
  stats: SupportQueueStats;
}

export interface EscalationsAnalytics {
  total: number;
  escalation_rate: number;
  open_count: number;
  resolved_count: number;
  avg_resolution_hours: number | null;
  by_reason: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_assigned_agent: Record<string, number>;
}

export interface ConversationModeResponse {
  session_id: string;
  mode: "AI" | "HUMAN" | "RESOLVED";
  ticket_id?: string | null;
  human_agent_name?: string | null;
}

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get("/api/health");
  return data;
}

export async function fetchMe(): Promise<UserPublic> {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export interface SendChatMessageOptions {
  sessionId?: string;
  model?: string;
  responseStyle?: "concise" | "balanced" | "detailed";
  useMemory?: boolean;
  useRag?: boolean;
  automaticRouting?: boolean;
  preferredAgent?: AgentName;
}

export async function sendChatMessage(message: string, options?: string | SendChatMessageOptions) {
  let payload: Record<string, any> = { message };
  if (typeof options === "string") {
    payload.session_id = options;
  } else if (options) {
    payload.session_id = options.sessionId;
    if (options.model) payload.model = options.model;
    if (options.responseStyle) payload.response_style = options.responseStyle;
    if (options.useMemory !== undefined) payload.use_memory = options.useMemory;
    if (options.useRag !== undefined) payload.use_rag = options.useRag;
    if (options.automaticRouting !== undefined) payload.automatic_routing = options.automaticRouting;
    if (options.preferredAgent) payload.preferred_agent = options.preferredAgent;
  }
  const { data } = await api.post("/api/chat", payload);
  return data as ChatResponse;
}

export async function fetchHistory(sessionId: string) {
  const { data } = await api.get(`/api/chat/${sessionId}/history`);
  return data as { session_id: string; turns: ConversationTurn[] };
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const { data } = await api.get("/api/chat/sessions");
  return data;
}

export async function summarizeSession(sessionId: string): Promise<{ session_id: string, summary: string }> {
  const { data } = await api.post(`/api/chat/${sessionId}/summarize`);
  return data;
}

export async function submitFeedback(sessionId: string, rating: "up" | "down", comment?: string) {
  const { data } = await api.post(`/api/chat/${sessionId}/feedback`, { rating, comment });
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/api/chat/${sessionId}`);
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const { data } = await api.get("/api/analytics/summary");
  return data;
}

// ----- Customer ticket API -----

export type TicketStatusFilter = "active" | "resolved" | "closed" | EscalationStatus;

export async function fetchMyTickets(status?: TicketStatusFilter): Promise<TicketSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data } = await api.get(`/api/tickets${query}`);
  return data;
}

/** Legacy alias kept for backward compat. */
export const fetchTickets = fetchMyTickets;

export async function fetchTicketDetail(ticketId: string): Promise<TicketDetail> {
  const { data } = await api.get(`/api/tickets/${ticketId}`);
  return data;
}

export async function fetchTicketEvents(ticketId: string): Promise<EscalationEvent[]> {
  const { data } = await api.get(`/api/tickets/${ticketId}/events`);
  return data;
}

export async function createEscalation(
  sessionId: string,
  reason?: EscalationReason,
  priority?: EscalationPriority,
  category?: string,
  messageId?: string
): Promise<EscalationDetail> {
  const { data } = await api.post("/api/tickets/escalate", {
    session_id: sessionId,
    ...(reason ? { reason } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
    ...(messageId ? { message_id: messageId } : {}),
  });
  return data;
}

/** Legacy self-resolve wrapper (demoted by the backend lifecycle). */
export async function resolveTicket(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.patch(`/api/tickets/${ticketId}/resolve`);
  return data;
}

export async function deleteTicket(ticketId: string): Promise<{ status: string; deleted: boolean; ticket_id: string }> {
  const { data } = await api.delete(`/api/tickets/${ticketId}`);
  return data;
}

// ----- Support queue API -----

export interface SupportQueueFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_agent?: string;
  search?: string;
  sort?: string;
  limit?: number;
}

export async function fetchSupportQueue(filters?: SupportQueueFilters): Promise<SupportQueueResponse> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.category) params.set("category", filters.category);
    if (filters.assigned_agent) params.set("assigned_agent", filters.assigned_agent);
    if (filters.search) params.set("search", filters.search);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.limit) params.set("limit", String(filters.limit));
  }
  const qs = params.toString();
  const { data } = await api.get(`/api/tickets/support/queue${qs ? `?${qs}` : ""}`);
  return data;
}

export async function fetchSupportTicketDetail(ticketId: string): Promise<TicketDetail> {
  const { data } = await api.get(`/api/tickets/support/${ticketId}`);
  return data;
}

export async function fetchTicketConversation(ticketId: string): Promise<ConversationTurn[]> {
  const { data } = await api.get(`/api/tickets/${ticketId}/conversation`);
  return data;
}

export async function takeCase(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.post(`/api/tickets/${ticketId}/take`);
  return data;
}

export async function assignEscalation(ticketId: string, agentId: string): Promise<TicketSummary> {
  const { data } = await api.post(`/api/tickets/${ticketId}/assign`, { agent_id: agentId });
  return data;
}

export async function updatePriority(
  ticketId: string,
  priority: EscalationPriority,
  note?: string
): Promise<TicketSummary> {
  const { data } = await api.patch(`/api/tickets/${ticketId}/priority`, {
    priority,
    ...(note ? { note } : {}),
  });
  return data;
}

export async function updateStatus(
  ticketId: string,
  status: EscalationStatus,
  note?: string
): Promise<TicketSummary> {
  const { data } = await api.patch(`/api/tickets/${ticketId}/status`, {
    status,
    ...(note ? { note } : {}),
  });
  return data;
}

export async function resolveEscalation(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.post(`/api/tickets/${ticketId}/resolve`);
  return data;
}

export async function closeEscalation(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.post(`/api/tickets/${ticketId}/close`);
  return data;
}

export async function reopenEscalation(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.post(`/api/tickets/${ticketId}/reopen`);
  return data;
}

export async function sendHumanMessage(
  ticketId: string,
  content: string,
  markWaiting = true
): Promise<{ session_id: string; status: string; role: string; message: string }> {
  const { data } = await api.post(`/api/tickets/${ticketId}/messages`, {
    content,
    mark_waiting: markWaiting,
  });
  return data;
}

export async function fetchEscalationsAnalytics(): Promise<EscalationsAnalytics> {
  const { data } = await api.get("/api/analytics/escalations");
  return data;
}

export { API_BASE_URL };
