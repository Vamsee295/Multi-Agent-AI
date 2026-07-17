import { ChatMessage } from "@/hooks/useChat";
import { AgentBadgeRow } from "./AgentPulseStrip";
import ReactMarkdown from "react-markdown";
import { FeedbackWidget } from "./FeedbackWidget";
import { SentimentBadge } from "./SentimentBadge";
import { AlertTriangle } from "lucide-react";

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
          <div className="mt-2 flex items-center gap-2 text-[12px] text-warning bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
            <AlertTriangle size={13} className="shrink-0" />
            This conversation has been flagged for human review.
          </div>
        )}

        {/* Feedback */}
        {!isUser && onFeedback && (
          <FeedbackWidget
            onFeedback={(rating) => onFeedback(message.id, rating)}
            selected={message.feedback}
          />
        )}
      </div>
    </div>
  );
}
