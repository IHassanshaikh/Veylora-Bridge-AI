"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Lock, ArrowRight, CheckCircle2,
  Scale, DollarSign, ExternalLink, Code2, Users, FileText,
  Mail, Phone
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GoogleAuthModal } from "@/components/google-auth-modal";

export default function LandingView() {
  const router = useRouter();
  const { user, switchDemoUser } = useAuth();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFastPass = async (role: "client" | "freelancer" | "admin") => {
    await switchDemoUser(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#0070ba] selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/veylora-logo.png"
                alt="Veylora Bridge AI"
                width={160}
                height={56}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
              <img src="/P.png" alt="PayPal" className="h-3 w-auto object-contain" />
              <span>PayPal Hackathon 2026</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#workflow" className="hover:text-slate-900 transition-colors">Workflow</a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#paypal-escrow" className="hover:text-slate-900 transition-colors">PayPal Escrow</a>
            <Link href="/demo-store" className="hover:text-slate-900 transition-colors flex items-center gap-1 text-[#0070ba]">
              <span>QA Demo Store</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-2.5">
            {mounted && user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Signed in as <strong className="text-slate-800">{user.name}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded bg-[#0070ba] hover:bg-[#003087] text-white font-medium text-xs transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Autonomous Milestone Escrow &bull; PayPal Orders v2 Sandbox</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.18] mb-6">
            Autonomous Milestone Escrow &amp; Proof-of-Work Verification for Freelance Contracts
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Eliminate payment ghosting and scope disputes. Veylora Bridge locks project funds in PayPal Escrow and releases payouts only when deliverables pass headless Playwright automated acceptance tests.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded bg-[#0070ba] hover:bg-[#003087] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Sandbox Evaluation Bar */}
          <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 max-w-2xl mx-auto text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Evaluation Access (1-Click Test Sign-In)
              </span>
              <span className="text-[11px] text-slate-500">Live PayPal Sandbox Mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleFastPass("client")}
                className="p-3 rounded bg-white hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 mb-0.5">Alex Rivera</div>
                <div className="text-[11px] text-slate-500">Role: Client (Deposit &amp; Fund)</div>
              </button>

              <button
                onClick={() => handleFastPass("freelancer")}
                className="p-3 rounded bg-white hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 mb-0.5">Elena Rostova</div>
                <div className="text-[11px] text-slate-500">Role: Freelancer (Submit &amp; Test)</div>
              </button>

              <button
                onClick={() => handleFastPass("admin")}
                className="p-3 rounded bg-white hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 mb-0.5">Admin Compliance</div>
                <div className="text-[11px] text-slate-500">Role: Auditor (Arbitrate &amp; Log)</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Operational Flow */}
      <section id="workflow" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0070ba]">Architecture &amp; Flow</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How Veylora Bridge Operates</h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto mt-2">
              Every phase from contract drafting to PayPal release is bound by automated validation rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Contract &amp; Criteria</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client or contractor creates project scope. Acceptance criteria are broken into deterministic tests with DOM selector targets.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">PayPal Advance Deposit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client authorizes the kickoff advance and secures held milestone balance via PayPal Orders v2 Sandbox.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Autonomous Test Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contractor submits live deliverable URL. Headless Playwright launches tests, records selector interactions, and logs screenshots.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-2.5">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900">Milestone Release</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When acceptance tests pass, escrow funds are released to contractor PayPal account. SHA-256 hash chains write to the audit ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section id="capabilities" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0070ba]">Core Infrastructure</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Platform Verification Engine</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg border border-slate-200 space-y-2">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
                <Code2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Contract Architect</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structures clear deliverable milestones with measurable acceptance rules.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 space-y-2">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Work Inspector</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes headless Playwright tests against target URLs to verify required UI states.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 space-y-2">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
                <DollarSign className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">PayPal Coordinator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enforces condition-based authorization, capture, and escrow disbursement via PayPal REST API.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 space-y-2">
              <div className="h-8 w-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
                <Scale className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Dispute Arbiter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provides compliance officers with Playwright test logs, screenshots, and diffs to resolve disputes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 bg-slate-50 text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <Image
                src="/veylora-logo.png"
                alt="Veylora Bridge AI"
                width={150}
                height={52}
                className="h-8 w-auto object-contain mb-2"
              />
              <p className="text-xs text-slate-500 max-w-sm">
                Independent escrow verification and payment protection platform for software agreements. Built for the PayPal International Hackathon 2026.
              </p>
            </div>

            {/* Direct Contact Details */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wide">Direct Contact &amp; Support</div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-[#0070ba]" />
                <a href="mailto:hassanshaikh9717@gmail.com" className="hover:text-[#0070ba] font-medium transition-colors">
                  hassanshaikh9717@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-[#0070ba]" />
                <a href="tel:+923101022778" className="hover:text-[#0070ba] font-medium font-mono transition-colors">
                  +92 310 1022778
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>&copy; 2026 Veylora Bridge AI. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Support</Link>
              <Link href="/demo-store" className="hover:text-slate-900 transition-colors">QA Demo Store</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Google Sign-In Account Selector Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole="client"
        onSuccess={() => router.push("/dashboard")}
      />
    </div>
  );
}

