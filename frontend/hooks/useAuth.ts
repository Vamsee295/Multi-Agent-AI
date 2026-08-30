"use client";

import { useAuthContext } from "@/context/AuthContext";

/**
 * Hook to access the centralized Supabase Authentication context.
 * Re-exports state and actions for seamless compatibility with all application components.
 */
export function useAuth() {
  return useAuthContext();
}
