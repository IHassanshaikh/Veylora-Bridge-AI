import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identity Verification (KYC) — Biometric & ID Validation",
  description:
    "Complete identity verification with government ID document scanning and live portrait selfie capture to attain verified counterparty status on Veylora Bridge AI.",
  keywords: [
    "Identity Verification",
    "KYC Verification",
    "ID Card Verification",
    "Biometric Selfie Verification",
    "Counterparty Trust Tier",
    "Freelance Anti-Fraud",
    "Veylora Verification"
  ],
  alternates: {
    canonical: "/verification",
  },
  openGraph: {
    title: "Identity Verification (KYC) | Veylora Bridge AI",
    description:
      "Complete government ID and live selfie verification to unlock higher milestone limits and verified counterparty trust tier.",
    url: "/verification",
  },
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
