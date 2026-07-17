import { ChevronRight, FileText } from "lucide-react";
import { RetrievedChunk } from "@/services/api";

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "#16A34A" : pct >= 45 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2" title={`Confidence: ${pct}%`}>
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[11px] font-medium" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

export function ContextDrawer({
  context,
  confidence,
}: {
  context?: RetrievedChunk[];
  confidence?: number;
}) {
  if (!context || context.length === 0) return null;

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden bg-white">
      <details className="group">
        <summary className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-[12px] font-medium text-text-secondary hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <ChevronRight size={13} className="group-open:rotate-90 transition-transform text-text-muted" />
            <FileText size={13} className="text-brand" />
            <span>View source documents ({context.length})</span>
          </div>
          {confidence !== undefined && <ConfidenceMeter value={confidence} />}
        </summary>

        <div className="border-t border-border bg-muted/50 p-3 space-y-2">
          {context.map((chunk, i) => (
            <div key={i} className="bg-white border border-border rounded-md p-3 text-[12px]">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-border">
                <span className="font-mono text-[11px] text-brand bg-brand-subtle px-2 py-0.5 rounded font-medium">
                  {chunk.source}
                </span>
                <span className="font-mono text-[11px] text-emerald-600 font-medium">
                  score: {chunk.score.toFixed(3)}
                </span>
              </div>
              <p className="text-text-secondary leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                {chunk.text}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
