"use client";

import React, { useState, useEffect } from "react";
import { Bell, Menu, LogOut, ShieldCheck, ChevronDown, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { user, logout, switchDemoUser } = useAuth();
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [showJudgeMode, setShowJudgeMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openMobileNav = () => {
    window.dispatchEvent(new Event("toggleMobileSidebar"));
  };

  const getRoleBadge = (role?: string) => {
    if (!mounted || !role) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          User
        </span>
      );
    }
    const roleLabel = role === "admin" ? "Admin / Compliance" : role === "client" ? "Client Payer" : "Contractor";
    return (
      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-900 text-white tracking-wide">
        {roleLabel}
      </span>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu */}
        <button
          onClick={openMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 suppressHydrationWarning className="text-sm sm:text-base font-bold text-slate-900">
            {mounted && user?.name ? user.name : "Veylora User"}
          </h2>
          <span suppressHydrationWarning>
            {getRoleBadge(mounted ? user?.role : undefined)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* PayPal Sandbox Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-2xs">
          <img src="/P.png" alt="PayPal" className="h-3.5 w-auto object-contain" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
          <span className="font-semibold text-slate-700 text-[11px]">PayPal Sandbox:</span>
          <span suppressHydrationWarning className="font-mono text-slate-500 text-[11px] truncate max-w-[160px]">
            {mounted && (user?.paypal_email || user?.email) ? (user?.paypal_email || user?.email) : "sandbox@paypal.com"}
          </span>
        </div>

        {/* Hackathon Judge Fast-Switcher Dropdown with Close/Cancel Cross */}
        {showJudgeMode && (
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-black transition-colors cursor-pointer"
              title="Switch demo persona for hackathon evaluation"
            >
              <span className="hidden sm:inline text-slate-600 text-[11px] font-bold">Judge Mode:</span>
              <span suppressHydrationWarning className="capitalize font-black text-black">{mounted && user?.role ? user.role : "Account"}</span>
              <ChevronDown className="h-3 w-3 text-slate-600" />
            </button>

            {/* Direct Cross (X) button to remove the judge demo screen/widget */}
            <button
              type="button"
              onClick={() => {
                setShowJudgeMode(false);
                setIsDemoMenuOpen(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              title="Remove Judge Mode from header"
              aria-label="Remove Judge Mode"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {isDemoMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border-2 border-black shadow-xl py-2 z-50 text-xs animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] font-black text-black uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                  <span>Judge Quick-Switch</span>
                  <button
                    type="button"
                    onClick={() => setIsDemoMenuOpen(false)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-black transition-colors cursor-pointer"
                    title="Cancel"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={async () => {
                    setIsDemoMenuOpen(false);
                    await switchDemoUser("client");
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-black text-black">Alex Rivera (Client)</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Acme Studios &bull; $3.4k Escrow</div>
                  </div>
                  {user?.role === "client" && <Check className="h-4 w-4 text-black" />}
                </button>
                <button
                  onClick={async () => {
                    setIsDemoMenuOpen(false);
                    await switchDemoUser("freelancer");
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-black text-black">Elena Rostova (Dev)</div>
                    <div className="text-[10px] text-slate-600 font-semibold">DevCraft Studio &bull; Freelancer</div>
                  </div>
                  {user?.role === "freelancer" && <Check className="h-4 w-4 text-black" />}
                </button>
                <button
                  onClick={async () => {
                    setIsDemoMenuOpen(false);
                    await switchDemoUser("admin");
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-black text-black">Compliance Officer</div>
                    <div className="text-[10px] text-slate-600 font-semibold">Dispute Triage &amp; AI Health</div>
                  </div>
                  {user?.role === "admin" && <Check className="h-4 w-4 text-black" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <button 
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-slate-900 ring-2 ring-white"></span>
        </button>

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign out of account"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
