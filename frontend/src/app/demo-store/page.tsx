"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, AlertTriangle, CheckCircle2, 
  Terminal, CreditCard, RefreshCw, Trash2
} from "lucide-react";
import { api } from "@/lib/api";

export default function DemoStorePage() {
  const [bugActive, setBugActive] = useState<boolean>(true);
  const [toggling, setToggling] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "FAILED">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const products = [
    {
      id: "prod-1",
      name: "Wireless ANC Headphones",
      price: 299.00,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      description: "Low-latency spatial audio with active noise cancellation."
    },
    {
      id: "prod-2",
      name: "Mechanical Keyboard",
      price: 185.00,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
      description: "Hot-swappable switches with gasket mount dampening."
    },
    {
      id: "prod-3",
      name: "Ultra-Wide Monitor 34\"",
      price: 649.00,
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80",
      description: "144Hz refresh rate with 99% sRGB color coverage."
    }
  ];

  useEffect(() => {
    checkBugStatus();
  }, []);

  const checkBugStatus = async () => {
    try {
      const res = await api.getDemoStoreStatus();
      setBugActive(res.checkout_bug_active);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBug = async () => {
    try {
      setToggling(true);
      const nextBugState = !bugActive;
      await api.toggleDemoStoreBug(nextBugState);
      setBugActive(nextBugState);
      setCheckoutStatus("IDLE");
      setErrorMessage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => [...prev, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStatus("PROCESSING");
    setErrorMessage(null);

    await new Promise(r => setTimeout(r, 600));

    if (bugActive) {
      setCheckoutStatus("FAILED");
      setErrorMessage(
        "Uncaught TypeError: Cannot read properties of undefined (reading 'processPayment') in checkout.js:142."
      );
    } else {
      setCheckoutStatus("SUCCESS");
      setCart([]);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 w-full">
      {/* Top Demo Control Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Interactive Target Deliverable
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">ApexStorefront</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Simulated Deliverable Webpage
          </h2>
          <p className="text-xs text-slate-500">
            This live storefront is tested by the Playwright proof-of-work runner.
          </p>
        </div>

        {/* Bug Toggle Switch */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={handleToggleBug}
            disabled={toggling}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              bugActive
                ? "bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
            }`}
          >
            {bugActive ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>Target Checkout: </span>
            <span className="underline">
              {bugActive ? "Bug Active (Will Fail)" : "Bug Fixed (Will Pass)"}
            </span>
          </button>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 flex items-center gap-1"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-600" />
            Workspace
          </Link>
        </div>
      </div>

      {/* Store Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Apex Hardware Store</h1>
          <p className="text-xs text-slate-500">High-performance gear for developers & creators</p>
        </div>

        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          data-testid="cart-button"
          className="relative px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs font-semibold shadow-2xs"
        >
          <ShoppingCart className="h-4 w-4 text-blue-600" />
          <span>Cart</span>
          <span
            data-testid="cart-count"
            className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold"
          >
            {cart.length}
          </span>
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {products.map((p) => (
          <div key={p.id} className="clean-card overflow-hidden bg-white flex flex-col justify-between">
            <div className="h-44 w-full relative overflow-hidden bg-slate-100">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{p.name}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-3">{p.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-base font-bold text-slate-900">${p.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(p)}
                  data-testid="add-to-cart"
                  className="add-to-cart px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <ShoppingCart className="h-3 w-3" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart & Checkout Slide-Over */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-4">
          <div className="clean-card max-w-sm w-full h-[85vh] p-5 bg-white shadow-xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Cart ({cart.length})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Your cart is empty.
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-slate-500">${item.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-bold text-slate-900 text-base">${cartTotal.toFixed(2)} USD</span>
                </div>

                {checkoutStatus === "FAILED" && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      Checkout Exception
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {checkoutStatus === "SUCCESS" && (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Order Confirmed!
                    </div>
                    <div className="text-[11px]">Transaction completed without exceptions.</div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkoutStatus === "PROCESSING"}
                  data-testid="submit-checkout"
                  className="checkout-btn w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {checkoutStatus === "PROCESSING" ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      Complete Checkout (${cartTotal.toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
