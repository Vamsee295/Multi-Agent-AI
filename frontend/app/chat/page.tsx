"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Send, MessageSquare, PanelLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/Sidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { AgentPulseStrip } from "@/components/AgentPulseStrip";
import { BackendStatus } from "@/components/BackendStatus";

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized: authInit, logout } = useAuth();
  const {
    messages, sendMessage, isSending, activeAgents, error,
    sessionId, sessions, isLoadingSessions, selectSession,
    startNewChat, handleFeedback, deleteConversation,
  } = useChat({ isLoggedIn: !!user, isInitialized: authInit });

  const [input, setInput] = useState("");
  // sidebarOpen: true by default on desktop, false on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  // Load saved sidebar width and state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebar_width");
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= 200 && parsed <= 480) {
          setSidebarWidth(parsed);
        }
      }
      const savedOpen = localStorage.getItem("sidebar_open");
      if (savedOpen !== null) {
        setSidebarOpen(savedOpen === "true");
      } else if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_open", String(next));
      }
      return next;
    });
  };

  const handleWidthChange = (width: number) => {
    setSidebarWidth(width);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_width", String(width));
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authInit && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, authInit, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgents, isSending]);

  if (!authInit || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    sendMessage(input);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-canvas overflow-hidden page-enter">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <div
        className={`fixed inset-y-0 left-0 md:relative z-40 h-full flex shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } transition-transform duration-200 ease-in-out`}
      >
        <Sidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onSelectSession={(id) => {
            selectSession(id);
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          onDeleteSession={deleteConversation}
          onNewChat={() => {
            startNewChat();
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          onLogout={() => { logout(); router.push("/login"); }}
          isLoading={isLoadingSessions}
          isOpen={sidebarOpen}
          onToggleOpen={handleToggleSidebar}
          width={sidebarWidth}
          onWidthChange={handleWidthChange}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 bg-white border-b border-[#E4E4E7]">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button at top */}
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 -ml-1 rounded-lg text-text-muted hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <PanelLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#09090B]" />
              <span className="text-[14px] font-bold text-[#09090B]">
                {sessionId ? "Conversation" : "New Conversation"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEmpty && (
              <button
                onClick={() => {
                  const content = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `chat-export-${sessionId || 'new'}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-[12px] text-text-muted hover:text-[#09090B] px-2 py-1 border border-transparent hover:border-[#E4E4E7] rounded transition-colors"
              >
                Export TXT
              </button>
            )}
            <BackendStatus />
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          {isEmpty ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
              <div className="w-14 h-14 bg-[#09090B] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <MessageSquare size={26} className="text-white" />
              </div>
              <h2 className="text-[22px] font-bold text-text-primary mb-2">
                Welcome to Multi-Agent AI
              </h2>
              <p className="text-[14px] text-text-muted mb-8 text-center max-w-md font-medium">
                Your enterprise-grade support assistant. Powered by a multi-agent routing architecture.
              </p>
              
              <div className="w-full max-w-2xl mb-8">
                <div className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3 text-center">
                  Supported Areas
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Products", "Billing", "Technical Support", "Warranty", "Refund", "Shipping"].map((cap) => (
                    <div key={cap} className="px-3.5 py-1.5 bg-white border border-[#E4E4E7] rounded-full text-[12px] font-semibold text-[#09090B] shadow-sm">
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-2xl">
                <div className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3 text-center">
                  Suggested Questions
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    "What products do you sell?",
                    "What is your refund policy?",
                    "How do I install SmartHub?"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { sendMessage(q); }}
                      className="text-left px-4 py-3.5 bg-white border border-[#E4E4E7] rounded-xl text-[13px] text-[#09090B] font-medium hover:border-[#09090B] hover:bg-[#F4F4F5] hover:shadow-sm transition-all flex items-center justify-between group"
                    >
                      <span>"{q}"</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#09090B] font-bold">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <MessageBubble message={msg} onFeedback={handleFeedback} />
                </div>
              ))}

              <AgentPulseStrip activeAgents={activeAgents} />
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* Input bar */}
        <footer className="shrink-0 border-t border-[#E4E4E7] bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="flex items-center justify-between mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[12px] text-red-700">
                <span>{error}</span>
                <button onClick={() => {}} className="ml-2 opacity-60 hover:opacity-100">
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 border border-[#E4E4E7] rounded-xl bg-white focus-within:border-[#09090B] focus-within:ring-2 focus-within:ring-black/5 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about billing, orders, technical support..."
                rows={1}
                disabled={isSending}
                className="flex-1 resize-none bg-transparent py-3 px-3.5 text-[14px] text-text-primary placeholder:text-text-muted max-h-32 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="m-2 p-2 bg-[#09090B] hover:bg-[#27272A] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-[11px] text-text-muted mt-2">
              AI responses may be inaccurate. Verify important information independently.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
