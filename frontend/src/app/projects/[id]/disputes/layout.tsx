import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Dispute Mediation & Evidence Dossier",
  description:
    "Unbiased multimodal dispute resolution: compare contract requirements, automated test logs, and deliverable source code to generate objective split or refund recommendations.",
  keywords: [
    "AI Dispute Mediation",
    "Escrow Arbitration Dossier",
    "Evidence Analysis",
    "Objective Resolution",
    "PayPal Dispute Protection",
    "Freelance Conflict Resolution"
  ],
  openGraph: {
    title: "AI Dispute Mediation & Evidence Dossier | Veylora Bridge AI",
    description:
      "Unbiased multimodal dispute resolution comparing contract specifications, test logs, and git diffs for objective resolution recommendations.",
  },
};

export default function DisputesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
