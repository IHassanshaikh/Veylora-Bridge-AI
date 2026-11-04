import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service & Escrow Operating Agreement",
  description:
    "Review the legal terms, milestone escrow release conditions, dispute arbitration protocols, and user obligations governing Veylora Bridge AI.",
  keywords: [
    "Terms of Service",
    "Escrow Operating Agreement",
    "Arbitration Protocols",
    "Milestone Release Terms",
    "PayPal Payment Terms",
    "Freelance Legal Agreement"
  ],
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service & Escrow Operating Agreement | Veylora Bridge AI",
    description:
      "Review the legal terms, milestone escrow release rules, and dispute arbitration protocols of Veylora Bridge AI.",
    url: "/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

