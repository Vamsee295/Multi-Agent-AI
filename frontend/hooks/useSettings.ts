"use client";

import { useState, useEffect, useCallback } from "react";

export interface WorkspaceSettings {
  model: string;
  responseStyle: "concise" | "balanced" | "detailed";
  useMemory: boolean;
  useRag: boolean;
  showAgentInfo: boolean;
  automaticRouting: boolean;
  agentHandoff: boolean;
  humanEscalation: boolean;
  escalationAlerts: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  theme: "system" | "light" | "dark";
  compactMode: boolean;
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  model: "openai/gpt-oss-120b",
  responseStyle: "balanced",
  useMemory: true,
  useRag: true,
  showAgentInfo: true,
  automaticRouting: true,
  agentHandoff: true,
  humanEscalation: true,
  escalationAlerts: true,
  systemAlerts: true,
  securityAlerts: true,
  theme: "system",
  compactMode: false,
};

const STORAGE_KEY = "techmart_workspace_settings_v1";

export function useSettings() {
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to load workspace settings from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setLastSaved(Date.now());
      } catch (e) {
        console.error("Failed to save workspace settings:", e);
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      setSettings(DEFAULT_SETTINGS);
      setLastSaved(Date.now());
    } catch (e) {
      console.error("Failed to reset settings:", e);
    }
  }, []);

  return {
    settings,
    isLoaded,
    lastSaved,
    updateSetting,
    resetSettings,
  };
}
