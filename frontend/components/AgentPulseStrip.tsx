import { AgentName } from "@/services/api";

const AGENT_LABELS: Record<AgentName, string> = {
  billing:   "Billing",
  technical: "Technical",
  product:   "Product",
  complaint: "Complaint",
  faq:       "FAQ",
  general:   "General",
};

export function AgentBadgeRow({ agents }: { agents: AgentName[] }) {
  if (!agents || agents.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {agents.map((agent) => (
        <span
          key={agent}
          className={`
            inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium
            bg-agent-${agent}-bg text-agent-${agent}-fg border border-agent-${agent}-fg/20
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full bg-agent-${agent}-dot shrink-0`} />
          {AGENT_LABELS[agent] ?? agent}
        </span>
      ))}
    </div>
  );
}

export function AgentPulseStrip({ activeAgents }: { activeAgents: AgentName[] }) {
  if (activeAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-3 py-2 animate-fade-in">
      <div className="flex items-center gap-2 text-[12px] text-text-muted font-medium">
        <span className="w-2 h-2 rounded-full bg-brand animate-pulse-dot shrink-0" />
        Routing to agents
      </div>
      <div className="flex gap-1.5 border-l border-border pl-3">
        {activeAgents.map((agent) => (
          <div
            key={agent}
            className={`
              px-2.5 py-0.5 rounded text-[11px] font-medium
              bg-agent-${agent}-bg text-agent-${agent}-fg border border-agent-${agent}-fg/20
            `}
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-agent-${agent}-dot animate-pulse-dot`} />
              {AGENT_LABELS[agent] ?? agent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
