import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Escrow Data Protection",
  description:
    "Learn how Veylora Bridge AI protects personal information, KYC biometric verification files, and PayPal financial transaction telemetry under strict privacy standards.",
  keywords: [
    "Privacy Policy",
    "Escrow Data Protection",
    "KYC Privacy",
    "Biometric Data Security",
    "GDPR Compliance",
    "PayPal Telemetry Protection"
  ],
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy & Data Protection | Veylora Bridge AI",
    description:
      "Understand how Veylora Bridge AI protects personal data, KYC verification records, and PayPal transactions.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

