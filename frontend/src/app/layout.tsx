import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veylora-bridge-ai.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0070ba",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification for PayPal",
    template: "%s | Veylora Bridge AI",
  },
  description:
    "Autonomous freelance contract, automated proof-of-work verification, and PayPal payment protection platform. Built for the PayPal International Hackathon.",
  keywords: [
    "PayPal Escrow",
    "Milestone Escrow",
    "Freelance Payment Protection",
    "Automated Proof of Work",
    "Smart Milestone Release",
    "Playwright Contract Verification",
    "PayPal Orders v2",
    "PayPal Payouts v1",
    "AI Dispute Resolution",
    "FinTech Hackathon",
    "Veylora Bridge AI",
    "Autonomous Escrow Vault"
  ],
  authors: [{ name: "Hassan Shaikh & Veylora Team", url: siteUrl }],
  creator: "Hassan Shaikh",
  publisher: "Veylora Bridge AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification",
    description:
      "Autonomous freelance milestone escrow with automated proof-of-work verification and secure PayPal payouts.",
    url: siteUrl,
    siteName: "Veylora Bridge AI",
    images: [
      {
        url: "/veylora-logo.png",
        width: 1200,
        height: 630,
        alt: "Veylora Bridge AI Autonomous Milestone Escrow",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veylora Bridge AI — Autonomous Milestone Escrow & AI Verification",
    description:
      "Autonomous freelance milestone escrow with automated proof-of-work verification and secure PayPal payouts.",
    images: ["/veylora-logo.png"],
    creator: "@VeyloraBridgeAI",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/veylora-logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className={`min-h-screen antialiased bg-[#f8fafc] text-slate-900 ${plusJakarta.className}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
