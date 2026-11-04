import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Milestone Workspace & Escrow Ledger",
    template: "%s | Veylora Bridge AI",
  },
  description:
    "Collaborative freelance milestone contracts secured by automated Playwright acceptance test suites and programmatic PayPal escrow deposits.",
  keywords: [
    "Milestone Workspace",
    "Escrow Contract Ledger",
    "Freelance Milestone Vault",
    "PayPal Escrow Capture",
    "Automated Acceptance Criteria"
  ],
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Milestone Workspace & Escrow Ledger | Veylora Bridge AI",
    description:
      "Collaborative freelance milestone contracts secured by automated Playwright test suites and programmatic PayPal escrow.",
    url: "/projects",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
