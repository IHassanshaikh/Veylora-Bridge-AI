import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Counterparty Invitation — Review & Accept Escrow Agreement",
  description:
    "Review agreement terms, inspect milestone deliverables and acceptance rules, and securely accept your counterparty role on Veylora Bridge AI.",
  keywords: [
    "Escrow Invitation",
    "Counterparty Onboarding",
    "Contract Acceptance",
    "Milestone Agreement Review",
    "PayPal Escrow Invitation"
  ],
  openGraph: {
    title: "Counterparty Invitation | Veylora Bridge AI",
    description:
      "Review agreement terms, inspect milestone deliverables, and accept your counterparty role in a secure PayPal-backed escrow contract.",
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
