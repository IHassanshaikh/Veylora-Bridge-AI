import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live QA Sandbox Storefront — Automated Test Target",
  description:
    "Interactive sample e-commerce application serving as an objective test target for Playwright contract validation and milestone verification demonstration.",
  keywords: [
    "QA Demo Store",
    "Automated Testing Target",
    "Playwright Sandbox",
    "Milestone Verification Demo",
    "PayPal Sandbox Store"
  ],
  alternates: {
    canonical: "/demo-store",
  },
  openGraph: {
    title: "Live QA Sandbox Storefront | Veylora Bridge AI",
    description:
      "Interactive sample e-commerce application serving as an objective test target for automated milestone verification.",
    url: "/demo-store",
  },
};

export default function DemoStoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

