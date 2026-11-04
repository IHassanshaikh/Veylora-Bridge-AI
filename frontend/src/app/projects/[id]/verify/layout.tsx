import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automated Proof-of-Work Verification Suite",
  description:
    "Autonomous Playwright contract verification: execute headless browser acceptance tests against staging environments to validate required UI states before escrow release.",
  keywords: [
    "Automated Verification Suite",
    "Proof of Work Testing",
    "Playwright Test Runner",
    "Acceptance Criteria Verification",
    "Deterministic Milestone Release",
    "Headless Browser Testing"
  ],
  openGraph: {
    title: "Automated Proof-of-Work Verification Suite | Veylora Bridge AI",
    description:
      "Autonomous Playwright verification: execute headless browser tests to objectively validate deliverables before PayPal escrow release.",
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

