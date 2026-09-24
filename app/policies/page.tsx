import Link from "next/link";

export const metadata = {
  title: "Shipping, Refund & Store Policies",
  description: "Shipping, refund, return, cancellation, and custom-order policies for Lucent Print.",
};

const email = "lu@lucentprintlic.com";

export default function PoliciesPage() {
  return (
    <section className="section">
      <div className="shell mx-auto max-w-4xl">
        <p className="eyebrow">Lucent Print customer care</p>
        <h1 className="title my-6">Shipping, refunds & store policies</h1>
        <p className="muted max-w-3xl text-lg">
          These policies apply to purchases made directly through the Lucent Print website. If you have a question before ordering, email us at{" "}
          <a className="font-bold text-pink-300 hover:text-pink-200" href={`mailto:${email}`}>{email}</a>.
        </p>

        <nav aria-label="Policy sections" className="glass my-10 flex flex-wrap gap-3 rounded-2xl p-5">
          <a className="btn btn-secondary" href="#shipping">Shipping</a>
          <a className="btn btn-secondary" href="#refunds">Refunds & returns</a>
          <a className="btn btn-secondary" href="#custom-orders">Custom orders</a>
          <a className="btn btn-secondary" href="#contact">Contact</a>
        </nav>

        <div className="grid gap-6">
          <article id="shipping" className="glass scroll-mt-28 rounded-3xl p-7 sm:p-9">
            <p className="eyebrow">Shipping policy</p>
            <h2 className="mt-3 text-3xl font-black">Processing and delivery</h2>
            <div className="muted mt-5 grid gap-4 leading-7">
              <p>Lucent Print ships physical products within the United States. Available shipping choices and charges are shown at checkout before payment.</p>
              <p>Many of our 3D-printed products and apparel items are made to order. The estimated production or processing time is shown on the product page or confirmed with you for a custom order. Custom heat-press apparel generally requires 7–10 business days after the artwork proof is approved and the required deposit is paid.</p>
              <p>Delivery time begins after production is complete. Carrier delivery estimates are not guarantees, and delays caused by the carrier, weather, or an incorrect address are outside our control. Tracking information will be sent when available.</p>
              <p>Please review your shipping address before paying. Contact us as soon as possible if it needs to be corrected. Once an order has shipped, address changes may not be possible.</p>
              <p>Orders marked for local pickup will receive pickup instructions when ready. Please wait for the ready-for-pickup notice before arriving.</p>
            </div>
          </article>

          <article id="refunds" className="glass scroll-mt-28 rounded-3xl p-7 sm:p-9">
            <p className="eyebrow">Refund and return policy</p>
            <h2 className="mt-3 text-3xl font-black">Made carefully—and made right</h2>
            <div className="muted mt-5 grid gap-4 leading-7">
              <p>Because 3D prints and custom apparel are made to order, we do not accept returns or exchanges for change of mind, incorrect size selection, or approved customization choices.</p>
              <p>If your order arrives damaged, defective, or materially different from what you ordered, email <a className="font-bold text-pink-300 hover:text-pink-200" href={`mailto:${email}?subject=Order%20issue`}>{email}</a> within 7 days of delivery. Include your order number and clear photos of the item and packaging. We will review the issue and, when approved, offer a replacement, correction, or refund.</p>
              <p>Approved refunds are sent to the original payment method. Your bank or card provider may take additional time to post the credit.</p>
              <p>To cancel an order, contact us promptly. Orders may be canceled for a full refund only before materials have been ordered, production has started, or a custom proof has been approved. Once work has begun, deposits and completed design or production work are non-refundable.</p>
            </div>
          </article>

          <article id="custom-orders" className="glass scroll-mt-28 rounded-3xl p-7 sm:p-9">
            <p className="eyebrow">Custom heat-press apparel</p>
            <h2 className="mt-3 text-3xl font-black">Proofs, deposits, and personalization</h2>
            <div className="muted mt-5 grid gap-4 leading-7">
              <p>Lucent Print sells custom heat-press shirts and apparel through this website. A 50% deposit may be collected at checkout to begin apparel work; any remaining balance is due before pickup or shipment.</p>
              <p>Custom apparel includes up to three design iterations. Additional iterations are $5 each, per design. You will receive a proof for approval before pressing. Approval confirms the spelling, colors, placement, size, and design shown in the proof.</p>
              <p>Colors may vary slightly between screens and the finished material. Customer-supplied artwork must be owned by the customer or used with permission. We may decline artwork that we reasonably believe infringes another party&apos;s rights.</p>
              <p>Personalized and custom-made items are final sale except when damaged, defective, or materially different from the approved proof.</p>
            </div>
          </article>

          <article id="contact" className="glass scroll-mt-28 rounded-3xl p-7 sm:p-9">
            <p className="eyebrow">Contact information</p>
            <h2 className="mt-3 text-3xl font-black">Need help with an order?</h2>
            <p className="muted mt-5 leading-7">Lucent Print serves customers from Las Vegas, Nevada. Email questions about products, shipping, refunds, or an existing order to:</p>
            <a className="mt-5 block break-all text-2xl font-black text-pink-300 hover:text-pink-200" href={`mailto:${email}?subject=Lucent%20Print%20Order%20Support`}>{email}</a>
            <Link className="btn btn-primary mt-6" href="/contact">Open the contact page</Link>
          </article>
        </div>

        <p className="muted mt-8 text-sm">Last updated September 24, 2026.</p>
      </div>
    </section>
  );
}
