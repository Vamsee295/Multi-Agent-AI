"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Search, Filter, RefreshCw } from "lucide-react";
import { fetchSessions, SessionSummary } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export default function ConversationsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  const loadData = async () => {
    try {
      const s = await fetchSessions();
      setSessions(s);
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
  };

  useEffect(() => {
    if (!isInitialized || !user) return;
    loadData().finally(() => setIsLoading(false));
  }, [isInitialized, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };


  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-20">
      <header className="bg-white border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-3"
          >
            <ArrowLeft size={13} />
            Back to Chat
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-text-primary mb-1 flex items-center gap-2">
                <MessageSquare size={22} className="text-text-primary" />
                Conversations
              </h1>
              <p className="text-[13px] text-text-secondary">Browse, search, and revisit previous AI interactions.</p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-text-secondary hover:text-brand transition-colors bg-white border border-border px-3 py-1.5 rounded-md shadow-2xs cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
            </div>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              All Agents
            </button>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              All Models
            </button>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] border border-border rounded-md hover:bg-zinc-50 transition-colors">
              <Filter size={14} />
              Date
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6">
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 flex flex-col gap-2 animate-pulse">
                  <div className="h-4 w-48 bg-zinc-200 rounded" />
                  <div className="h-3 w-80 bg-zinc-100 rounded" />
                  <div className="h-3 w-32 bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredSessions.map(session => (
                <div key={session.session_id} className="p-5 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-zinc-900 mb-1 truncate">
                      {session.title || "Support Request"}
                    </h3>
                    <p className="text-[13px] text-text-secondary truncate mb-2">
                      {session.last_message || "No messages"}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 capitalize">
                        {session.title?.toLowerCase().includes('billing') ? 'Billing Agent' : 
                         session.title?.toLowerCase().includes('tech') ? 'Technical Agent' : 'Agent Router'}
                      </span>
                      <span>·</span>
                      <span>{session.message_count} messages</span>
                      <span>·</span>
                      <span>Groq</span>
                      <span>·</span>
                      <span>{new Date(session.last_timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Link 
                      href={`/chat?session=${session.session_id}`}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 border border-border text-zinc-900 font-semibold text-[12px] px-4 py-2 rounded-lg transition-colors"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px] font-medium text-zinc-700 mb-1">No conversations found</p>
              <p className="text-[12px] text-text-muted">Start a new support session to see your conversation logs here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
