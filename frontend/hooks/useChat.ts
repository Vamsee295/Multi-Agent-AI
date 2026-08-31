"use client";

import { useState, useCallback, useEffect } from "react";
import {
  sendChatMessage,
  ChatResponse,
  AgentName,
  SentimentLabel,
  fetchHistory,
  fetchSessions,
  SessionSummary,
  getApiErrorMessage,
  submitFeedback as apiSubmitFeedback,
  deleteSession as apiDeleteSession
} from "@/services/api";
import { useSettings } from "@/hooks/useSettings";

const SESSION_KEY = "techmart_session_id";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentsInvoked: AgentName[];
  escalated?: boolean;
  escalationDetails?: {
    ticket_id: string;
    priority: string;
    assigned_team: string;
  };
  retrievedContext?: ChatResponse["retrieved_context"];
  confidence?: number;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  responseTimeMs?: number;
  feedback?: "up" | "down";
  isNew?: boolean;
  isPending?: boolean;
  isError?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm the TechMart support assistant. Ask me about billing, orders, technical issues, or products — I'll route you to the right specialist.",
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

  const reloadSessions = useCallback(async () => {
    if (!isLoggedIn) {
      setSessions([]);
      return;
    }
    setIsLoadingSessions(true);
    try {
      const list = await fetchSessions();
      setSessions(list);
    } catch (err) {
      console.error("Failed to load sessions:", err);
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

  return {
    messages,
    sendMessage,
    isSending,
    activeAgents,
    error,
    sessionId,
    sessions,
    isLoadingSessions,
    selectSession,
    startNewChat,
    reloadSessions,
    handleFeedback,
    deleteConversation,
  };
}
