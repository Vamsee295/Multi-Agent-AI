"use client";

import Link from "next/link";
import { LogOut, Plus, MessageSquare, BarChart2, LayoutGrid, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { SessionSummary } from "@/services/api";
import { useState, useRef, useEffect, useCallback } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface SidebarProps {
  sessions: SessionSummary[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  isLoading: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 260;

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onLogout,
  isLoading,
  isOpen = true,
  onToggleOpen,
  width = DEFAULT_WIDTH,
  onWidthChange,
}: SidebarProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteSession(sessionToDelete);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      onWidthChange?.(newWidth);
    },
    [onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      style={{ width: isOpen ? `${width}px` : "0px" }}
      className={`relative bg-white border-r border-[#E4E4E7] flex flex-col h-full shrink-0 select-none ${
        isDragging ? "" : "transition-[width] duration-200 ease-in-out"
      } ${!isOpen ? "border-r-0 overflow-hidden" : ""}`}
    >
      <div className="w-full flex flex-col h-full min-w-[200px] overflow-hidden">
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-[#E4E4E7]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-[#09090B] rounded-lg flex items-center justify-center shrink-0">
                <LayoutGrid size={14} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-[#09090B] tracking-tight truncate">
                Multi-Agent AI
              </span>
            </div>
            {onToggleOpen && (
              <button
                onClick={onToggleOpen}
                className="p-1.5 rounded-lg text-text-muted hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#09090B] hover:bg-[#27272A] text-white rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span className="truncate">New Conversation</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-3 border-b border-[#E4E4E7] space-y-1">
          <Link
            href="/chat"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <MessageSquare size={15} className="text-text-muted shrink-0" />
            <span className="truncate">Workspace</span>
          </Link>
          <Link
            href="/conversations"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span className="truncate">Conversations</span>
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <span className="truncate">Agents</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"/></svg>
            </div>
            <span className="truncate">Knowledge Base</span>
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <BarChart2 size={15} className="text-text-muted shrink-0" />
            <span className="truncate">Analytics</span>
          </Link>
          <Link
            href="/tickets"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span className="truncate">Escalations</span>
          </Link>
          <Link
            href="/architecture"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <span className="truncate">Architecture</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
          >
            <div className="w-[15px] h-[15px] flex items-center justify-center text-text-muted shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <span className="truncate">Settings</span>
          </Link>
        </div>

        {/* Session History */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2 truncate">
            Recent Conversations
          </p>

          {isLoading ? (
            <div className="px-3 space-y-2 mt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-muted shimmer" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-3 py-6 text-[12px] text-text-muted text-center">
              No conversations yet
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.session_id}
                className={`group relative w-full text-left rounded-lg transition-all flex flex-col gap-0.5 mb-0.5 ${
                  s.session_id === currentSessionId
                    ? "bg-[#F4F4F5] text-[#09090B] border border-[#E4E4E7] font-semibold"
                    : "text-text-secondary hover:bg-[#F4F4F5] hover:text-text-primary"
                }`}
              >
                <button
                  onClick={() => onSelectSession(s.session_id)}
                  className="w-full text-left px-3 py-2.5 pr-8"
                >
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare
                      size={13}
                      className={s.session_id === currentSessionId ? "text-[#09090B] shrink-0" : "text-text-muted shrink-0"}
                    />
                    <span className="text-[13px] font-medium truncate">
                      {s.title || "Support Request"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pl-5 mt-1 gap-2">
                    <span className="text-[11px] text-text-muted truncate flex-1">
                      {s.last_message}
                    </span>
                    <span className="text-[10px] text-text-muted bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {s.message_count}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDelete(s.session_id);
                    setDeleteModalOpen(true);
                  }}
                  className="absolute right-2 top-2.5 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white hover:text-danger text-text-muted transition-all"
                  title="Delete Conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E4E4E7]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} className="shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Resize handle */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-black/20 transition-colors z-20 ${
            isDragging ? "bg-black/30 w-2" : ""
          }`}
          title="Drag to resize sidebar"
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
