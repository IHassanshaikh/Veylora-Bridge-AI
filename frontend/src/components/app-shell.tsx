"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/demo-store" ||
    pathname.startsWith("/invite/");

  // Route protection for private pages
  useEffect(() => {
    if (!isLoading && !isPublicRoute && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isPublicRoute, token, pathname, router]);

  // If public route, render directly without sidebar / topbar chrome
  if (isPublicRoute) {
    return <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">{children}</div>;
  }

  // If authenticated route
  return (
    <div className="bg-[#f8f9fd] text-slate-900 min-h-screen flex antialiased">
      {/* Left Sidebar */}
      <Suspense fallback={<aside className="w-64 bg-white border-r border-slate-200 min-h-screen shrink-0" />}>
        <Sidebar />
      </Suspense>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Unverified Identity Notice Bar */}
        {user && !user.is_verified && pathname !== "/verification" && (
          <div className="bg-black text-white px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-950 shrink-0 z-30">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping shrink-0" />
              <div>
                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight uppercase">
                  Identity Verification Required
                </span>
                <span className="hidden md:inline text-xs text-slate-300 ml-3">
                  Government ID card and portrait photo verification required for PayPal escrow disbursements.
                </span>
              </div>
            </div>
            <Link
              href="/verification"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black font-extrabold text-xs tracking-wide transition-all shrink-0 cursor-pointer shadow-md"
            >
              <span>Verify Identity Now →</span>
            </Link>
          </div>
        )}

        <Suspense fallback={<header className="h-16 bg-white border-b border-slate-200" />}>
          <Topbar />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#070a13]" />}>
        <ShellContent>{children}</ShellContent>
      </Suspense>
    </AuthProvider>
  );
}
