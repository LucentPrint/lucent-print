"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { checkoutMode, etsyUrl, money } from "@/lib/commerce";

export default function Checkout() {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function startStripeCheckout() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.product.id,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
          })),
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.error || "Checkout is unavailable.");
    } catch {
      setMessage("Checkout is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <div className="shell grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h1 className="title my-6">Complete your order.</h1>
          <div className="glass rounded-2xl p-6">
            <h2 className="text-2xl font-black">Checkout</h2>
            <div className="mt-5 grid gap-3">
              {checkoutMode === "etsy" && (
                <a href={etsyUrl} className="btn btn-primary">Continue on Etsy</a>
              )}
              {checkoutMode === "stripe" && (
                <button
                  disabled={!cart.items.length || busy}
                  onClick={startStripeCheckout}
                  className="btn btn-primary"
                >
                  {busy ? "Opening secure checkout..." : "Pay securely with Stripe"}
                </button>
              )}
            </div>
            <p className="muted mt-4 text-sm">
              Secure payment options, including eligible cards and wallets, appear in Stripe Checkout.
            </p>
            {message && <p className="mt-3 text-pink-300">{message}</p>}
          </div>
        </div>

        <aside className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-black">Order summary</h2>
          <div className="my-5 grid gap-3">
            {cart.items.map((item) => (
              <div key={`${item.product.id}-${item.selectedColor}`} className="flex justify-between gap-4">
                <span>{item.product.name} x {item.quantity}</span>
                <b>{money(item.product.price * item.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between"><span>Subtotal</span><b>{money(cart.subtotal)}</b></div>
            <div className="flex justify-between"><span>Shipping</span><b>{cart.shipping ? money(cart.shipping) : "Free"}</b></div>
            <div className="mt-3 flex justify-between text-xl"><b>Total</b><b>{money(cart.total)}</b></div>
          </div>
          {!cart.items.length && <Link href="/shop" className="btn btn-primary mt-5 w-full">Shop products</Link>}
        </aside>
      </div>
    </section>
  );
}
