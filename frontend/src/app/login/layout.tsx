import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Secure Counterparty Access",
  description:
    "Sign in to your Veylora Bridge AI account to manage milestone contracts, authorize PayPal escrow deposits, and review automated verification suites.",
  keywords: [
    "Sign In",
    "Escrow Login",
    "Secure Counterparty Access",
    "PayPal Sandbox Login",
    "Judge Instant Sign-In",
    "Freelance Payment Portal"
  ],
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Sign In — Secure Counterparty Access | Veylora Bridge AI",
    description:
      "Access your Veylora Bridge AI account to manage milestone contracts, authorize PayPal deposits, and review verification runs.",
    url: "/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

