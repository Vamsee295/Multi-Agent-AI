"use client";

import { useState, useCallback, useEffect } from "react";
import {
  sendChatMessage,
  ChatResponse,
  AgentName,
  SentimentLabel,
  EscalationDetail,
  EscalationReason,
  fetchHistory,
  fetchSessions,
  SessionSummary,
  TicketSummary,
  getApiErrorMessage,
  submitFeedback as apiSubmitFeedback,
  deleteSession as apiDeleteSession,
  createEscalation,
  fetchMyTickets,
  EscalationPriority
} from "@/services/api";
import { useSettings } from "@/hooks/useSettings";

const SESSION_KEY = "helpflow_session_id";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "human";
  content: string;
  agentsInvoked: AgentName[];
  escalated?: boolean;
  escalationDetails?: EscalationDetail;
  retrievedContext?: ChatResponse["retrieved_context"];
  confidence?: number;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  responseTimeMs?: number;
  feedback?: "up" | "down";
  isNew?: boolean;
  isPending?: boolean;
  isError?: boolean;
  /** Set on assistant messages when the turn handed the conversation to a human. */
  conversationMode?: "AI" | "HUMAN" | "RESOLVED";
  authorName?: string | null;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm the HelpFlow support assistant. Ask me about billing, orders, technical issues, or products — I'll route you to the right specialist.",
  agentsInvoked: [],
};

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

function turnsToMessages(turns: any[]): ChatMessage[] {
  return turns.map((turn) => ({
    id: generateUUID(),
    role: turn.role,
    content: turn.content,
    agentsInvoked: turn.agents_invoked || [],
    authorName: turn.author_name || null,
  }));
}

interface UseChatOptions {
  isLoggedIn: boolean;
  isInitialized: boolean;
}

