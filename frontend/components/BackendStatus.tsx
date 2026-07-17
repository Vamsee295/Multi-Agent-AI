"use client";

import { useEffect, useState } from "react";
import { checkHealth, HealthResponse } from "@/services/api";

export function BackendStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const data = await checkHealth();
        if (!active) return;
        setHealth(data);
        setOffline(false);
      } catch {
        if (!active) return;
        setHealth(null);
        setOffline(true);
      }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  if (offline) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 status-dot-live" />
        Backend offline
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="flex items-center gap-3 text-[12px] text-text-muted">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-emerald-700 font-medium">Online</span>
      </div>
      <span className="text-border">|</span>
      <span>{health.knowledge_base_chunks_indexed} chunks indexed</span>
      <span className="text-border">|</span>
      <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{health.llm_provider}</span>
    </div>
  );
}
