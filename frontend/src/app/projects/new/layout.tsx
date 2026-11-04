import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Agreement — Step-by-Step Contract Wizard",
  description:
    "Draft a deterministic freelance milestone agreement with programmatic acceptance criteria, test assertions, counterparty onboarding, and PayPal escrow vaulting.",
  keywords: [
    "Create Escrow Agreement",
    "Contract Wizard",
    "Programmatic Acceptance Criteria",
    "Freelance Milestone Drafting",
    "PayPal Order Creation",
    "Veylora Contract Builder"
  ],
  alternates: {
    canonical: "/projects/new",
  },
  openGraph: {
    title: "Create New Agreement — Escrow Contract Wizard | Veylora Bridge AI",
    description:
      "Draft a deterministic freelance milestone agreement with programmatic acceptance criteria, automated tests, and PayPal escrow.",
    url: "/projects/new",
  },
};

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
