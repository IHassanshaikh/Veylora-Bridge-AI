import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Developer Support — Hackathon Team",
  description:
    "Get in touch with the Veylora Bridge AI development team for hackathon judge inquiries, technical support, bug reports, and integration questions.",
  keywords: [
    "Contact Veylora",
    "PayPal Hackathon Inquiries",
    "Developer Support",
    "Technical Assistance",
    "Hassan Shaikh Contact",
    "Escrow Support"
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us & Developer Support | Veylora Bridge AI",
    description:
      "Get in touch with the Veylora Bridge AI development team for hackathon judge inquiries and technical support.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
