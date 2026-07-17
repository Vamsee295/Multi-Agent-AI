import { SentimentLabel } from "@/services/api";

const SENTIMENT_CONFIG: Record<SentimentLabel, { bg: string; text: string; dot: string; label: string }> = {
  positive:   { bg: "bg-emerald-50 border-emerald-200",  text: "text-emerald-700", dot: "bg-emerald-500", label: "Positive" },
  neutral:    { bg: "bg-gray-50 border-gray-200",        text: "text-gray-600",    dot: "bg-gray-400",    label: "Neutral" },
  frustrated: { bg: "bg-amber-50 border-amber-200",      text: "text-amber-700",   dot: "bg-amber-500",   label: "Frustrated" },
  angry:      { bg: "bg-red-50 border-red-200",          text: "text-red-700",     dot: "bg-red-500",     label: "Angry" },
};

export function SentimentBadge({ sentiment, score }: { sentiment: SentimentLabel; score?: number }) {
  const cfg = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
      {score !== undefined && (
        <span className="opacity-60">{Math.round(score * 100)}%</span>
      )}
    </span>
  );
}
