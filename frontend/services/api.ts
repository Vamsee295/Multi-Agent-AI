import axios, { AxiosError } from "axios";
import { supabase } from "@/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : (typeof window !== "undefined" ? "" : "http://localhost:8000");

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

export interface ChatResponse {
  session_id: string;
  message: string;
  agents_invoked: AgentName[];
  intent_confidence: number;
  retrieved_context: RetrievedChunk[];
  escalated: boolean;
  escalation_details?: {
    ticket_id: string;
    priority: string;
    assigned_team: string;
  };
  sentiment: SentimentLabel;
  sentiment_score: number;
  response_time_ms: number;
  created_at: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agents_invoked: AgentName[];
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

// ---------- Tickets ----------
export interface TicketSummary {
  ticket_id: string;
  session_id: string;
  trigger_message: string;
  agents_invoked: string[];
  intent_confidence: number;
  status: string;
  created_at: string;
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

export async function fetchTickets(status: "open" | "resolved" = "open"): Promise<TicketSummary[]> {
  const { data } = await api.get(`/api/tickets?status=${status}`);
  return data;
}

export async function resolveTicket(ticketId: string): Promise<TicketSummary> {
  const { data } = await api.patch(`/api/tickets/${ticketId}/resolve`);
  return data;
}

export { API_BASE_URL };