export function useChat({ isLoggedIn, isInitialized }: UseChatOptions) {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeAgents, setActiveAgents] = useState<AgentName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<"AI" | "HUMAN" | "RESOLVED">("AI");
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState<{
    type: "success" | "error";
    text: string;
    ticketId?: string;
  } | null>(null);
  const [activeEscalations, setActiveEscalations] = useState<TicketSummary[]>([]);

  const reloadSessions = useCallback(async () => {
    if (!isLoggedIn) {
      setSessions([]);
      setActiveEscalations([]);
      return;
    }
    setIsLoadingSessions(true);
    try {
      const [list, escalations] = await Promise.all([
        fetchSessions(),
        fetchMyTickets("active")
      ]);
      setSessions(list);
      setActiveEscalations(escalations);
    } catch (err) {
      console.error("Failed to load sessions or escalations:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isLoggedIn]);

  const loadSessionHistory = useCallback(async (id: string) => {
    try {
      const history = await fetchHistory(id);
      if (history.turns.length > 0) {
        setMessages([WELCOME_MESSAGE, ...turnsToMessages(history.turns)]);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
      setSessionId(id);
      window.localStorage.setItem(SESSION_KEY, id);
      setError(null);
    } catch (err) {
      window.localStorage.removeItem(SESSION_KEY);
      setSessionId(undefined);
      setMessages([WELCOME_MESSAGE]);
      setError(getApiErrorMessage(err, "Couldn't load this conversation."));
    }
  }, []);

  const startNewChat = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setSessionId(undefined);
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    let active = true;

    const bootstrap = async () => {
      if (isLoggedIn) {
        await reloadSessions();
      }

      const storedSessionId = window.localStorage.getItem(SESSION_KEY);
      if (!storedSessionId) return;

      try {
        const history = await fetchHistory(storedSessionId);
        if (!active) return;
        if (history.turns.length > 0) {
          setMessages([WELCOME_MESSAGE, ...turnsToMessages(history.turns)]);
          setSessionId(storedSessionId);
        }
      } catch {
        if (!active) return;
        window.localStorage.removeItem(SESSION_KEY);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [isInitialized, isLoggedIn, reloadSessions]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: generateUUID(),
        role: "user",
        content: text,
        agentsInvoked: [],
      };

      const pendingAssistantId = generateUUID();
      const pendingAssistantMessage: ChatMessage = {
        id: pendingAssistantId,
        role: "assistant",
        content: "",
        agentsInvoked: [],
        isNew: true,
        isPending: true,
      };

      setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);
      setIsSending(true);
      setError(null);

      try {
        const response = await sendChatMessage(text, {
          sessionId,
          model: settings.model,
          responseStyle: settings.responseStyle,
          useMemory: settings.useMemory,
          useRag: settings.useRag,
          automaticRouting: settings.automaticRouting,
        });
        setSessionId(response.session_id);
        window.localStorage.setItem(SESSION_KEY, response.session_id);
        setActiveAgents(response.agents_invoked);
        if (response.conversation_mode) {
          setConversationMode(response.conversation_mode);
        } else if (response.escalated) {
          setConversationMode("HUMAN");
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAssistantId
              ? {
                  ...msg,
                  content: response.message,
                  agentsInvoked: response.agents_invoked,
                  escalated: response.escalated,
                  escalationDetails: response.escalation_details,
                  retrievedContext: response.retrieved_context,
                  confidence: response.intent_confidence,
                  sentiment: response.sentiment,
                  sentimentScore: response.sentiment_score,
                  responseTimeMs: response.response_time_ms,
                  conversationMode: response.conversation_mode,
                  isNew: true,
                  isPending: false,
                }
              : msg
          )
        );

        if (isLoggedIn) {
          await reloadSessions();
        }

        setTimeout(() => setActiveAgents([]), 2200);
      } catch (err) {
        const errMsg = getApiErrorMessage(err, "Couldn't reach the support assistant.");
        setError(errMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingAssistantId
              ? {
                  ...msg,
                  content: `**Connection Error:** ${errMsg}`,
                  agentsInvoked: [],
                  isNew: true,
                  isPending: false,
                  isError: true,
                }
              : msg
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isLoggedIn, reloadSessions, settings]
  );

  const selectSession = useCallback(
    async (id: string) => {
      if (id === sessionId) return;
      await loadSessionHistory(id);
    },
    [sessionId, loadSessionHistory]
  );

  const handleFeedback = useCallback(async (messageId: string, rating: "up" | "down") => {
    if (!sessionId) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: rating } : m));
    try {
      await apiSubmitFeedback(sessionId, rating);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  }, [sessionId]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await apiDeleteSession(id);
      if (sessionId === id) {
        startNewChat();
      }
      if (isLoggedIn) {
        await reloadSessions();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Failed to delete conversation. Please try again.");
    }
  }, [sessionId, isLoggedIn, reloadSessions, startNewChat]);

  const escalateConversation = useCallback(
    async (reason?: EscalationReason, priority?: EscalationPriority, messageId?: string) => {
      if (!sessionId) {
        setEscalationNotice({
          type: "error",
          text: "Start a conversation before escalating to a human.",
        });
        return null;
      }
      setIsEscalating(true);
      setEscalationNotice(null);
      try {
        const detail = await createEscalation(sessionId, reason, priority, undefined, messageId);
        setConversationMode("HUMAN");
        setEscalationNotice({
          type: "success",
          text: `Your conversation has been escalated to human support. Ticket ${detail.ticket_id} has been created.`,
          ticketId: detail.ticket_id,
        });

        // Update messages so the assistant message shows the in-app escalation card immediately
        setMessages((prev) => {
          let updated = false;
          const updatedMessages = prev.map((msg) => {
            if (messageId && msg.id === messageId) {
              updated = true;
              return { ...msg, escalated: true, escalationDetails: detail };
            }
            return msg;
          });

          if (!updated) {
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              if (updatedMessages[i].role === "assistant") {
                updatedMessages[i] = {
                  ...updatedMessages[i],
                  escalated: true,
                  escalationDetails: detail,
                };
                updated = true;
                break;
              }
            }
          }

          if (!updated) {
            updatedMessages.push({
              id: generateUUID(),
              role: "assistant",
              content: `Your conversation has been escalated to human support. Ticket **${detail.ticket_id}** has been created and assigned to ${detail.assigned_team || "Customer Success"}.`,
              agentsInvoked: [],
              escalated: true,
              escalationDetails: detail,
            });
          }

          return updatedMessages;
        });

        if (isLoggedIn) {
          await reloadSessions();
        }

        return detail;
      } catch (err) {
        const errMsg = getApiErrorMessage(err, "Unable to create the escalation. Please try again.");
        setEscalationNotice({
          type: "error",
          text: errMsg,
        });
        throw err;
      } finally {
        setIsEscalating(false);
      }
    },
    [sessionId, isLoggedIn, reloadSessions]
  );

  const clearEscalationNotice = useCallback(() => setEscalationNotice(null), []);

  return {
    messages,
    sendMessage,
    isSending,
    activeAgents,
    error,
    sessionId,
    sessions,
    activeEscalations,
    isLoadingSessions,
    selectSession,
    startNewChat,
    reloadSessions,
    handleFeedback,
    deleteConversation,
    escalateConversation,
    isEscalating,
    escalationNotice,
    clearEscalationNotice,
    conversationMode,
  };
}
