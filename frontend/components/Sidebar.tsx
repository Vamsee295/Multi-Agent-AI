import Link from "next/link";
import { LogOut, Plus, MessageSquare, BarChart2 } from "lucide-react";
import { SessionSummary } from "@/services/api";

interface SidebarProps {
  sessions: SessionSummary[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onLogout,
  isLoading,
}: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-border flex flex-col h-full shrink-0">

      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center shrink-0">
            <MessageSquare size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-text-primary tracking-tight">
            TechMart AI
          </span>
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white rounded-md px-3 py-2 text-[13px] font-medium transition-colors"
        >
          <Plus size={15} />
          New Conversation
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3 border-b border-border space-y-1">
        <Link
          href="/analytics"
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
        >
          <BarChart2 size={15} className="text-text-muted" />
          Analytics Dashboard
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
        >
          <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          Knowledge Base Admin
        </Link>
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
          Recent Conversations
        </p>

        {isLoading ? (
          <div className="px-3 space-y-2 mt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-md bg-muted shimmer" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-3 py-6 text-[12px] text-text-muted text-center">
            No conversations yet
          </p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.session_id}
              onClick={() => onSelectSession(s.session_id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-all flex flex-col gap-0.5 mb-0.5 ${
                s.session_id === currentSessionId
                  ? "bg-brand-subtle text-brand border border-brand/15"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <MessageSquare
                  size={13}
                  className={s.session_id === currentSessionId ? "text-brand shrink-0" : "text-text-muted shrink-0"}
                />
                <span className="text-[13px] font-medium truncate">
                  {s.title || "Support Request"}
                </span>
              </div>
              <div className="flex justify-between items-center pl-5">
                <span className="text-[11px] text-text-muted truncate max-w-[130px]">
                  {s.last_message}
                </span>
                <span className="text-[10px] text-text-muted bg-muted px-1.5 py-0.5 rounded shrink-0">
                  {s.message_count}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-text-muted hover:text-danger hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
