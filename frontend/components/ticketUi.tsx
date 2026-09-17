"use client";

import React from "react";

/** Label + badge style for each ticket lifecycle status in pure monochrome. */
export const STATUS_META: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-zinc-100 text-zinc-800 border-zinc-300 font-medium" },
  ESCALATED: { label: "Escalated", className: "bg-zinc-100 text-zinc-900 border-zinc-400 font-semibold" },
  PENDING_HUMAN: { label: "Pending Human", className: "bg-zinc-200 text-zinc-900 border-zinc-400 font-semibold" },
  ASSIGNED: { label: "Assigned", className: "bg-zinc-100 text-zinc-800 border-zinc-300 font-medium" },
  IN_PROGRESS: { label: "In Progress", className: "bg-zinc-900 text-white border-zinc-900 font-semibold" },
  WAITING_FOR_CUSTOMER: { label: "Waiting for You", className: "bg-zinc-100 text-zinc-800 border-zinc-300 font-medium" },
  RESOLVED: { label: "Resolved", className: "bg-zinc-100 text-zinc-600 border-zinc-300 font-medium" },
  CLOSED: { label: "Closed", className: "bg-zinc-100 text-zinc-500 border-zinc-200 font-medium" },
  REOPENED: { label: "Reopened", className: "bg-zinc-200 text-zinc-900 border-zinc-400 font-semibold" },
};

export const PRIORITY_META: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "bg-zinc-900 text-white border-zinc-900 font-bold" },
  HIGH: { label: "High", className: "bg-zinc-800 text-white border-zinc-800 font-semibold" },
  MEDIUM: { label: "Medium", className: "bg-zinc-200 text-zinc-900 border-zinc-300 font-medium" },
  LOW: { label: "Low", className: "bg-zinc-100 text-zinc-600 border-zinc-200 font-normal" },
};

/** Customer-friendly label for an escalation reason. */
export const REASON_LABELS: Record<string, string> = {
  USER_REQUESTED_HUMAN: "You requested human support",
  AI_RESPONSE_UNHELPFUL: "AI response didn't help",
  LOW_CONFIDENCE: "Low-confidence response",
  KNOWLEDGE_NOT_FOUND: "Answer not found",
  REPEATED_FAILURE: "Repeated failed attempts",
  PAYMENT_DISPUTE: "Payment dispute",
  REFUND_REQUEST: "Refund request",
  SECURITY_ISSUE: "Security concern",
  FRAUD: "Possible fraud",
  SERIOUS_COMPLAINT: "Complaint",
  OTHER: "Other",
};

export function reasonLabel(reason?: string | null): string {
  if (!reason) return "Other";
  return REASON_LABELS[reason] || reason.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
}

export function StatusBadge({ status, size = "sm" }: { status?: string | null; size?: "sm" | "lg" }) {
  const meta = STATUS_META[status || ""] || {
    label: (status || "Unknown").split("_").join(" "),
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide border rounded ${
        size === "lg" ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-0.5"
      } ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const meta = PRIORITY_META[priority || ""] || {
    label: (priority || "Standard").split("_").join(" "),
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide border rounded text-[10px] px-2 py-0.5 ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function normalizeEscalationStatus(status?: string | null): string {
  if (!status) return "OPEN";
  return status.toUpperCase().trim().replace(/[\s-]+/g, "_");
}

export function isActiveEscalation(status?: string | null): boolean {
  if (!status) return false;
  const s = normalizeEscalationStatus(status);
  return !["RESOLVED", "CLOSED"].includes(s);
}

export const isActiveStatus = isActiveEscalation;

export function isResolvedEscalation(status?: string | null): boolean {
  if (!status) return false;
  const s = normalizeEscalationStatus(status);
  return ["RESOLVED", "CLOSED"].includes(s);
}

export const isResolvedStatus = isResolvedEscalation;

/** Format an ISO timestamp for display. */
export function formatTimestamp(iso?: string | null, includeDate = true): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (includeDate) {
      return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}