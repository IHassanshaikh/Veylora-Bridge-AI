import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & PayPal Wallet Settings",
  description:
    "Manage your personal profile, update contact information, change security password, and configure verified PayPal payout wallet credentials.",
  keywords: [
    "Account Settings",
    "PayPal Wallet Setup",
    "Payout Credentials",
    "Security Settings",
    "Profile Management",
    "Veylora Settings"
  ],
  alternates: {
    canonical: "/settings",
  },
  openGraph: {
    title: "Account & PayPal Wallet Settings | Veylora Bridge AI",
    description:
      "Configure your verified PayPal payout credentials, update account details, and manage security settings.",
    url: "/settings",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
