"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Contact Support &amp; Legal Inquiries
          </h1>
          <p className="text-slate-600 text-sm">
            Have questions about milestone escrow, PayPal API integration, or enterprise arbitration? Reach out to our team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Direct Contact Cards */}
          <div className="space-y-4">
            {/* Email Card */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Email Support</div>
              <a
                href="mailto:hassanshaikh9717@gmail.com"
                className="text-base font-semibold text-slate-900 hover:text-[#0070ba] transition-colors block"
              >
                hassanshaikh9717@gmail.com
              </a>
              <p className="text-xs text-slate-500">
                Direct inquiry inbox for technical support, escrow queries, and hackathon evaluation.
              </p>
            </div>

            {/* Phone Card */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Phone &amp; WhatsApp</div>
              <a
                href="tel:+923101022778"
                className="text-base font-semibold text-slate-900 hover:text-[#0070ba] transition-colors block font-mono"
              >
                +92 310 1022778
              </a>
              <p className="text-xs text-slate-500">
                Available Monday – Saturday, 9:00 AM – 8:00 PM (PKT / UTC+5).
              </p>
            </div>

            {/* Office & SLA */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Response SLA</div>
              <div className="text-base font-semibold text-slate-900">Within 24 Hours</div>
              <p className="text-xs text-slate-500">
                Escrow disputes and emergency contract freezes are triaged by the compliance administrator within 4 hours.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Send a Direct Message</h2>
            <p className="text-xs text-slate-500 mb-6">
              Fill in your inquiry below and our team will get back to you promptly.
            </p>

            {submitted ? (
              <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Message Received</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out. We have received your message and will reply to <span className="font-semibold text-slate-900">{formData.email || "your email"}</span> within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Your Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Milestone Verification / PayPal Escrow Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe your question or requirement in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Direct inquiries: <a href="mailto:hassanshaikh9717@gmail.com" className="font-medium text-slate-800 underline">hassanshaikh9717@gmail.com</a>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 py-8 px-4 sm:px-8 bg-white text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Veylora Bridge AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors font-semibold text-slate-800">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
