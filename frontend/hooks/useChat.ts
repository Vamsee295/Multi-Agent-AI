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
  submitFeedback as apiSubmitFeedback
} from "@/services/api";

const SESSION_KEY = "techmart_session_id";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentsInvoked: AgentName[];
  escalated?: boolean;
  retrievedContext?: ChatResponse["retrieved_context"];
  confidence?: number;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  responseTimeMs?: number;
  feedback?: "up" | "down";
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
      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const response = await sendChatMessage(text, sessionId);
        setSessionId(response.session_id);
        window.localStorage.setItem(SESSION_KEY, response.session_id);
        setActiveAgents(response.agents_invoked);

        const assistantMessage: ChatMessage = {
          id: generateUUID(),
          role: "assistant",
          content: response.message,
          agentsInvoked: response.agents_invoked,
          escalated: response.escalated,
          retrievedContext: response.retrieved_context,
          confidence: response.intent_confidence,
          sentiment: response.sentiment,
          sentimentScore: response.sentiment_score,
          responseTimeMs: response.response_time_ms,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (isLoggedIn) {
          await reloadSessions();
        }

        setTimeout(() => setActiveAgents([]), 2200);
      } catch (err) {
        setError(getApiErrorMessage(err, "Couldn't reach the support assistant."));
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isLoggedIn, reloadSessions]
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
  };
}
