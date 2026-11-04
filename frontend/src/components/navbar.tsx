"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowRightLeft, CreditCard, CheckCircle2, ExternalLink } from "lucide-react";

export function Navbar() {
  const [currentRole, setCurrentRole] = useState<"client" | "freelancer">("client");

  useEffect(() => {
    const saved = localStorage.getItem("trustbridge_role");
    if (saved === "client" || saved === "freelancer") {
      setCurrentRole(saved);
    }
  }, []);

  const toggleRole = () => {
    const nextRole = currentRole === "client" ? "freelancer" : "client";
    setCurrentRole(nextRole);
    localStorage.setItem("trustbridge_role", nextRole);
    window.dispatchEvent(new Event("roleChanged"));
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/veylora-logo.png"
              alt="Veylora Bridge AI"
              width={160}
              height={60}
              className="h-9 w-auto object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
              PayPal Hackathon
            </span>
          </Link>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/projects/new"
            className="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            New Agreement
          </Link>
          <Link
            href="/demo-store"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Target Store
          </Link>
          <Link
            href="/contact"
            className="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Right side: PayPal Sandbox status & Role Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs text-black font-bold border border-slate-300">
            <CreditCard className="h-3.5 w-3.5 text-black" />
            <span>PayPal Sandbox</span>
          </div>

          <button
            onClick={toggleRole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black border border-slate-300 bg-slate-100 text-black hover:bg-slate-200 transition-all cursor-pointer"
            title="Switch between Client and Freelancer view"
          >
            <ArrowRightLeft className="h-3 w-3 text-black" />
            <span>Role:</span>
            <span className="font-bold underline">
              {currentRole === "client" ? "Client (Alex)" : "Freelancer (Elena)"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
