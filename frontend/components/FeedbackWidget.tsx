import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackWidgetProps {
  onFeedback: (rating: "up" | "down") => void;
  selected?: "up" | "down";
}

export function FeedbackWidget({ onFeedback, selected }: FeedbackWidgetProps) {
  return (
    <div className="flex items-center gap-1 mt-2">
      <button
        onClick={() => onFeedback("up")}
        disabled={selected !== undefined}
        title="Helpful"
        className={`p-1.5 rounded transition-colors disabled:cursor-not-allowed ${
          selected === "up"
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : selected === "down"
            ? "text-text-muted opacity-30"
            : "text-text-muted hover:text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        <ThumbsUp size={13} className={selected === "up" ? "fill-emerald-600" : ""} />
      </button>
      <button
        onClick={() => onFeedback("down")}
        disabled={selected !== undefined}
        title="Not helpful"
        className={`p-1.5 rounded transition-colors disabled:cursor-not-allowed ${
          selected === "down"
            ? "bg-red-50 text-red-600 border border-red-200"
            : selected === "up"
            ? "text-text-muted opacity-30"
            : "text-text-muted hover:text-red-600 hover:bg-red-50"
        }`}
      >
        <ThumbsDown size={13} className={selected === "down" ? "fill-red-600" : ""} />
      </button>
      {selected && (
        <span className="text-[11px] text-text-muted ml-1.5 animate-fade-in">
          Feedback recorded
        </span>
      )}
    </div>
  );
}
