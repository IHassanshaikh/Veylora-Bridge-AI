import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Ledger & Cryptographic Milestone Timeline",
  description:
    "Immutable chronological audit trail recording contract state transitions, PayPal transaction captures, test execution hashes, and counterparty communications.",
  keywords: [
    "Escrow Audit Ledger",
    "Cryptographic Timeline",
    "PayPal Transaction Log",
    "Tamper-Evident History",
    "Milestone Audit Trail",
    "Veylora Ledger"
  ],
  openGraph: {
    title: "Audit Ledger & Cryptographic Milestone Timeline | Veylora Bridge AI",
    description:
      "Immutable chronological audit trail recording contract transitions, PayPal captures, and test execution verification hashes.",
  },
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

