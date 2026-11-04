import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Freelance Escrow Protection",
  description:
    "Join Veylora Bridge AI as a client or contractor to protect your freelance deliverables with automated proof-of-work tests and PayPal milestone escrow.",
  keywords: [
    "Create Account",
    "Sign Up Escrow",
    "Freelance Payment Protection",
    "Hire Freelancers Escrow",
    "Contractor Payment Guarantee",
    "Veylora Registration"
  ],
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Create Account — Freelance Escrow Protection | Veylora Bridge AI",
    description:
      "Join Veylora Bridge AI to protect freelance deliverables with automated proof-of-work tests and PayPal milestone escrow.",
    url: "/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

