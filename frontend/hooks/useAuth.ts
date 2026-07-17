"use client";

import { useState, useCallback, useEffect } from "react";
import { loginUser, registerUser, fetchMe, UserPublic, getApiErrorMessage } from "@/services/api";

const GUEST_KEY = "techmart_guest";
const TOKEN_KEY = "access_token";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const profile = await fetchMe();
      setUser(profile);
      return true;
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const guest = window.localStorage.getItem(GUEST_KEY) === "1";
    const token = window.localStorage.getItem(TOKEN_KEY);

    if (guest && !token) {
      setIsGuest(true);
      setIsAuthenticated(true);
      setIsInitialized(true);
      return;
    }

    if (token) {
      loadUser().then((ok) => {
        setIsGuest(false);
        setIsAuthenticated(ok);
        setIsInitialized(true);
      });
      return;
    }

    setIsInitialized(true);
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await loginUser(email, password);
      window.localStorage.setItem(TOKEN_KEY, access_token);
      window.localStorage.removeItem(GUEST_KEY);
      window.localStorage.removeItem("techmart_session_id");
      setIsGuest(false);
      await loadUser();
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't sign in. Check your email and password."));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUser]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser(name, email, password);
      return await login(email, password);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't create your account."));
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(GUEST_KEY);
    window.localStorage.removeItem("techmart_session_id");
    setUser(null);
    setIsGuest(false);
    setIsAuthenticated(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem("techmart_session_id");
    window.localStorage.setItem(GUEST_KEY, "1");
    setUser(null);
    setIsGuest(true);
    setIsAuthenticated(true);
  }, []);

  const isLoggedIn = isAuthenticated && !isGuest && !!user;

  return {
    isAuthenticated,
    isGuest,
    isLoggedIn,
    user,
    isInitialized,
    loading,
    error,
    login,
    register,
    logout,
    continueAsGuest,
  };
}
