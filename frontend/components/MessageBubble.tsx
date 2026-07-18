import { useState, useEffect } from "react";
import { ChatMessage } from "@/hooks/useChat";
import { AgentBadgeRow } from "./AgentPulseStrip";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "./FeedbackWidget";
import { SentimentBadge } from "./SentimentBadge";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

function WorkflowPipeline({ message }: { message: ChatMessage }) {
  const [stage, setStage] = useState(message.isNew ? 0 : 5);

  useEffect(() => {
    if (!message.isNew) return;
    
    const intervals = [
      setTimeout(() => setStage(1), 600),   // Selecting Agents
      setTimeout(() => setStage(2), 1200),  // Retrieving Knowledge
      setTimeout(() => setStage(3), 1800),  // Aggregating
      setTimeout(() => setStage(4), 2400),  // Generating
      setTimeout(() => setStage(5), 3000),  // Completed
    ];
    return () => intervals.forEach(clearTimeout);
  }, [message.isNew]);

  // Stage statuses: 
  // 0: Detecting, 1: Selecting, 2: Retrieving, 3: Aggregating, 4: Generating, 5: Completed
  const getStatusIcon = (stepStage: number) => {
    if (stage > stepStage) return <Check size={14} className="text-emerald-500" />;
    if (stage === stepStage) return <Loader2 size={14} className="text-brand animate-spin" />;
    return <div className="w-[14px]" />; // Spacer
  };

  return (
    <div className="mb-3 space-y-2 text-[13px] border border-border/60 bg-bg-secondary rounded-lg p-3 w-full animate-fade-in">
      <div className="flex items-center gap-2 text-text-primary font-medium mb-2">
        <span className="text-brand">⚡</span> Multi-Agent Pipeline
      </div>
      
      <div className="space-y-2 pl-1 font-medium">
        {/* Step 0: Intent */}
        <div className={`flex items-start gap-2 transition-opacity duration-300 ${stage >= 0 ? "opacity-100" : "opacity-30"}`}>
          <div className="pt-0.5">{getStatusIcon(0)}</div>
          <div>
            <span className={stage > 0 ? "text-text-primary" : "text-text-muted"}>Detecting User Intent</span>
            {stage >= 1 && message.sentiment && (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Intent parsed successfully
              </div>
            )}
          </div>
        </div>
        
        {/* Step 1: Agents */}
        <div className={`flex items-start gap-2 transition-opacity duration-300 ${stage >= 1 ? "opacity-100" : "opacity-30"}`}>
          <div className="pt-0.5">{getStatusIcon(1)}</div>
          <div>
            <span className={stage > 1 ? "text-text-primary" : "text-text-muted"}>Selecting Specialized Agents</span>
            {stage >= 2 && message.agentsInvoked && message.agentsInvoked.length > 0 && (
              <div className="pl-0 mt-1.5">
                <AgentBadgeRow agents={message.agentsInvoked} />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Knowledge Base */}
        <div className={`flex items-start gap-2 transition-opacity duration-300 ${stage >= 2 ? "opacity-100" : "opacity-30"}`}>
          <div className="pt-0.5">{getStatusIcon(2)}</div>
          <div>
            <span className={stage > 2 ? "text-text-primary" : "text-text-muted"}>Retrieving Knowledge</span>
            {stage >= 3 && message.retrievedContext && message.retrievedContext.length > 0 && (
              <div className="text-[12px] text-text-muted font-normal mt-0.5">
                ↳ Retrieved {message.retrievedContext.length} Context Chunks
              </div>
            )}
          </div>
        </div>
        
        {/* Step 3: Aggregating */}
        <div className={`flex items-start gap-2 transition-opacity duration-300 ${stage >= 3 ? "opacity-100" : "opacity-30"}`}>
          <div className="pt-0.5">{getStatusIcon(3)}</div>
          <span className={stage > 3 ? "text-text-primary" : "text-text-muted"}>Aggregating Agent Responses</span>
        </div>

        {/* Step 4: Generating */}
        <div className={`flex items-start gap-2 transition-opacity duration-300 ${stage >= 4 ? "opacity-100" : "opacity-30"}`}>
          <div className="pt-0.5">{getStatusIcon(4)}</div>
          <span className={stage > 4 ? "text-text-primary" : "text-text-muted"}>Generating Final AI Response</span>
        </div>

        {/* Step 5: Completed */}
        {stage === 5 && (
          <div className="flex items-center gap-2 text-emerald-600 pt-1 animate-fade-in">
            <Check size={14} />
            <span>Completed</span>
          </div>
        )}
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
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full animate-slide-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] md:max-w-[75%]">

        {/* Agent + sentiment meta row */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {message.agentsInvoked.length > 0 && (
              <AgentBadgeRow agents={message.agentsInvoked} />
            )}
            {message.sentiment && message.sentiment !== "neutral" && (
              <SentimentBadge sentiment={message.sentiment} score={message.sentimentScore} />
            )}
          </div>
        )}

        {/* Pipeline / Workflow Vis */}
        {!isUser && (
          <WorkflowPipeline message={message} />
        )}

        {/* Bubble */}
        <div
          className={`text-[14px] leading-relaxed ${
            isUser
              ? "bg-brand text-white rounded-2xl rounded-tr-md px-4 py-3"
              : "bg-white text-text-primary border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-card prose prose-sm prose-chat max-w-none"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Escalation notice */}
        {!isUser && message.escalated && (
          <div className="mt-3 bg-white border border-amber-200 rounded-lg overflow-hidden animate-fade-in shadow-sm">
            <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center gap-2 text-amber-800">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="text-[12px] font-bold tracking-wider">HUMAN ESCALATION CREATED</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
              <div>
                <div className="text-text-muted mb-0.5">Ticket ID</div>
                <div className="font-medium text-text-primary">{message.escalationDetails?.ticket_id || "TK-PENDING"}</div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Priority</div>
                <div className="font-medium text-amber-700 bg-amber-100/50 inline-block px-1.5 py-0.5 rounded border border-amber-200/50">{message.escalationDetails?.priority || "Medium"}</div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Assigned Team</div>
                <div className="font-medium text-text-primary">{message.escalationDetails?.assigned_team || "Technical Support"}</div>
              </div>
              <div>
                <div className="text-text-muted mb-0.5">Status</div>
                <div className="font-bold text-[11px] tracking-wide text-emerald-700 bg-emerald-100/50 inline-block px-1.5 py-0.5 rounded border border-emerald-200">OPEN</div>
              </div>
            </div>
          </div>
        )}

        {/* Retrieved Context Panel */}
        {!isUser && message.retrievedContext && message.retrievedContext.length > 0 && (
          <div className="mt-3 bg-white border border-border rounded-lg overflow-hidden animate-fade-in shadow-sm">
            <div className="bg-bg-secondary px-3 py-2 border-b border-border flex items-center gap-2">
              <span className="text-[14px]">📚</span>
              <span className="text-[12px] font-semibold text-text-primary tracking-wide">Retrieved Context</span>
            </div>
            <div className="p-3">
              <div className="space-y-1.5 mb-4">
                {Array.from(new Set(message.retrievedContext.map(c => c.source))).map(source => (
                  <div key={source} className="flex items-center gap-2">
                    <span className="text-text-muted text-[14px]">📄</span>
                    <span className="text-[13px] font-medium text-text-primary">{source}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <div>
                  <div className="text-text-muted mb-0.5">Retrieved Chunks</div>
                  <div className="font-medium text-text-primary">
                    {message.retrievedContext.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-text-muted mb-0.5">Similarity</div>
                  <div className="font-medium text-emerald-600">
                    {(Math.max(...message.retrievedContext.map(c => c.score)) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Metrics */}
        {!isUser && message.id !== "welcome" && (
          <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase tracking-wider opacity-70">Processing Metrics:</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="opacity-70">Agents Used</span>
              <span className="font-medium text-text-secondary">{message.agentsInvoked.length}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <span className="opacity-70">Chunks</span>
              <span className="font-medium text-text-secondary">{message.retrievedContext?.length || 0}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <span className="opacity-70">Time</span>
              <span className="font-medium text-text-secondary">{message.responseTimeMs ? `${(message.responseTimeMs / 1000).toFixed(1)}s` : '0.0s'}</span>
            </div>
            {message.confidence && (
              <>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1">
                  <span className="opacity-70">Confidence</span>
                  <span className="font-medium text-text-secondary">{(message.confidence * 100).toFixed(0)}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Feedback */}
        {!isUser && onFeedback && message.id !== "welcome" && (
          <FeedbackWidget
            onFeedback={(rating) => onFeedback(message.id, rating)}
            selected={message.feedback}
          />
        )}
      </div>
    </div>
  );
}
