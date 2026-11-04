import type { Metadata } from "next";
import LandingView from "@/components/landing-view";

export const metadata: Metadata = {
  title: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification for PayPal",
  description:
    "Autonomous freelance milestone escrow powered by PayPal Orders v2, Automated Proof of Work, and AI-driven dispute mediation. Protect contracts, fund milestones securely, and release payments upon verified delivery.",
  keywords: [
    "PayPal Escrow",
    "Milestone Escrow",
    "Freelance Payment Protection",
    "Automated Proof of Work",
    "AI Contract Verification",
    "PayPal Developer Challenge",
    "Smart Milestone Release",
    "Playwright Contract Testing",
    "PayPal Orders v2",
    "PayPal Payouts v1",
    "Autonomous Milestone Vault",
    "Veylora Bridge AI"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification for PayPal",
    description:
      "Lock client milestone funds in PayPal escrow and release them instantly when automated test suites verify deliverable criteria.",
    url: "/",
    siteName: "Veylora Bridge AI",
    images: [
      {
        url: "/veylora-logo.png",
        width: 1200,
        height: 630,
        alt: "Veylora Bridge AI Autonomous Milestone Escrow",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification",
    description:
      "Lock client milestone funds in PayPal escrow and release them instantly when automated test suites verify deliverable criteria.",
    images: ["/veylora-logo.png"],
  },
};

export default function Page() {
  return <LandingView />;
}
