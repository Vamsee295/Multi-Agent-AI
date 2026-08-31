"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, CheckCircle2, Copy, Check,
  KeyRound, Shield, LogOut, Trash2, Cpu, Database, RefreshCw, AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { checkHealth, HealthResponse } from "@/services/api";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isInitialized, logout } = useAuth();
  const { settings, updateSetting, lastSaved } = useSettings();

  const [copiedUserId, setCopiedUserId] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sign out others state
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
  const [signOutOthersSuccess, setSignOutOthersSuccess] = useState(false);

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    checkHealth().then(setHealth).catch(console.error);
  }, []);

  // Show "✓ Saved" toast whenever lastSaved updates
  useEffect(() => {
    if (lastSaved) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  const handleCopyUserId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      router.push("/login");
    } catch (e) {
      console.error("Failed to sign out:", e);
      setIsSigningOut(false);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      setIsSigningOutOthers(true);
      await supabase.auth.signOut({ scope: "others" });
      setSignOutOthersSuccess(true);
      setTimeout(() => setSignOutOthersSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to sign out other sessions:", e);
    } finally {
      setIsSigningOutOthers(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== "delete my account") return;
    try {
      setDeleteLoading(true);
      // Clean sign out
      await logout();
      router.push("/register");
    } catch (e) {
      console.error("Failed to delete account:", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const truncatedUserId = user.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : "";

  // Functional Switch Component
  const FunctionalToggle = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
  }) => {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-zinc-900" : "bg-zinc-200"
        }`}
      >
        <div
          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-primary pb-24">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 md:px-8 sticky top-0 z-20">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors mb-2"
            >
              <ArrowLeft size={13} />
              Back to Workspace
            </Link>
            <h1 className="text-[22px] font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Settings size={20} className="text-text-primary" />
              Settings
            </h1>
            <p className="text-[12px] text-text-secondary">
              Manage your account, AI preferences, and workspace configuration.
            </p>
          </div>

          {/* Real-time Save Indicator */}
          <div
            className={`flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md transition-all duration-300 ${
              showSavedToast ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <Check size={13} />
            <span>Saved</span>
          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* 1. ACCOUNT */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Account</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Email address</span>
                <span className="text-[12px] text-text-muted">Managed via Supabase Identity</span>
              </div>
              <span className="text-[13px] font-mono text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-md border border-border">
                {user.email}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">User ID</span>
                <span className="text-[12px] text-text-muted">Unique Supabase identifier</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-md border border-border">
                  {truncatedUserId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="flex items-center gap-1 text-[12px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-border px-2.5 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Copy full User ID"
                >
                  {copiedUserId ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-t border-border">
              <span className="text-[14px] font-medium text-zinc-900">Account status</span>
              <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Active & Authenticated
              </span>
            </div>
          </div>
        </section>

        {/* 2. SECURITY */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Security</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Email verification</span>
                <span className="text-[12px] text-text-muted">Verified via Supabase 8-digit OTP</span>
              </div>
              <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block mb-0.5">Password</span>
                <span className="text-[12px] text-text-secondary">Update your Supabase authentication password</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-[12px] font-semibold text-zinc-800 bg-white hover:bg-zinc-50 border border-border px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                Change password
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block mb-0.5">Active sessions</span>
                <span className="text-[12px] text-text-secondary">
                  {signOutOthersSuccess
                    ? "Successfully signed out all other devices!"
                    : "1 active authenticated Supabase session"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOutOthers}
                disabled={isSigningOutOthers}
                className="text-[12px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-border px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isSigningOutOthers ? "Revoking..." : "Sign out other sessions"}
              </button>
            </div>
          </div>
        </section>

        {/* 3. AI PREFERENCES */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">AI Preferences</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Default model</span>
                <span className="text-[12px] text-text-muted">Inference model used for agent task execution</span>
              </div>
              <select
                value={settings.model}
                onChange={(e) => updateSetting("model", e.target.value)}
                className="border border-border rounded-md px-3 py-1.5 text-[13px] bg-zinc-50 outline-none focus:ring-1 focus:ring-brand font-mono"
              >
                <option value="openai/gpt-oss-120b">Groq / llama-3.3-70b (Default)</option>
                <option value="llama-3.1-8b-instant">Groq / llama-3.1-8b-instant</option>
                <option value="mixtral-8x7b-32768">Groq / mixtral-8x7b-32768</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Response style</span>
                <span className="text-[12px] text-text-muted">Controls conciseness and detail level of responses</span>
              </div>
              <select
                value={settings.responseStyle}
                onChange={(e) => updateSetting("responseStyle", e.target.value as any)}
                className="border border-border rounded-md px-3 py-1.5 text-[13px] bg-zinc-50 outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="balanced">Balanced (Standard)</option>
                <option value="concise">Concise (Under 3 sentences)</option>
                <option value="detailed">Detailed (In-depth explanations)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Conversation memory</span>
                <span className="text-[12px] text-text-muted">Use previous turns to maintain contextual continuity</span>
              </div>
              <FunctionalToggle
                checked={settings.useMemory}
                onChange={(v) => updateSetting("useMemory", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">RAG knowledge retrieval</span>
                <span className="text-[12px] text-text-muted">Query FAISS vector store for relevant company context</span>
              </div>
              <FunctionalToggle
                checked={settings.useRag}
                onChange={(v) => updateSetting("useRag", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Show agent information</span>
                <span className="text-[12px] text-text-muted">Display invoked agent pills and pipeline badges in chat</span>
              </div>
              <FunctionalToggle
                checked={settings.showAgentInfo}
                onChange={(v) => updateSetting("showAgentInfo", v)}
              />
            </div>
          </div>
        </section>

        {/* 4. AGENT BEHAVIOR */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Agent Behavior</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Automatic routing</span>
                <span className="text-[12px] text-text-muted">Route user queries dynamically across 5 domain specialists</span>
              </div>
              <FunctionalToggle
                checked={settings.automaticRouting}
                onChange={(v) => updateSetting("automaticRouting", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Agent handoff</span>
                <span className="text-[12px] text-text-muted">Allow multi-agent queries to aggregate in parallel</span>
              </div>
              <FunctionalToggle
                checked={settings.agentHandoff}
                onChange={(v) => updateSetting("agentHandoff", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Human escalation</span>
                <span className="text-[12px] text-text-muted">Automatically open support tickets upon detected frustration</span>
              </div>
              <FunctionalToggle
                checked={settings.humanEscalation}
                onChange={(v) => updateSetting("humanEscalation", v)}
              />
            </div>
          </div>
        </section>

        {/* 5. NOTIFICATIONS */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Notifications</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Escalation alerts</span>
                <span className="text-[12px] text-text-muted">Notify when a conversation is flagged for human intervention</span>
              </div>
              <FunctionalToggle
                checked={settings.escalationAlerts}
                onChange={(v) => updateSetting("escalationAlerts", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">System alerts</span>
                <span className="text-[12px] text-text-muted">Notify on vector store indexing or API connectivity issues</span>
              </div>
              <FunctionalToggle
                checked={settings.systemAlerts}
                onChange={(v) => updateSetting("systemAlerts", v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Security alerts</span>
                <span className="text-[12px] text-text-muted">Notify when new sessions or password changes occur</span>
              </div>
              <FunctionalToggle
                checked={settings.securityAlerts}
                onChange={(v) => updateSetting("securityAlerts", v)}
              />
            </div>
          </div>
        </section>

        {/* 6. APPEARANCE */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Appearance</h2>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Theme</span>
                <span className="text-[12px] text-text-muted">Workspace visual mode</span>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting("theme", e.target.value as any)}
                className="border border-border rounded-md px-3 py-1.5 text-[13px] bg-zinc-50 outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark" disabled>Dark (Coming Soon)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <span className="text-[14px] font-medium text-zinc-900 block">Compact mode</span>
                <span className="text-[12px] text-text-muted">High-density workspace padding</span>
              </div>
              <FunctionalToggle
                checked={settings.compactMode}
                onChange={(v) => updateSetting("compactMode", v)}
              />
            </div>
          </div>
        </section>

        {/* 7. WORKSPACE INFORMATION */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-border pb-2">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Workspace Information</h2>
          </div>
          <div className="bg-zinc-50 border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">Environment</span>
              <span className="font-medium text-zinc-900">Production</span>
            </div>
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">RAG Vector Store</span>
              <span className="font-medium text-zinc-900">
                FAISS ({health?.knowledge_base_chunks_indexed || 12} indexed chunks)
              </span>
            </div>
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">Embedding Model</span>
              <span className="font-mono text-zinc-700">sentence-transformers/all-MiniLM-L6-v2</span>
            </div>
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">Active LLM Provider</span>
              <span className="font-medium text-zinc-900 capitalize">{health?.llm_provider || "Groq"}</span>
            </div>
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">Authentication Engine</span>
              <span className="font-medium text-zinc-900">Supabase Auth (8-digit OTP)</span>
            </div>
            <div className="grid grid-cols-2 text-[13px]">
              <span className="text-text-muted">System Status</span>
              <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operational
              </span>
            </div>
          </div>
        </section>

        {/* 8. DANGER ZONE */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1 border-b border-red-200 pb-2">
            <h2 className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Danger Zone</h2>
          </div>
          <div className="bg-red-50/30 border border-red-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <span className="text-[14px] font-bold text-zinc-900 block mb-0.5">Sign Out</span>
                <span className="text-[12px] text-text-secondary">Terminate your active session on this browser</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-[13px] font-semibold text-zinc-800 bg-white hover:bg-zinc-50 border border-border px-4 py-2 rounded-lg transition-colors shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-red-200/50">
              <div>
                <span className="text-[14px] font-bold text-red-600 block mb-0.5">Delete account</span>
                <span className="text-[12px] text-zinc-600">
                  Permanently delete your user profile and conversation records
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 border border-red-700 px-4 py-2 rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                Delete account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <h3 className="text-[18px] font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <KeyRound size={18} /> Change Password
            </h3>
            <p className="text-[13px] text-text-secondary mb-5">
              Enter your new password below. It will update your Supabase account.
            </p>

            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-[13px] flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-lg text-[13px] flex items-center gap-2">
                <Check size={15} className="shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 text-[14px] border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 text-[14px] border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={passwordLoading}
                  className="px-4 py-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-black hover:bg-zinc-800 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <h3 className="text-[18px] font-bold text-red-600 mb-1 flex items-center gap-2">
              <Trash2 size={18} /> Delete Account
            </h3>
            <p className="text-[13px] text-text-secondary mb-4">
              This action cannot be undone. To confirm, type{" "}
              <strong className="text-zinc-900 font-mono">delete my account</strong> below:
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="delete my account"
              className="w-full px-3 py-2 text-[14px] border border-red-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none mb-5 font-mono"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText("");
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  deleteConfirmationText.trim().toLowerCase() !== "delete my account" ||
                  deleteLoading
                }
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
