"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GoogleAuthModal } from "@/components/google-auth-modal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { login, switchDemoUser, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showJudgeDemo, setShowJudgeDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsGoogleModalOpen(true);
  };

  const handleDemoSignIn = async (role: "client" | "freelancer" | "admin") => {
    setError(null);
    setIsSubmitting(true);
    try {
      await switchDemoUser(role);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Failed to sign in as demo persona.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/40">
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
            Or with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acmestudio.io"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <span className="text-[11px] text-[#0070ba] font-medium">Demo: Password123!</span>
          </div>
          <div className="relative">
            <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials for Judges with Cancel / Dismiss Cross Button */}
      {showJudgeDemo && (
        <div className="mt-8 pt-6 border-t border-slate-200 relative animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <span>⚡ Hackathon Judge Instant Sign-In</span>
            </p>
            <button
              type="button"
              onClick={() => setShowJudgeDemo(false)}
              className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              title="Remove / Cancel Judge Demo Screen"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn("client")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-left transition-all cursor-pointer"
            >
              <div className="text-[11px] font-bold text-black truncate">Alex (Client)</div>
              <div className="text-[10px] text-slate-600 font-semibold">$3.4k Escrow</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn("freelancer")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-left transition-all cursor-pointer"
            >
              <div className="text-[11px] font-bold text-black truncate">Elena (Dev)</div>
              <div className="text-[10px] text-slate-600 font-semibold">Freelancer</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn("admin")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-left transition-all cursor-pointer"
            >
              <div className="text-[11px] font-bold text-black truncate">Admin</div>
              <div className="text-[10px] text-slate-600 font-semibold">Compliance</div>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Google Sign-In Account Selector Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole="client"
        onSuccess={() => router.push(redirectUrl)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center mb-6">
          <Image
            src="/veylora-logo.png"
            alt="Veylora Bridge AI"
            width={240}
            height={90}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <img src="/P.png" alt="PayPal" className="h-3.5 w-auto object-contain" />
          <span>PayPal-protected freelance milestone escrow platform</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#0070ba] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
