"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { UserPublic } from "@/services/api";

const GUEST_KEY = "techmart_guest";
const SESSION_STORAGE_KEY = "techmart_session_id";

export interface RegisterResult {
  success: boolean;
  requiresEmailConfirmation?: boolean;
  error?: string;
}

export interface AuthContextType {
  user: UserPublic | null;
  supabaseUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(sbUser: User | null): UserPublic | null {
  if (!sbUser) return null;
  const name =
    (sbUser.user_metadata?.name as string) ||
    (sbUser.user_metadata?.full_name as string) ||
    sbUser.email?.split("@")[0] ||
    "User";

  return {
    id: sbUser.id,
    name,
    email: sbUser.email || "",
    created_at: sbUser.created_at || new Date().toISOString(),
  };
}

function formatSupabaseError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid_grant")) {
    return "Invalid email or password. Please try again.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please check your inbox and verify your email before logging in.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists.";
  }
  if (msg.includes("password should be at least")) {
    return "Password should be at least 6 characters long.";
  }
  if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  return error.message || "An authentication error occurred.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth state on mount
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setSupabaseUser(initialSession.user);
          setIsGuest(false);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(GUEST_KEY);
          }
        } else {
          // Check for guest mode
          if (typeof window !== "undefined") {
            const guest = window.localStorage.getItem(GUEST_KEY) === "1";
            if (guest) {
              setIsGuest(true);
            }
          }
        }
      } catch (err) {
        console.error("Error initializing Supabase session:", err);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    }

    initializeAuth();

    // Subscribe to auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);
        if (currentSession) {
          setIsGuest(false);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(GUEST_KEY);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => mapSupabaseUser(supabaseUser), [supabaseUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(formatSupabaseError(signInError));
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setSupabaseUser(data.session.user);
        setIsGuest(false);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(GUEST_KEY);
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
        }
        return true;
      }

      return false;
    } catch (err: any) {
      setError(formatSupabaseError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<RegisterResult> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              full_name: name.trim(),
            },
          },
        });

        if (signUpError) {
          const formatted = formatSupabaseError(signUpError);
          setError(formatted);
          return { success: false, error: formatted };
        }

        // Check if email confirmation is required (session is null when email confirmation is enabled)
        const requiresEmailConfirmation = !data.session;

        return {
          success: true,
          requiresEmailConfirmation,
        };
      } catch (err: any) {
        const formatted = formatSupabaseError(err);
        setError(formatted);
        return { success: false, error: formatted };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error during Supabase signOut:", err);
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_KEY);
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      setSession(null);
      setSupabaseUser(null);
      setIsGuest(false);
      setError(null);
      setLoading(false);
    }
  }, []);

  const continueAsGuest = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.localStorage.setItem(GUEST_KEY, "1");
    }
    setSession(null);
    setSupabaseUser(null);
    setIsGuest(true);
  }, []);

  const isAuthenticated = !!session || isGuest;
  const isLoggedIn = !!session && !isGuest && !!user;

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      session,
      isAuthenticated,
      isGuest,
      isLoggedIn,
      isInitialized,
      loading,
      error,
      login,
      register,
      logout,
      continueAsGuest,
      setError,
    }),
    [
      user,
      supabaseUser,
      session,
      isAuthenticated,
      isGuest,
      isLoggedIn,
      isInitialized,
      loading,
      error,
      login,
      register,
      logout,
      continueAsGuest,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
