"use client";

import React, { useState } from "react";
import { X, UserPlus, Check, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "client" | "freelancer";
  onSuccess?: () => void;
}

export function GoogleAuthModal({
  isOpen,
  onClose,
  defaultRole = "client",
  onSuccess,
}: GoogleAuthModalProps) {
  const { loginWithGoogle } = useAuth();
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer">(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccount = async (account: {
    name: string;
    email: string;
    role: "client" | "freelancer";
    avatar: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle({
        name: account.name,
        email: account.email,
        role: account.role,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setError("Please provide your name and Google email address.");
      return;
    }
    if (!customEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle({
        name: customName.trim(),
        email: customEmail.trim().toLowerCase(),
        role: selectedRole,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate Google account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Logo */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex justify-center mb-3">
            <svg className="h-7 w-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Sign in with Google
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose an account to continue to <span className="font-semibold text-slate-700">Veylora Bridge AI</span>
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Account Selector List */}
        {!isCustomMode ? (
          <div className="p-4 space-y-2">
            {/* Account 1: Client */}
            <button
              onClick={() =>
                handleSelectAccount({
                  name: "Alex Rivera",
                  email: "alex.rivera@nexusdigital.io",
                  role: "client",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                })
              }
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  AR
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-[#0070ba] transition-colors">
                    Alex Rivera
                  </div>
                  <div className="text-xs text-slate-500">alex.rivera@nexusdigital.io</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0070ba] border border-blue-200">
                Client
              </span>
            </button>

            {/* Account 2: Freelancer */}
            <button
              onClick={() =>
                handleSelectAccount({
                  name: "Elena Rostova",
                  email: "elena.rostova@devcraft.studio",
                  role: "freelancer",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                })
              }
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  ER
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Elena Rostova
                  </div>
                  <div className="text-xs text-slate-500">elena.rostova@devcraft.studio</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Freelancer
              </span>
            </button>

            {/* Option 3: Use your own Google account */}
            <button
              onClick={() => setIsCustomMode(true)}
              className="w-full p-3 rounded-xl hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-[#0070ba] transition-all flex items-center gap-3 text-left group"
            >
              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 group-hover:text-[#0070ba] flex items-center justify-center shrink-0 transition-colors">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-[#0070ba] transition-colors">
                  Use another Google account
                </div>
                <div className="text-xs text-slate-500">Enter your own custom email and name</div>
              </div>
            </button>
          </div>
        ) : (
          /* Custom Google Identity Input */
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Email Address
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Join As
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    selectedRole === "client"
                      ? "bg-blue-50 border-[#0070ba] text-[#0070ba]"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Client (Hiring)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("freelancer")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    selectedRole === "freelancer"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Freelancer (Talent)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Google</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          Secured with Google OAuth 2.0 • Veylora Bridge Sandbox
        </div>
      </div>
    </div>
  );
}

