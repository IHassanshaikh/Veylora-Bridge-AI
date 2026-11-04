"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  avatar_url?: string;
  paypal_email?: string;
  auth_provider?: string;
  is_verified?: boolean;
  verification_status?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  id_document_type?: string;
  id_document_number?: string;
  id_document_country?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  id_selfie_url?: string;
  verified_at?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleUser: { name: string; email: string; role?: "client" | "freelancer"; avatar_url?: string }) => Promise<void>;
  register: (name: string, email: string, password: string, role: "client" | "freelancer", paypalEmail?: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (targetRole: "client" | "freelancer" | "admin") => Promise<void>;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("trustbridge_token");
      const storedUser = localStorage.getItem("trustbridge_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse stored auth session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (authToken: string, authUser: AuthUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("trustbridge_token", authToken);
    localStorage.setItem("trustbridge_user", JSON.stringify(authUser));
    localStorage.setItem("trustbridge_role", authUser.role);
    window.dispatchEvent(new Event("roleChanged"));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Authentication failed");
      }

      const data = await res.json();
      saveSession(data.access_token, data.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleUser: { name: string; email: string; role?: "client" | "freelancer"; avatar_url?: string }) => {
    if (!googleUser || !googleUser.email) {
      throw new Error("Google user profile required. Please select or enter your Google account.");
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleUser.name,
          email: googleUser.email.trim().toLowerCase(),
          role: googleUser.role || "client",
          avatar_url: googleUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.name}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Google Sign-In failed" }));
        throw new Error(err.detail || "Google Sign-In failed");
      }

      const data = await res.json();
      saveSession(data.access_token, data.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "client" | "freelancer",
    paypalEmail?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          paypal_email: paypalEmail || email,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(err.detail || "Registration failed");
      }

      const data = await res.json();
      saveSession(data.access_token, data.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("trustbridge_token");
    localStorage.removeItem("trustbridge_user");
    localStorage.removeItem("trustbridge_role");
    window.dispatchEvent(new Event("roleChanged"));
    router.push("/login");
  };

  const switchDemoUser = async (targetRole: "client" | "freelancer" | "admin") => {
    // Quick-sign-in preset for Hackathon Judges
    const credentials = {
      client: { email: "alex@acmestudio.io", password: "Password123!" },
      freelancer: { email: "elena@devcraft.io", password: "Password123!" },
      admin: { email: "admin@payflow.io", password: "AdminSecret2026!" },
    };
    await login(credentials[targetRole].email, credentials[targetRole].password);
  };

  const updateUser = (updatedUser: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("trustbridge_user", JSON.stringify(merged));
      localStorage.setItem("payflow_user", JSON.stringify(merged));
      return merged;
    });
    window.dispatchEvent(new Event("userUpdated"));
  };

  const refreshUser = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setUser(fresh);
        localStorage.setItem("trustbridge_user", JSON.stringify(fresh));
        localStorage.setItem("payflow_user", JSON.stringify(fresh));
      }
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchDemoUser,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

