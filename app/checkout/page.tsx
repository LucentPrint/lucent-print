"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { checkoutMode, etsyUrl, money } from "@/lib/commerce";
import { isApparelProduct } from "@/lib/product-sections";
import { FAMILY_AND_FRIENDS_CODE, isBulldogsLaunchProduct, promotionalUnitPrice } from "@/lib/promotions";

export default function Checkout() {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "deposit">("full");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const apparelItems = cart.items.filter((item) => isApparelProduct(item.product));
  const pricedItems = cart.items.map((item)=>({...item,unitPrice:promotionalUnitPrice(item.product,item.selectedColor,promoCode)}));
  const discountedSubtotal = pricedItems.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0);
  const shipping = discountedSubtotal === 0 || discountedSubtotal >= 75 ? 0 : 6.95;
  const apparelSubtotal = pricedItems.filter((item)=>isApparelProduct(item.product)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const nonApparelSubtotal = discountedSubtotal - apparelSubtotal;
  const apparelDeposit = pricedItems.filter((item)=>isApparelProduct(item.product)).reduce((sum, item) => sum + Math.round(item.unitPrice * 50) / 100 * item.quantity, 0);
  const amountDueNow = paymentPlan === "deposit" ? nonApparelSubtotal + apparelDeposit + shipping : discountedSubtotal + shipping;
  const balanceDueLater = paymentPlan === "deposit" ? apparelSubtotal - apparelDeposit : 0;

  function applyPromoCode() {
    const code = promoInput.trim().toUpperCase();
    if (code !== FAMILY_AND_FRIENDS_CODE) {
      setPromoCode("");
      setMessage("That promo code is not valid.");
      return;
    }
    const qualifying = cart.items.filter((item)=>isBulldogsLaunchProduct(item.product));
    if (!qualifying.length) {
      setPromoCode("");
      setMessage("LUCENTP applies only to Bulldogs launch shirts.");
      return;
    }
    if (qualifying.some((item)=>!item.selectedColor)) {
      setPromoCode("");
      setMessage("Choose a size for each Bulldogs shirt before applying LUCENTP.");
      return;
    }
    setPromoCode(code);
    setMessage("LUCENTP applied — family-and-friends Bulldogs pricing is active.");
  }

  async function startStripeCheckout() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentPlan,
          promoCode,
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
              <div className="rounded-xl border border-white/10 p-4">
                <label className="font-black" htmlFor="promo-code">Family &amp; friends promo code</label>
                <div className="mt-2 flex gap-2"><input id="promo-code" className="input" value={promoInput} onChange={(event)=>setPromoInput(event.target.value)} placeholder="Enter promo code"/><button type="button" className="btn btn-secondary" onClick={applyPromoCode}>Apply</button></div>
                <p className="muted mt-2 text-xs">Bulldogs launch pricing with LUCENTP: infant/toddler $15, youth $20, adult S–XL $25, and 2XL+ $27.</p>
                {promoCode === FAMILY_AND_FRIENDS_CODE && <p className="mt-2 text-sm text-emerald-300">LUCENTP applied</p>}
              </div>
              {apparelItems.length > 0 && checkoutMode === "stripe" && (
                <fieldset className="grid gap-3 rounded-xl border border-white/10 p-4">
                  <legend className="px-2 font-black">Choose how to pay</legend>
                  <label className="input flex cursor-pointer items-start gap-3">
                    <input type="radio" checked={paymentPlan === "full"} onChange={()=>setPaymentPlan("full")}/>
                    <span><b>Pay the full order now</b><small className="muted block">Pay apparel, 3D products and shipping in full.</small></span>
                  </label>
                  <label className="input flex cursor-pointer items-start gap-3">
                    <input type="radio" checked={paymentPlan === "deposit"} onChange={()=>setPaymentPlan("deposit")}/>
                    <span><b>Pay the apparel deposit</b><small className="muted block">Pay 50% of apparel now, plus all 3D products and shipping.</small></span>
                  </label>
                </fieldset>
              )}
              {checkoutMode === "etsy" && (
                <a href={etsyUrl} className="btn btn-primary">Continue on Etsy</a>
              )}
              {checkoutMode === "stripe" && (
                <button
                  disabled={!cart.items.length || busy}
                  onClick={startStripeCheckout}
                  className="btn btn-primary"
                >
                  {busy ? "Opening secure checkout..." : `Pay ${money(amountDueNow)} securely with Stripe`}
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
            {pricedItems.map((item) => (
              <div key={`${item.product.id}-${item.selectedColor}`} className="flex justify-between gap-4">
                <span>{item.product.name}{item.selectedColor ? ` · ${item.selectedColor}` : ""} x {item.quantity}</span>
                <b>{money(item.unitPrice * item.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between"><span>Subtotal</span><b>{money(discountedSubtotal)}</b></div>
            {promoCode === FAMILY_AND_FRIENDS_CODE && <div className="flex justify-between text-emerald-300"><span>Family &amp; friends pricing</span><b>Applied</b></div>}
            <div className="flex justify-between"><span>Shipping</span><b>{shipping ? money(shipping) : "Free"}</b></div>
            {paymentPlan === "deposit" && apparelItems.length > 0 ? <>
              <div className="mt-3 flex justify-between"><span>Full order total</span><b>{money(discountedSubtotal + shipping)}</b></div>
              <div className="flex justify-between text-emerald-300"><span>Due now</span><b>{money(amountDueNow)}</b></div>
              <div className="flex justify-between text-amber-200"><span>Apparel balance due later</span><b>{money(balanceDueLater)}</b></div>
            </> : <div className="mt-3 flex justify-between text-xl"><b>Total</b><b>{money(discountedSubtotal + shipping)}</b></div>}
          </div>
          {!cart.items.length && <Link href="/shop" className="btn btn-primary mt-5 w-full">Shop products</Link>}
        </aside>
      </div>
    </section>
  );
}
