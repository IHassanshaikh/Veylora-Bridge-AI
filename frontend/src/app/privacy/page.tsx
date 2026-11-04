import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, Phone, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/veylora-logo.png"
              alt="Veylora Bridge AI"
              width={160}
              height={60}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-12 space-y-8">
          <div className="space-y-2 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0070ba]">
              <ShieldCheck className="h-4 w-4" />
              <span>Platform Legal Documentation</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500">
              Last updated: November 3, 2026 • Effective immediately
            </p>
          </div>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">1. Overview &amp; Commitment</h2>
            <p>
              Veylora Bridge AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Platform&rdquo;) is committed to protecting the privacy of clients, freelance contractors, and platform evaluators. This Privacy Policy outlines how we collect, process, store, and safeguard your personal information and financial transaction identifiers when you use our autonomous milestone escrow and automated proof-of-work verification services.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>Account Identifiers:</strong> Your name, email address, account password hash, and authenticated provider identifiers (such as Google OAuth profile data).</li>
              <li><strong>Payment &amp; Transaction Metadata:</strong> PayPal transaction IDs, Order IDs, Capture IDs, and PayPal account email addresses. <em>Note: We do not process, store, or have access to raw credit card numbers or banking credentials; all fund authorization and capture occurs directly through PayPal&rsquo;s secure Orders v2 API infrastructure.</em></li>
              <li><strong>Project &amp; Contract Data:</strong> Contract scope summaries, milestone allocations, acceptance criteria specifications, and deliverable notes.</li>
              <li><strong>Verification Evidence:</strong> Deployment URLs, GitHub repository URLs, automated test execution logs, screenshots captured by our headless Playwright runner, and SHA-256 cryptographic hash trees.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">3. How Information is Used</h2>
            <p>
              We use collected information strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Orchestrate conditional PayPal kickoff advance payments and milestone escrow releases.</li>
              <li>Execute automated Playwright test suites against contractor deployment endpoints to verify acceptance criteria.</li>
              <li>Maintain immutable, tamper-evident SHA-256 audit logs of all contract lifecycle events.</li>
              <li>Facilitate neutral AI analysis and administrator triage during dispute resolution proceedings.</li>
              <li>Communicate critical account notifications, milestone sign-offs, and payment receipts.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">4. Third-Party Services &amp; PayPal Integration</h2>
            <p>
              Our application integrates directly with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>PayPal REST API v2:</strong> For payment intent authorization, order capture, and disbursement escrow operations. Your transactions are subject to PayPal&rsquo;s Privacy Statement and User Agreement.</li>
              <li><strong>Google Authentication:</strong> For federated single sign-on access.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">5. Cryptographic Audit Streams &amp; Immutability</h2>
            <p>
              To eliminate payment ghosting and retroactive contract tampering, milestones and verification runs are recorded into a cryptographic event stream. Each audit record contains a SHA-256 hash chaining back to the preceding state. These hashes are public to contract participants but do not expose raw passwords or financial account credentials.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">6. Data Retention &amp; Rights</h2>
            <p>
              You maintain the right to access, review, and request deletion of your personal account information at any time, subject to legal retention obligations for settled financial transactions and audit verification records.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">7. Contact the Data Protection Officer</h2>
            <p className="text-xs text-slate-600">
              If you have any questions regarding this Privacy Policy or wish to exercise your data rights, please contact our team directly:
            </p>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div><strong>Email:</strong> <a href="mailto:hassanshaikh9717@gmail.com" className="text-[#0070ba] hover:underline font-medium">hassanshaikh9717@gmail.com</a></div>
              <div><strong>Phone:</strong> <a href="tel:+923101022778" className="text-[#0070ba] hover:underline font-medium font-mono">+92 310 1022778</a></div>
              <div className="text-slate-500">Veylora Bridge AI • Compliance &amp; Data Security</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8 px-4 sm:px-8 bg-white text-slate-500 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; 2026 Veylora Bridge AI. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-semibold text-slate-800">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
