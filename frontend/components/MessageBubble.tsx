"use client";

import React, { useState, useEffect } from "react";
import { ChatMessage } from "@/hooks/useChat";
import { AgentBadgeRow } from "./AgentPulseStrip";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "./FeedbackWidget";
import { SentimentBadge } from "./SentimentBadge";
import { AlertTriangle, Check, Loader2, X, Zap } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

function WorkflowPipeline({
  message,
  onComplete,
}: {
  message: ChatMessage;
  onComplete: () => void;
}) {
  const { settings } = useSettings();
  const [stage, setStage] = useState(message.isNew ? 0 : 5);

  useEffect(() => {
    if (!message.isNew) {
      setStage(5);
      onComplete();
      return;
    }

    if (message.isError) {
      return;
    }

    let isMounted = true;

    // Advance initial stages while request is processing
    const t1 = setTimeout(() => {
      if (isMounted) setStage((s) => Math.max(s, 1));
    }, 450);

    const t2 = setTimeout(() => {
      if (isMounted) setStage((s) => Math.max(s, 2));
    }, 900);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [message.isNew, message.isError, onComplete]);

  // When API response arrives (!message.isPending and not error), complete the remaining stages sequentially
  useEffect(() => {
    if (!message.isNew || message.isPending || message.isError) return;

    let isMounted = true;

    // Fast-forward through stages 3, 4, 5
    const t3 = setTimeout(() => {
      if (isMounted) setStage((s) => Math.max(s, 3));
    }, 300);

    const t4 = setTimeout(() => {
      if (isMounted) setStage((s) => Math.max(s, 4));
    }, 650);

    const t5 = setTimeout(() => {
      if (isMounted) {
        setStage(5);
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 250);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [message.isNew, message.isPending, message.isError, onComplete]);

  const getStatusIcon = (stepStage: number) => {
    if (message.isError && stage === stepStage) {
      return <X size={14} className="text-red-500 shrink-0" />;
    }
    if (stage > stepStage) {
      return <Check size={14} className="text-emerald-500 shrink-0" />;
    }
    if (stage === stepStage) {
      return <Loader2 size={14} className="text-zinc-700 animate-spin shrink-0" />;
    }
    return (
      <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
      </div>
    );
  };

  const isRAGDisabled = settings.useRag === false;
  const chunkCount = message.retrievedContext?.length ?? 0;

  return (
    <div className="mb-3 border border-border/80 bg-white rounded-xl p-4 w-full shadow-2xs animate-fade-in transition-all">
      <div className="flex items-center gap-2 text-text-primary font-semibold text-[13px] mb-3 pb-2 border-b border-border/60">
        <Zap size={15} className="text-amber-500 fill-amber-500" />
        <span>Multi-Agent Pipeline</span>
      </div>

      <div className="space-y-3 font-medium text-[13px]">
        {/* Step 0: Intent Detection */}
        <div
          className={`flex items-start gap-2.5 transition-opacity duration-300 ${
            stage >= 0 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="pt-0.5">{getStatusIcon(0)}</div>
          <div>
            <span className={stage > 0 ? "text-text-primary" : "text-zinc-800"}>
              Detecting User Intent
            </span>
            {stage > 0 ? (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Intent parsed successfully
              </div>
            ) : (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Analyzing request intent...
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Agent Selection */}
        <div
          className={`flex items-start gap-2.5 transition-opacity duration-300 ${
            stage >= 1 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="pt-0.5">{getStatusIcon(1)}</div>
          <div>
            <span className={stage > 1 ? "text-text-primary" : "text-zinc-800"}>
              Selecting Specialized Agents
            </span>
            {stage > 1 && message.agentsInvoked && message.agentsInvoked.length > 0 ? (
              <div className="mt-1.5">
                <AgentBadgeRow agents={message.agentsInvoked} />
              </div>
            ) : stage === 1 ? (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Routing across domain agents...
              </div>
            ) : null}
          </div>
        </div>

        {/* Step 2: Knowledge Retrieval */}
        <div
          className={`flex items-start gap-2.5 transition-opacity duration-300 ${
            stage >= 2 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="pt-0.5">{getStatusIcon(2)}</div>
          <div>
            <span className={stage > 2 ? "text-text-primary" : "text-zinc-800"}>
              Retrieving Knowledge
            </span>
            {stage > 2 ? (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                {isRAGDisabled
                  ? "↳ RAG retrieval disabled"
                  : chunkCount > 0
                  ? `↳ Retrieved ${chunkCount} Context Chunk${chunkCount > 1 ? "s" : ""}`
                  : "↳ No relevant context found"}
              </div>
            ) : stage === 2 ? (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Querying FAISS vector index...
              </div>
            ) : null}
          </div>
        </div>

        {/* Step 3: Response Aggregation */}
        <div
          className={`flex items-start gap-2.5 transition-opacity duration-300 ${
            stage >= 3 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="pt-0.5">{getStatusIcon(3)}</div>
          <div>
            <span className={stage > 3 ? "text-text-primary" : "text-zinc-800"}>
              Aggregating Agent Responses
            </span>
            {stage === 3 && (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Synthesizing agent outputs...
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Final Generation */}
        <div
          className={`flex items-start gap-2.5 transition-opacity duration-300 ${
            stage >= 4 ? "opacity-100" : "opacity-40"
          }`}
        >
          <div className="pt-0.5">{getStatusIcon(4)}</div>
          <div>
            <span className={stage > 4 ? "text-text-primary" : "text-zinc-800"}>
              Generating Final AI Response
            </span>
            {stage === 4 && (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Formatting final answer...
              </div>
            )}
          </div>
        </div>

        {/* Step 5: Completed or Failed */}
        {message.isError ? (
          <div className="flex items-center gap-2 text-red-600 font-semibold text-[13px] pt-1.5 border-t border-border/40 animate-fade-in">
            <X size={14} />
            <span>Pipeline failed</span>
          </div>
        ) : stage === 5 ? (
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[13px] pt-1.5 border-t border-border/40 animate-fade-in">
            <Check size={14} />
            <span>Completed</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  onFeedback,
}: {
  message: ChatMessage;
  onFeedback?: (msgId: string, rating: "up" | "down") => void;
}) {
  const { settings } = useSettings();
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";

  // For assistant messages, manage whether the final response has been revealed
  const [isRevealed, setIsRevealed] = useState(!message.isNew || isWelcome || !!message.isError);

  const handlePipelineComplete = () => {
    setIsRevealed(true);
  };

  return (
    <div className={`flex w-full animate-slide-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] md:max-w-[75%] w-full">
        {/* Agent Badge Row (when completed) */}
        {!isUser && !isWelcome && settings.showAgentInfo && isRevealed && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap animate-fade-in">
            {message.agentsInvoked && message.agentsInvoked.length > 0 && (
              <AgentBadgeRow agents={message.agentsInvoked} />
            )}
            {message.sentiment && message.sentiment !== "neutral" && (
              <SentimentBadge sentiment={message.sentiment} score={message.sentimentScore} />
            )}
          </div>
        )}

        {/* Multi-Agent Pipeline Card (Appears FIRST before response) */}
        {!isUser && !isWelcome && settings.showAgentInfo && (
          <WorkflowPipeline message={message} onComplete={handlePipelineComplete} />
        )}

        {/* Final AI Response Bubble (Revealed ONLY AFTER pipeline completes) */}
        {(isUser || isWelcome || isRevealed) && (
          <div
            className={`text-[14px] leading-relaxed animate-fade-in ${
              isUser
                ? "bg-brand text-white rounded-2xl rounded-tr-md px-4 py-3"
                : message.isError
                ? "bg-red-50 text-red-700 border border-red-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-card prose prose-sm prose-chat max-w-none"
                : "bg-white text-text-primary border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-card prose prose-sm prose-chat max-w-none"
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        )}

        {/* Escalation notice */}
        {!isUser && !isWelcome && isRevealed && message.escalated && (
          <div className="mt-3 bg-white border border-amber-200 rounded-lg overflow-hidden animate-fade-in shadow-sm">
            <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center gap-2 text-amber-800">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="text-[12px] font-bold tracking-wider">HUMAN ESCALATION CREATED</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
              <div>
                <div className="text-text-muted mb-0.5">Ticket ID</div>
                <div className="font-medium text-text-primary">
                  {message.escalationDetails?.ticket_id || "TK-PENDING"}
                </div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Priority</div>
                <div className="font-medium text-amber-700 bg-amber-100/50 inline-block px-1.5 py-0.5 rounded border border-amber-200/50">
                  {message.escalationDetails?.priority || "Medium"}
                </div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Assigned Team</div>
                <div className="font-medium text-text-primary">
                  {message.escalationDetails?.assigned_team || "Technical Support"}
                </div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Status</div>
                <div className="font-bold text-[11px] tracking-wide text-emerald-700 bg-emerald-100/50 inline-block px-1.5 py-0.5 rounded border border-emerald-200">
                  OPEN
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Metrics (Revealed AFTER response) */}
        {!isUser && !isWelcome && isRevealed && !message.isError && (
          <div className="mt-2.5 flex items-center gap-4 text-[11px] text-text-muted animate-fade-in">
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase tracking-wider opacity-70">
                Processing Metrics:
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="opacity-70">Agents Used</span>
              <span className="font-medium text-text-secondary">
                {message.agentsInvoked?.length || 1}
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <span className="opacity-70">Chunks</span>
              <span className="font-medium text-text-secondary">
                {message.retrievedContext?.length || 0}
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <span className="opacity-70">Time</span>
              <span className="font-medium text-text-secondary">
                {message.responseTimeMs
                  ? `${(message.responseTimeMs / 1000).toFixed(1)}s`
                  : "0.0s"}
              </span>
            </div>
            {message.confidence && (
              <>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1">
                  <span className="opacity-70">Confidence</span>
                  <span className="font-medium text-text-secondary">
                    {(message.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Feedback Widget */}
        {!isUser && !isWelcome && isRevealed && !message.isError && onFeedback && (
          <div className="animate-fade-in">
            <FeedbackWidget
              onFeedback={(rating) => onFeedback(message.id, rating)}
              selected={message.feedback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
