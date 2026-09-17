"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { EscalationReason, EscalationPriority } from "@/services/api";

const REASON_OPTIONS: { value: EscalationReason; label: string }[] = [
  { value: "USER_REQUESTED_HUMAN", label: "I need human assistance" },
  { value: "AI_RESPONSE_UNHELPFUL", label: "AI response didn't solve my issue" },
  { value: "OTHER", label: "Other reason" },
];

const PRIORITY_OPTIONS: { value: EscalationPriority; label: string }[] = [
  { value: "LOW", label: "Low Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "HIGH", label: "High Priority" },
  { value: "CRITICAL", label: "Critical Issue" },
];

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: EscalationReason, priority: EscalationPriority) => Promise<any>;
  isEscalating: boolean;
  sessionId?: string;
}

export function EscalateModal({
  isOpen,
  onClose,
  onSubmit,
  isEscalating,
  sessionId,
}: EscalateModalProps) {
  const [selectedReason, setSelectedReason] = useState<EscalationReason>("USER_REQUESTED_HUMAN");
  const [selectedPriority, setSelectedPriority] = useState<EscalationPriority>("MEDIUM");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isEscalating) return;
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (isEscalating || !sessionId) return;
    setLocalError(null);
    try {
      await onSubmit(selectedReason, selectedPriority);
    } catch (err: any) {
      setLocalError(err?.message || "Unable to create the escalation. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-border animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-zinc-800" />
            <h3 className="text-[16px] font-bold text-zinc-900">Escalate to Human Support</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isEscalating}
            className="p-1 rounded hover:bg-zinc-100 transition-colors text-text-muted disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-[13px] text-zinc-600">
            Choose a reason for escalation — a human support agent will review your conversation and respond.
          </p>

          {REASON_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedReason === opt.value
                  ? "border-zinc-800 bg-zinc-50 ring-1 ring-zinc-800"
                  : "border-border hover:border-zinc-300"
              }`}
            >
              <input
                type="radio"
                name="escalation_reason"
                value={opt.value}
                checked={selectedReason === opt.value}
                onChange={() => setSelectedReason(opt.value)}
                disabled={isEscalating}
                className="sr-only"
              />
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedReason === opt.value
                    ? "border-zinc-800 bg-zinc-800"
                    : "border-zinc-300"
                }`}
              >
                {selectedReason === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-[13px] font-medium text-zinc-800">{opt.label}</span>
            </label>
          ))}

          <div className="pt-2">
            <label className="text-[12px] font-semibold text-zinc-800 uppercase tracking-wider mb-2 block">
              Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-center py-2 rounded border cursor-pointer transition-colors ${
                    selectedPriority === opt.value
                      ? "border-zinc-800 bg-zinc-800 text-white font-medium"
                      : "border-border text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="escalation_priority"
                    value={opt.value}
                    checked={selectedPriority === opt.value}
                    onChange={() => setSelectedPriority(opt.value)}
                    disabled={isEscalating}
                    className="sr-only"
                  />
                  <span className="text-[12px]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {localError && (
            <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 animate-fade-in">
              {localError}
            </div>
          )}

          {!sessionId && (
            <p className="text-[12px] text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2 mt-2">
              You need an active conversation to escalate to a human.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isEscalating}
            className="px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-zinc-900 border border-border rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isEscalating || !sessionId}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isEscalating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating escalation...
              </>
            ) : (
              "Escalate to Human"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
