"use client";

import React, { useState, useEffect } from "react";
import { 
  Lock, RefreshCw, CheckCircle2, ChevronDown, CreditCard, 
  SlidersHorizontal, Search, ShieldCheck
} from "lucide-react";

export interface PayPalCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  itemTitle?: string;
  initialMode?: "paypal" | "card";
  initialEmail?: string;
  onApprove: (details: {
    orderId: string;
    captureId: string;
    payerEmail: string;
    paymentMethod: "paypal_wallet" | "card";
  }) => Promise<void>;
}

export function PayPalCheckoutModal({
  isOpen,
  onClose,
  amount,
  currency = "USD",
  itemTitle = "Kickoff Advance Deposit",
  initialMode = "paypal",
  initialEmail = "hassanshaikh9717@gmail.com",
  onApprove,
}: PayPalCheckoutModalProps) {
  const [viewState, setViewState] = useState<"loading" | "login" | "review" | "card" | "processing" | "success">("loading");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("+1");
  const [phoneType, setPhoneType] = useState("Mobile");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [streetAddress, setStreetAddress] = useState("2211 North First Street");
  const [aptSuite, setAptSuite] = useState("Suite 100");
  const [city, setCity] = useState("San Jose");
  const [stateCode, setStateCode] = useState("CA");
  const [cardZip, setCardZip] = useState("95131");
  const [payNowTab, setPayNowTab] = useState<"now" | "later">("now");
  const [paymentResult, setPaymentResult] = useState<any | null>(null);

  // Real-time card formatters with spacing and automatic slash
  const handleCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleCardExpChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setCardExp(`${digits.slice(0, 2)} / ${digits.slice(2)}`);
    } else {
      setCardExp(digits);
    }
  };

  const handleCardCvvChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setCardCvv(digits);
  };

  const detectedCardType = (() => {
    const clean = cardNumber.replace(/\s/g, "");
    if (/^4/.test(clean)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
    if (/^3[47]/.test(clean)) return "amex";
    if (/^6/.test(clean)) return "discover";
    return null;
  })();

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (isOpen) {
      setViewState("loading");
      const timer = setTimeout(() => {
        setViewState(initialMode === "card" ? "card" : "login");
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // After entering email on Screen 1, transition directly to the Card/Checkout screen (Image 5)
  const handleNextFromLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setViewState("loading");
    setTimeout(() => {
      setViewState("card");
    }, 450);
  };

  const handleExecutePayment = async (method: "paypal_wallet" | "card") => {
    setViewState("processing");
    try {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const generatedOrderId = `SANDBOX-ORD-${randomSuffix}`;
      const generatedCaptureId = `SANDBOX-CAP-${randomSuffix + 42}`;

      await onApprove({
        orderId: generatedOrderId,
        captureId: generatedCaptureId,
        payerEmail: email,
        paymentMethod: method,
      });

      setPaymentResult({
        orderId: generatedOrderId,
        captureId: generatedCaptureId,
        amount,
        email,
      });

      setViewState("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Payment execution error:", err);
      setViewState("review");
      alert("Payment processing encountered an error: " + (err.message || "Unknown error"));
    }
  };

  // Dynamic Chrome URL depending on viewState
  const currentUrl = 
    viewState === "card" 
      ? "sandbox.paypal.com/checkoutweb/signup?atomic-event-state=eyJkb21haW4iOiJzYW5kYm94LnBheXBhbC5jb20iLCJjaGVja291dFNlc3Npb25JZCI6IjEy..."
      : viewState === "login"
      ? "sandbox.paypal.com/pay?atomic-event-state=eyJkb21haW4iOiJzYW5kYm94LnBheXBhbC5jb20iLCJjaGVja291dFNlc3Npb25JZCI6IjEyMzg5NCJ9"
      : "sandbox.paypal.com/checkoutnow?atomic-event-state=eyJkb21haW4iOiJzYW5kYm94LnBheXBhbC5jb20iLCJjbGllbnRJZCI6IlNBTkRCT1gt..."

  const windowTitle = 
    viewState === "card" 
      ? "PayPal - Google Chrome" 
      : "Pay with PayPal - Google Chrome";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Fake Browser Window Container styled after Chrome + sandbox.paypal.com */}
      <div 
        className="w-full max-w-[430px] sm:max-w-[470px] bg-white rounded-lg shadow-2xl border border-slate-400/50 overflow-hidden flex flex-col font-sans select-none"
        style={{ maxHeight: "94vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* Chrome Window Title Bar (Exact Match to Images 3, 4, 5)   */}
        {/* ========================================================= */}
        <div className="bg-[#202124] text-slate-200 px-3 py-2 flex items-center justify-between text-xs border-b border-[#3c4043]">
          <div className="flex items-center gap-2">
            {/* PayPal Icon */}
            <img src="/P.png" alt="PayPal" className="h-3.5 w-auto object-contain" />
            <span className="font-normal text-[11px] text-[#e8eaed] truncate max-w-[280px]">
              {windowTitle}
            </span>
          </div>
          <div className="flex items-center">
            <button className="h-5 w-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#3c4043] transition-colors text-[10px]">
              —
            </button>
            <button className="h-5 w-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#3c4043] transition-colors text-[10px]">
              □
            </button>
            <button
              onClick={onClose}
              className="h-5 w-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#d93025] transition-colors text-xs"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Chrome Address Bar (Exact Match to Screenshots 3, 4, 5)   */}
        {/* ========================================================= */}
        <div className="bg-[#2b2d30] px-3 py-1.5 flex items-center gap-2 text-xs border-b border-[#3c4043]">
          <div className="flex-1 bg-[#1e1f22] border border-[#3c4043] rounded-full px-3 py-1 flex items-center gap-2 text-[11px] text-[#9aa0a6] overflow-hidden">
            <SlidersHorizontal className="h-3 w-3 text-[#8ab4f8] shrink-0" />
            <span className="truncate font-normal text-[#e8eaed]">
              {currentUrl}
            </span>
          </div>
          <button className="text-[#9aa0a6] hover:text-white p-0.5">
            <Search className="h-3 w-3" />
          </button>
          <button className="text-[#9aa0a6] hover:text-white p-0.5">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* Modal Body Container                                      */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 relative bg-white text-slate-900 select-text">
          {/* 1. Lock Loading Spinner (Exact Match to Screenshot 3) */}
          {(viewState === "loading" || viewState === "processing") && (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="relative h-24 w-24 flex items-center justify-center">
                {/* Outer circular track */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                {/* Spinning blue arc */}
                <div className="absolute inset-0 rounded-full border-4 border-[#0070ba] border-t-transparent animate-spin" />
                {/* Centered Lock icon */}
                <Lock className="h-9 w-9 text-slate-400 stroke-[1.5]" />
              </div>
              <p className="mt-7 text-xs font-semibold text-slate-700">
                {viewState === "processing" ? "Processing PayPal Authorization..." : "Connecting to PayPal Sandbox..."}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Securing connection with merchant</p>
            </div>
          )}

          {/* 2. Login View (Exact Match to Screenshot 4) */}
          {viewState === "login" && (
            <div className="space-y-6 pt-2">
              {/* PayPal Dual-P Logo */}
              <div className="flex justify-center">
                <img src="/P.png" alt="PayPal" className="h-12 w-auto object-contain" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pay with PayPal</h2>
                <p className="text-xs text-slate-600 mt-1.5">Enter your email address to get started.</p>
              </div>

              <form onSubmit={handleNextFromLogin} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email or mobile number"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mt-2 text-left">
                    <button
                      type="button"
                      onClick={() => alert("Sandbox Demo: Enter any valid email to proceed.")}
                      className="text-xs font-semibold text-[#0070ba] hover:underline"
                    >
                      Forgot email?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-sm transition-colors shadow-xs"
                >
                  Next
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewState("card")}
                className="w-full py-3 rounded-full border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-bold text-sm transition-colors"
              >
                Pay with Debit or Credit Card
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-[#0070ba] hover:underline"
                >
                  Cancel and return to Veylora Bridge AI
                </button>
              </div>

              {/* Language Selector + Footer (Exact Match to Screenshot 4) */}
              <div className="pt-6 border-t border-slate-100 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <span className="text-sm">🇺🇸</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                  <span className="mx-1 text-slate-300">|</span>
                  <span className="font-semibold text-slate-900">English</span>
                  <span className="text-slate-300">|</span>
                  <span className="hover:underline cursor-pointer">Français</span>
                  <span className="text-slate-300">|</span>
                  <span className="hover:underline cursor-pointer">Español</span>
                  <span className="text-slate-300">|</span>
                  <span className="hover:underline cursor-pointer">中文</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
                  <span className="hover:underline cursor-pointer">Contact Us</span>
                  <span className="hover:underline cursor-pointer">Privacy</span>
                  <span className="hover:underline cursor-pointer">Legal</span>
                  <span className="hover:underline cursor-pointer">Policy Updates</span>
                </div>
              </div>
            </div>
          )}

          {/* 2b. Review & Complete Screen */}
          {viewState === "review" && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="/P.png" alt="PayPal" className="h-6 w-auto object-contain" />
                  <span className="font-bold text-sm text-slate-800">PayPal Wallet</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#0070ba]">${amount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{currency}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Account:</span>
                  <span className="font-bold text-slate-900">{email}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Merchant:</span>
                  <span className="font-bold text-slate-900">Veylora Bridge Escrow</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Item:</span>
                  <span className="font-medium text-slate-700">{itemTitle}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Due Today:</span>
                  <span>${amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-[#0070ba] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Protected by PayPal Buyer Protection &amp; Proof of Work Escrow.</span>
              </div>

              <button
                type="button"
                onClick={() => handleExecutePayment("paypal_wallet")}
                className="w-full py-3 rounded-full bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-sm transition-colors shadow-md shadow-blue-600/20"
              >
                Pay Now (${amount.toFixed(2)})
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setViewState("login")}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Switch PayPal Account
                </button>
              </div>
            </div>
          )}

          {/* 3. Debit or Credit Card View (Exact Match to Screenshot 5) */}
          {viewState === "card" && (
            <div className="space-y-4 pt-1">
              {/* Header: PayPal logo left, Amount in blue right */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center">
                  <img src="/paypal.png" alt="PayPal" className="h-7 w-auto object-contain" />
                </div>
                <div className="text-lg font-black text-[#0070ba]">
                  ${amount.toFixed(2)}
                </div>
              </div>

              {/* Segmented Control Pill: Pay now / Pay Later */}
              <div className="flex p-1 rounded-full bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayNowTab("now")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    payNowTab === "now"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pay now
                </button>
                <button
                  type="button"
                  onClick={() => setPayNowTab("later")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    payNowTab === "later"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pay Later
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  Pay with debit or credit card
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We don&apos;t share your financial details with the merchant.
                </p>
              </div>

              {/* Card Form - Exact Match to Screenshot */}
              <form onSubmit={(e) => { e.preventDefault(); handleExecutePayment("card"); }} className="space-y-3 pt-1">
                {/* Country / Region */}
                <div className="rounded-md border border-slate-300 px-3.5 py-2 bg-white flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block text-[11px] text-slate-500 font-medium leading-none mb-1">Country/Region</span>
                    <span className="text-sm font-normal text-slate-900 leading-tight">United States</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                </div>

                {/* Email (Pre-filled from Screen 1) */}
                <div className="rounded-md border border-slate-300 px-3.5 py-2 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                  <label className="block text-[11px] text-slate-500 font-medium leading-none mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm text-slate-900 bg-transparent outline-none font-normal"
                    required
                  />
                </div>

                {/* Phone Type & Number (Exact Match to Screenshot) */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2 rounded-md border border-slate-300 px-3 py-2 bg-white flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="block text-[11px] text-slate-500 font-medium leading-none mb-1">Phone type</span>
                      <span className="text-sm font-normal text-slate-900 leading-tight">{phoneType}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                  </div>
                  <div className="col-span-3 rounded-md border border-slate-300 px-3.5 py-2 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                    <label className="block text-[11px] text-slate-500 font-medium leading-none mb-1">
                      Phone number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm text-slate-900 bg-transparent outline-none font-normal"
                    />
                  </div>
                </div>

                {/* Card Brand Icons Row (Exact Match to Screenshot) */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 p-1.5 rounded-md bg-[#f8f9fa] border border-slate-200/90 w-fit mb-2">
                    {/* Mastercard */}
                    <div className={`flex items-center transition-transform ${detectedCardType === "mastercard" ? "scale-125 ring-2 ring-[#eb001b] rounded-full p-0.5" : "opacity-70"}`}>
                      <div className="h-4 w-4 rounded-full bg-[#eb001b] opacity-95" />
                      <div className="h-4 w-4 rounded-full bg-[#f79e1b] opacity-95 -ml-1.5" />
                    </div>
                    {/* Maestro */}
                    <div className="flex items-center -space-x-1 opacity-60">
                      <div className="h-3.5 w-3.5 rounded-full bg-[#0061a8]" />
                      <div className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
                    </div>
                    {/* Visa */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black italic text-[#1a1f71] bg-white border border-slate-200 transition-all ${detectedCardType === "visa" ? "scale-115 ring-2 ring-[#1a1f71]" : "opacity-70"}`}>
                      VISA
                    </span>
                    {/* Amex */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold text-[#006fcf] bg-white border border-slate-200 transition-all ${detectedCardType === "amex" ? "scale-115 ring-2 ring-[#006fcf]" : "opacity-70"}`}>
                      AMEX
                    </span>
                    {/* Discover */}
                    <div className={`h-4 w-4 rounded-full border border-blue-600 flex items-center justify-center text-blue-600 text-[8px] font-bold transition-all ${detectedCardType === "discover" ? "scale-115 ring-2 ring-blue-600" : "opacity-70"}`}>
                      D
                    </div>
                  </div>

                  {/* Card Number with auto-spacing */}
                  <div className="rounded-md border border-slate-300 px-3.5 py-3 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="Card number (e.g. 4000 1234 5678 9010)"
                      maxLength={19}
                      className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal tracking-wide"
                      required
                    />
                  </div>
                </div>

                {/* Expiration date + CVV with auto-formatting */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-slate-300 px-3.5 py-3 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => handleCardExpChange(e.target.value)}
                      placeholder="MM / YY"
                      maxLength={7}
                      className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal tracking-wide"
                      required
                    />
                  </div>
                  <div className="rounded-md border border-slate-300 px-3.5 py-3 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all flex items-center justify-between">
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => handleCardCvvChange(e.target.value)}
                      placeholder="CVV"
                      maxLength={4}
                      className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal tracking-widest"
                      required
                    />
                    <div className="h-3.5 w-5 rounded-xs bg-[#0070ba] flex items-center justify-center text-white text-[7px] font-bold ml-1.5 shrink-0 shadow-2xs">
                      CVV
                    </div>
                  </div>
                </div>

                {/* Billing Address Section (From Screenshot) */}
                <div className="pt-2 space-y-2">
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Billing address</h4>
                  <div className="rounded-md border border-slate-300 px-3.5 py-2.5 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Street address"
                      className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-slate-300 px-3 py-2 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal"
                        required
                      />
                    </div>
                    <div className="rounded-md border border-slate-300 px-3 py-2 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                      <input
                        type="text"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        placeholder="State"
                        className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-normal"
                        required
                      />
                    </div>
                    <div className="rounded-md border border-slate-300 px-3 py-2 bg-white focus-within:border-[#0070ba] focus-within:ring-1 focus-within:ring-[#0070ba] transition-all">
                      <input
                        type="text"
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value)}
                        placeholder="ZIP code"
                        className="w-full text-sm text-slate-900 placeholder-slate-400 font-mono bg-transparent outline-none font-normal"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-full bg-[#0070ba] hover:bg-[#003087] text-white font-bold text-sm transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Pay Now (${amount.toFixed(2)})
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setViewState("login")}
                  className="text-xs font-semibold text-[#0070ba] hover:underline cursor-pointer"
                >
                  Pay with PayPal Wallet instead
                </button>
              </div>
            </div>
          )}

          {/* 4. Success State */}
          {viewState === "success" && (
            <div className="py-14 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">PayPal Sandbox Authorization &amp; Capture Successful</p>
              </div>

              {paymentResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-bold text-slate-800">{paymentResult.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capture ID:</span>
                    <span className="font-bold text-emerald-700">{paymentResult.captureId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-slate-800">${paymentResult.amount} USD</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400">Updating project ledger &amp; releasing funds...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// Official PayPal Payment Button (Sole Provider • Sharp Square Corners)
// -------------------------------------------------------------
interface PayPalSmartButtonsProps {
  amount: number;
  onPayWithPayPal: () => void;
  disabled?: boolean;
}

export function PayPalSmartButtons({
  amount,
  onPayWithPayPal,
  disabled = false,
}: PayPalSmartButtonsProps) {
  return (
    <div className="space-y-3 max-w-md w-full font-sans">
      {/* Primary Official Large PayPal Checkout Button */}
      <button
        type="button"
        onClick={onPayWithPayPal}
        disabled={disabled}
        className="w-full h-14 px-6 rounded-none bg-[#ffc439] hover:bg-[#f4bb38] text-slate-900 transition-all shadow-xs flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer border border-[#e5a820]"
      >
        <img src="/paypal.png" alt="PayPal" className="h-9 w-auto object-contain" />
        <span className="font-extrabold text-base text-[#003087] tracking-tight">Checkout</span>
      </button>

      {/* Powered / Protected by PayPal */}
      <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
        <span>Protected by</span>
        <img src="/paypal.png" alt="PayPal" className="h-4 w-auto object-contain inline-block" />
        <span>Buyer Protection</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Official PayPal Order Summary Card
// -------------------------------------------------------------
interface PayPalOrderSummaryCardProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  title?: string;
  onPayWithPayPal: () => void;
  disabled?: boolean;
}

export function PayPalOrderSummaryCard({
  subtotal,
  shipping = 0,
  tax = 0,
  title = "Order Summary",
  onPayWithPayPal,
  disabled = false,
}: PayPalOrderSummaryCardProps) {
  const total = subtotal + shipping + tax;

  return (
    <div className="p-6 rounded-none bg-white border border-slate-300 shadow-sm space-y-5 font-sans max-w-md w-full">
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>

      {/* Line Items */}
      <div className="space-y-3 text-xs text-slate-600 pb-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Estimated Shipping</span>
          <span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Estimated Tax</span>
          <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
        </div>
      </div>

      {/* Order Total */}
      <div className="flex justify-between items-baseline pt-1">
        <span className="text-base font-bold text-slate-900">Order Total</span>
        <span className="text-2xl font-black text-slate-900">${total.toFixed(2)}</span>
      </div>

      {/* Primary PayPal Smart Button */}
      <PayPalSmartButtons
        amount={total}
        onPayWithPayPal={onPayWithPayPal}
        disabled={disabled}
      />
    </div>
  );
}
