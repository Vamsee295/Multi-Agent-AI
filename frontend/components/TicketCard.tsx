import { TicketSummary } from "@/services/api";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { AgentBadgeRow } from "./AgentPulseStrip";

interface TicketCardProps {
  ticket: TicketSummary;
  onResolve: (id: string) => void;
  isResolving: boolean;
}

export function TicketCard({ ticket, onResolve, isResolving }: TicketCardProps) {
  const isOpen = ticket.status === "open";

  return (
    <div className={`bg-white border rounded-md p-4 transition-all ${
      isOpen ? "border-orange-200" : "border-border opacity-60"
    }`}>
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          {isOpen
            ? <AlertCircle size={14} className="text-orange-500 shrink-0" />
            : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          }
          <span className="text-[13px] font-semibold text-text-primary">
            Ticket #{ticket.ticket_id.slice(-6).toUpperCase()}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isOpen
              ? "bg-orange-50 text-orange-700 border border-orange-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            {isOpen ? "Open" : "Resolved"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <Clock size={11} />
          {new Date(ticket.created_at).toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </div>
      </div>

      <p className="text-[12px] text-text-secondary italic border-l-2 border-border pl-3 py-1 mb-3 line-clamp-2">
        "{ticket.trigger_message}"
      </p>

      <div className="flex items-center justify-between">
        <AgentBadgeRow agents={ticket.agents_invoked as any[]} />
        {isOpen && (
          <button
            onClick={() => onResolve(ticket.ticket_id)}
            disabled={isResolving}
            className="text-[12px] font-medium px-3 py-1.5 rounded border border-border text-text-secondary hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResolving ? "Resolving..." : "Mark Resolved"}
          </button>
        )}
      </div>
    </div>
  );
}
