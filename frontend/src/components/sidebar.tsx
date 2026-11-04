"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, LayoutDashboard, FileText, 
  PlusCircle, Scale, X, LogOut, ExternalLink,
  CheckCircle2, CreditCard, Settings, UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleToggleMobile = () => {
      setIsMobileOpen((prev) => !prev);
    };

    window.addEventListener("toggleMobileSidebar", handleToggleMobile);
    return () => {
      window.removeEventListener("toggleMobileSidebar", handleToggleMobile);
    };
  }, []);

  const role = mounted && user?.role ? user.role : "client";

  const navItems = role === "admin" ? [
    { name: "Admin Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Disputes Ledger", href: "/dashboard#disputes", icon: Scale },
    { name: "All Projects", href: "/dashboard#projects", icon: FileText },
    { name: "Identity Verification", href: "/verification", icon: UserCheck },
    { name: "Account Settings", href: "/settings", icon: Settings },
    { name: "Target Store (QA)", href: "/demo-store", icon: ExternalLink },
  ] : role === "freelancer" ? [
    { name: "Freelancer Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects & Contracts", href: "/dashboard#projects", icon: FileText },
    { name: "Identity Verification", href: "/verification", icon: UserCheck },
    { name: "Account Settings", href: "/settings", icon: Settings },
    { name: "Target Store (QA)", href: "/demo-store", icon: ExternalLink },
  ] : [
    { name: "Client Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Active Agreements", href: "/dashboard#projects", icon: FileText },
    { name: "Create Agreement", href: "/projects/new", icon: PlusCircle },
    { name: "Identity Verification", href: "/verification", icon: UserCheck },
    { name: "Account Settings", href: "/settings", icon: Settings },
    { name: "Target Store (QA)", href: "/demo-store", icon: ExternalLink },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white text-slate-800 
        flex flex-col justify-between shrink-0 border-r border-slate-200/90 z-50 
        transition-transform duration-200 ease-in-out shadow-xs
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <Link 
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center py-0.5"
            >
              <Image
                src="/veylora-logo.png"
                alt="Veylora Bridge AI"
                width={160}
                height={60}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3.5 space-y-1.5 mt-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-50 text-[#0070ba] shadow-xs font-bold border border-blue-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#0070ba]" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <Link 
              href="/settings"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity"
              title="Open Account Settings"
            >
              {mounted && user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || "User Avatar"} 
                  className="h-8 w-8 rounded-full object-cover shrink-0 shadow-xs border border-slate-300"
                />
              ) : (
                <div suppressHydrationWarning className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                  {mounted && user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="min-w-0">
                <div suppressHydrationWarning className="text-xs font-bold text-slate-900 truncate">
                  {mounted && user?.name ? user.name : "Veylora User"}
                </div>
                <div suppressHydrationWarning className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <span>{mounted && user?.email ? user.email : "Signed in"}</span>
                  {mounted && user?.is_verified && (
                    <span className="text-[9px] font-bold text-black bg-slate-200 px-1 rounded">ID</span>
                  )}
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
