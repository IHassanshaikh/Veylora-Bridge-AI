"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Loader2, Briefcase, Code } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GoogleAuthModal } from "@/components/google-auth-modal";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const { register, isLoading } = useAuth();

  const [role, setRole] = useState<"client" | "freelancer">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password, role, paypalEmail || email);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Email may already be in use.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    setError(null);
    setIsGoogleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Join the AI-governed PayPal freelance escrow network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-slate-200/90 py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/40">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Choice Cards */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select your primary account role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  role === "client"
                    ? "bg-blue-50/70 border-[#0070ba] ring-1 ring-[#0070ba]"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className={`h-5 w-5 ${role === "client" ? "text-[#0070ba]" : "text-slate-400"}`} />
                  <span className={`h-2.5 w-2.5 rounded-full ${role === "client" ? "bg-[#0070ba]" : "bg-slate-200"}`} />
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">I am a Client</div>
                <div className="text-[11px] text-slate-500 leading-tight">Hire talent & fund protected milestones</div>
              </button>

              <button
                type="button"
                onClick={() => setRole("freelancer")}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  role === "freelancer"
                    ? "bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Code className={`h-5 w-5 ${role === "freelancer" ? "text-emerald-600" : "text-slate-400"}`} />
                  <span className={`h-2.5 w-2.5 rounded-full ${role === "freelancer" ? "bg-emerald-500" : "bg-slate-200"}`} />
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">I am a Freelancer</div>
                <div className="text-[11px] text-slate-500 leading-tight">Deliver code & get guaranteed payouts via AI proof</div>
              </button>
            </div>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google as {role === "client" ? "Client" : "Freelancer"}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or fill details
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signup-paypal-email" className="flex items-center text-xs font-semibold text-slate-700">
                  <img src="/P.png" alt="PayPal" className="h-3.5 w-auto object-contain inline-block mr-1.5" />
                  <span>PayPal Payout Email</span>
                </label>
                <span className="text-[10px] text-slate-400">Optional (Defaults to email)</span>
              </div>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="signup-paypal-email"
                  name="paypalEmail"
                  type="email"
                  autoComplete="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="paypal-account@email.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create {role === "client" ? "Client" : "Freelancer"} Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0070ba] hover:underline">
            Sign in
          </Link>
        </p>

        {/* Interactive Google Sign-In Account Selector Modal */}
        <GoogleAuthModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          defaultRole={role}
          onSuccess={() => router.push(redirectUrl)}
        />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 text-slate-400 text-xs">
        Loading registration...
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
