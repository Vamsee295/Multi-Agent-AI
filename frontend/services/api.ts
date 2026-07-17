import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

export async function registerUser(name: string, email: string, password: string) {
  const { data } = await api.post("/api/auth/register", { name, email, password });
  return data as UserPublic;
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data as { access_token: string; token_type: string; expires_in_minutes: number };
}

export async function fetchMe(): Promise<UserPublic> {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function sendChatMessage(message: string, sessionId?: string) {
  const { data } = await api.post("/api/chat", { message, session_id: sessionId });
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
