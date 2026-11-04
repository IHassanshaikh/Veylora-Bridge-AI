import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Project Workspace & Escrow Ledger",
    template: "%s | Veylora Bridge AI",
  },
  description:
    "Interactive freelance escrow workspace: fund milestones via PayPal Orders v2, submit deliverable repositories, execute automated test suites, and monitor sequential releases.",
  keywords: [
    "Project Escrow Workspace",
    "Milestone Ledger",
    "PayPal Fund Release",
    "Deliverable Submission",
    "Proof of Work Execution",
    "Counterparty Collaboration"
  ],
  openGraph: {
    title: "Project Workspace & Escrow Ledger | Veylora Bridge AI",
    description:
      "Interactive freelance escrow workspace: fund milestones via PayPal, submit deliverables, and trigger automated test verification.",
  },
};

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
