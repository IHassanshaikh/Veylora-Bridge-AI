import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Scale, ShieldCheck, Mail, Phone } from "lucide-react";

export default function TermsOfServicePage() {
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
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">
              Privacy Policy
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
              <Scale className="h-4 w-4" />
              <span>Platform Legal Terms</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500">
              Last updated: November 3, 2026 • Effective immediately
            </p>
          </div>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Veylora Bridge AI (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not register, create milestone agreements, or initiate payments through the service.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">2. Description of the Service</h2>
            <p>
              Veylora Bridge AI is a non-custodial milestone governance platform that connects freelance clients and contractors. The Platform provides:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>AI-assisted contract drafting with objective, machine-verifiable acceptance criteria.</li>
              <li>Conditional payment orchestration integrating with the PayPal Orders v2 Sandbox and Live API.</li>
              <li>Automated headless browser proof-of-work test execution via Playwright.</li>
              <li>Cryptographic SHA-256 audit chaining for event integrity.</li>
              <li>Neutral dispute mediation and administrative escrow arbitration.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">3. Milestone Escrow &amp; PayPal Payments</h2>
            <p>
              Clients agree to authorize upfront kickoff advance deposits and held milestone balances using PayPal. When an advance is captured:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Funds are authenticated and authorized via PayPal Orders v2.</li>
              <li>Milestone releases occur upon either (a) automated proof-of-work test pass and client confirmation, or (b) platform administrative resolution.</li>
              <li>The Platform does not act as a traditional depository bank; payments are facilitated and captured directly via PayPal payment rails.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">4. Automated Proof-of-Work Verification</h2>
            <p>
              Contractors submit live deployment endpoints and repository evidence. The Platform’s automated test engine executes Playwright headless browser tests against predefined criteria (HTTP status codes, mobile/desktop viewport responsiveness, and DOM interaction flows). Both parties acknowledge that automated verification acts as an objective baseline to prevent subjective non-payment.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">5. Scope Creep &amp; Dispute Arbitration</h2>
            <p>
              Unilateral requests for features outside the signed acceptance criteria are analyzed by the Scope Change Analyst. If an agreement enters dispute:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>An impartial AI analysis compares the original criteria against the recorded test runs and contractor submissions.</li>
              <li>A platform compliance administrator reviews the evidence and issues a final, binding disbursement decision (Release to Freelancer or Refund to Client).</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Veylora Bridge AI and its operators shall not be liable for indirect, incidental, or consequential damages resulting from third-party payment provider outages, merchant account restrictions, or contractor delivery failures.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">7. Questions &amp; Support Inquiries</h2>
            <p className="text-xs text-slate-600">
              For legal inquiries, contract clarifications, or technical support, please contact:
            </p>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div><strong>Email:</strong> <a href="mailto:hassanshaikh9717@gmail.com" className="text-[#0070ba] hover:underline font-medium">hassanshaikh9717@gmail.com</a></div>
              <div><strong>Phone:</strong> <a href="tel:+923101022778" className="text-[#0070ba] hover:underline font-medium font-mono">+92 310 1022778</a></div>
              <div className="text-slate-500">Veylora Bridge AI • Legal &amp; Governance Operations</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8 px-4 sm:px-8 bg-white text-slate-500 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; 2026 Veylora Bridge AI. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="font-semibold text-slate-800">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
