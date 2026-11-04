import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "Veylora Bridge AI Full-Stack Next.js Server",
    status: "active",
    tagline: "Don't just trust the promise. Verify the work.",
    runtime: "Next.js App Router (Vercel Serverless Ready)",
    paypal_mode: "sandbox",
    timestamp: new Date().toISOString(),
  });
}

