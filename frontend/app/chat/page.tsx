"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/Sidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { AgentPulseStrip } from "@/components/AgentPulseStrip";
import { BackendStatus } from "@/components/BackendStatus";
import { ContextDrawer } from "@/components/ContextDrawer";

const SUGGESTED = [
  "What is your refund policy?",
  "I was charged twice this month.",
  "How do I reset my password?",
  "Do you offer international shipping?",
];

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized: authInit, logout } = useAuth();
  const {
    messages, sendMessage, isSending, activeAgents, error,
    sessionId, sessions, isLoadingSessions, selectSession,
    startNewChat, handleFeedback,
  } = useChat({ isLoggedIn: !!user, isInitialized: authInit });

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
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

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>
        <Sidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onSelectSession={(id) => { selectSession(id); setSidebarOpen(false); }}
          onNewChat={() => { startNewChat(); setSidebarOpen(false); }}
          onLogout={() => { logout(); router.push("/login"); }}
          isLoading={isLoadingSessions}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 bg-white border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded text-text-muted hover:text-text-primary hover:bg-muted transition-colors md:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-brand" />
              <span className="text-[14px] font-semibold text-text-primary">
                {sessionId ? "Conversation" : "New Conversation"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEmpty && (
              <button
                onClick={() => {
                  const content = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\\n\\n");
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
                className="text-[12px] text-text-muted hover:text-brand px-2 py-1 border border-transparent hover:border-border rounded transition-colors"
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
              <div className="w-14 h-14 bg-gradient-to-br from-brand/20 to-brand-subtle border border-brand/20 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <MessageSquare size={26} className="text-brand" />
              </div>
              <h2 className="text-[22px] font-bold text-text-primary mb-2">
                Welcome to TechMart AI
              </h2>
              <p className="text-[14px] text-text-muted mb-8 text-center max-w-md">
                Your enterprise-grade support assistant. Powered by a multi-agent routing architecture.
              </p>
              
              <div className="w-full max-w-2xl mb-8">
                <div className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-3 text-center">
                  Supported Areas
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Products", "Billing", "Technical Support", "Warranty", "Refund", "Shipping"].map((cap) => (
                    <div key={cap} className="px-3 py-1.5 bg-white border border-border rounded-full text-[12px] font-medium text-text-secondary shadow-sm">
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-2xl">
                <div className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-3 text-center">
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
                      className="text-left px-4 py-3.5 bg-white border border-border rounded-xl text-[13px] text-text-secondary hover:border-brand/40 hover:text-brand hover:bg-brand-subtle hover:shadow-sm transition-all flex items-center justify-between group"
                    >
                      <span>"{q}"</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand">→</span>
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

              {isSending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot" />
                  </div>
                </div>
              )}

              <AgentPulseStrip activeAgents={activeAgents} />
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* Input bar */}
        <footer className="shrink-0 border-t border-border bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="flex items-center justify-between mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-[12px] text-red-700">
                <span>{error}</span>
                <button onClick={() => {}} className="ml-2 opacity-60 hover:opacity-100">
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 border border-border rounded-md bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all">
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
                className="m-2 p-2 bg-brand hover:bg-brand-dark text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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
