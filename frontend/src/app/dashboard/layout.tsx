import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Escrow Vault & Milestone Workstreams",
  description:
    "Monitor active client-freelancer escrow agreements, review milestone proof-of-work test verifications, track PayPal captures, and manage sequential payouts.",
  keywords: [
    "Escrow Dashboard",
    "PayPal Milestone Vault",
    "Freelance Workstream",
    "Proof of Work Ledger",
    "Automated Acceptance Verification",
    "Sequential Payouts",
    "Client Contractor Overview"
  ],
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Dashboard — Escrow Vault & Milestone Workstreams | Veylora Bridge AI",
    description:
      "Monitor active client-freelancer escrow agreements, review milestone proof-of-work test verifications, and track sequential PayPal payouts.",
    url: "/dashboard",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

