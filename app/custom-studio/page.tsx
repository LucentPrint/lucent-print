"use client";

import { useMemo, useState } from "react";

const sizes = ["YS", "YM", "YL", "S", "M", "L", "XL", "2XL", "3XL"] as const;
const placements = ["Front — full chest", "Front — left chest", "Full back", "Sleeve"] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Page() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supply, setSupply] = useState("customer");
  const [artwork, setArtwork] = useState("ready");
  const [personalization, setPersonalization] = useState("same");
  const [neededBy, setNeededBy] = useState("");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const estimate = useMemo(() => {
    const quantity = Object.values(quantities).reduce((total, value) => total + value, 0);
    const locationCount = selectedPlacements.length;
    const printRate = locationCount === 0 ? 0 : locationCount === 1 ? 16 : 27 + Math.max(0, locationCount - 2) * 6;
    const shirtRate = supply === "lucent" ? 9 : 0;
    const personalizationRate = personalization === "individual" ? 4 : 0;
    const discount = quantity >= 50 ? 0.2 : quantity >= 24 ? 0.15 : quantity >= 12 ? 0.1 : 0;
    const lineSubtotal = quantity * (printRate + shirtRate + personalizationRate);
    const discounted = lineSubtotal * (1 - discount);
    const setup = artwork === "design" ? 25 : 0;
    const rush = neededBy && new Date(neededBy).getTime() - new Date(today).getTime() < 7 * 86400000 ? 0.25 : 0;
    const subtotal = discounted + setup;
    return { quantity, printRate, shirtRate, personalizationRate, discount, setup, rush, total: subtotal * (1 + rush) };
  }, [artwork, neededBy, personalization, quantities, selectedPlacements, supply, today]);

  function togglePlacement(value: string) {
    setSelectedPlacements((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimate.quantity) return setMessage("Add at least one shirt to the size run.");
    if (!selectedPlacements.length) return setMessage("Choose at least one print placement.");
    setSubmitting(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    form.set("shirt_supply", supply);
    form.set("artwork_status", artwork);
    form.set("personalization", personalization);
    form.set("placements", JSON.stringify(selectedPlacements));
    form.set("size_run", JSON.stringify(quantities));
    const response = await fetch("/api/custom-orders", { method: "POST", body: form });
    const data = await response.json();
    setSubmitting(false);
    setMessage(data.message ?? data.error ?? "Unable to send your order.");
    if (response.ok) {
      formElement.reset();
      setSupply("customer");
      setArtwork("ready");
      setPersonalization("same");
      setNeededBy("");
      setSelectedPlacements([]);
      setQuantities({});
    }
  }

  return <>
    <section className="section border-b border-white/10">
      <div className="shell grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="eyebrow">Las Vegas · Custom apparel</p>
          <h1 className="title my-6">Your design, pressed on <span className="text-pink-500">our table.</span></h1>
          <p className="muted max-w-2xl text-lg">Heat-pressed shirts for teams, salons, family events and small businesses. Bring your own blanks or let us supply them—two shirts or two hundred, with the same care either way.</p>
        </div>
        <div className="glass grid gap-4 rounded-3xl p-7 sm:grid-cols-2">
          {[["Turnaround","7–10 business days"],["Minimum","No minimum"],["Deposit","50% to start"],["Proof","Approved before pressing"]].map(([label,value])=><div key={label}><p className="eyebrow">{label}</p><b>{value}</b></div>)}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="shell grid gap-5 md:grid-cols-3">
        {[
          ["Heat transfer","Full-color art, photos and gradients","Printed and pressed for detailed logos and designs with several colors."],
          ["HTV vinyl","Names, numbers and bold lettering","Cut from solid vinyl for durable team names, numbers and simple graphics."],
          ["DTF","Large backs and detailed artwork","Ideal for full-back prints and continuous gradients that do not cut cleanly."],
        ].map(([type,title,copy])=><div className="glass rounded-2xl p-6" key={type}><p className="eyebrow">{type}</p><h2 className="mt-3 text-xl font-black">{title}</h2><p className="muted mt-2">{copy}</p></div>)}
      </div>
    </section>

    <section className="section bg-white/[.025]" id="order">
      <div className="shell">
        <p className="eyebrow">Custom shirt request</p>
        <h2 className="title my-6">Build your order.</h2>
        <p className="muted mb-10 max-w-3xl">Build an estimate as you go. Lucent Print will confirm the final price, artwork and production date before anything is pressed.</p>
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <form onSubmit={submit} className="grid gap-6">
            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">1. Garments</legend>
              <p className="muted">Who provides the blank shirts?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="input flex items-center gap-3"><input type="radio" checked={supply === "customer"} onChange={()=>setSupply("customer")}/> I’m supplying the shirts</label>
                <label className="input flex items-center gap-3"><input type="radio" checked={supply === "lucent"} onChange={()=>setSupply("lucent")}/> Lucent Print supplies them (+$9 each)</label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select name="garment_type" className="input"><option>T-shirt</option><option>Hoodie</option></select>
                <input name="shirt_color" className="input" placeholder="Shirt color" required/>
                <input name="brand" className="input" placeholder="Brand / style (optional)"/>
              </div>
            </fieldset>

            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">2. Size run</legend>
              <p className="muted">Enter how many you need in each size.</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {sizes.map((size)=><label className="text-sm" key={size}><span className="mb-1 block font-bold">{size}</span><input className="input w-full" min="0" name={`size_${size}`} type="number" inputMode="numeric" onChange={(event)=>setQuantities((current)=>({...current,[size]:Math.max(0,Number(event.target.value)||0)}))}/></label>)}
              </div>
              <p className="font-bold">Total shirts: {estimate.quantity}</p>
            </fieldset>

            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">3. Print and artwork</legend>
              <p className="muted">Choose every location where artwork will be pressed.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {placements.map((placement)=><label className="input flex items-center gap-3" key={placement}><input type="checkbox" checked={selectedPlacements.includes(placement)} onChange={()=>togglePlacement(placement)}/>{placement}</label>)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="input" value={artwork} onChange={(event)=>setArtwork(event.target.value)}><option value="ready">I have print-ready artwork</option><option value="design">I need the design made (+$25)</option></select>
                <select className="input" value={personalization} onChange={(event)=>setPersonalization(event.target.value)}><option value="same">Same design on every shirt</option><option value="individual">Individual names / numbers (+$4 each)</option></select>
              </div>
              <textarea name="description" className="input min-h-32" placeholder="Describe the design, wording, colors and placement details" required/>
              <label className="grid gap-2 text-sm font-bold">Upload artwork or reference file<input name="file" type="file" className="input" accept=".pdf,.svg,.png,.jpg,.jpeg,.webp,image/*"/></label>
            </fieldset>

            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">4. Your details</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="name" className="input" placeholder="Name" required/>
                <input name="organization" className="input" placeholder="Business / team (optional)"/>
                <input name="phone" type="tel" className="input" placeholder="Phone" required/>
                <input name="email" type="email" className="input" placeholder="Email" required/>
                <label className="grid gap-2 text-sm font-bold">Date needed<input name="needed_by" type="date" className="input" value={neededBy} onChange={(event)=>setNeededBy(event.target.value)} required/></label>
                <label className="grid gap-2 text-sm font-bold">Pickup or delivery<select name="fulfillment" className="input"><option>Pickup — Las Vegas</option><option>Local delivery</option><option>Ship to me</option></select></label>
              </div>
              <textarea name="notes" className="input min-h-24" placeholder="Anything else we should know?"/>
            </fieldset>

            <button disabled={submitting} className="btn btn-primary text-center">{submitting ? "Sending…" : "Send custom shirt request"}</button>
            <p className="muted" aria-live="polite">{message}</p>
          </form>

          <aside className="glass sticky top-24 rounded-3xl p-6">
            <p className="eyebrow">Work ticket</p><h3 className="mt-2 text-3xl font-black">Estimate</h3>
            <div className="my-6 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Shirts</span><b>{estimate.quantity}</b></div>
              <div className="flex justify-between"><span>Print locations</span><b>{selectedPlacements.length}</b></div>
              {estimate.quantity > 0 && estimate.printRate > 0 && <div className="flex justify-between"><span>Printing</span><b>{money(estimate.printRate)} each</b></div>}
              {estimate.shirtRate > 0 && <div className="flex justify-between"><span>Shirts supplied</span><b>+{money(estimate.shirtRate)} each</b></div>}
              {estimate.personalizationRate > 0 && <div className="flex justify-between"><span>Names / numbers</span><b>+{money(estimate.personalizationRate)} each</b></div>}
              {estimate.discount > 0 && <div className="flex justify-between text-emerald-300"><span>Volume discount</span><b>−{estimate.discount * 100}%</b></div>}
              {estimate.setup > 0 && <div className="flex justify-between"><span>Design setup</span><b>{money(estimate.setup)}</b></div>}
              {estimate.rush > 0 && <div className="flex justify-between text-amber-300"><span>Rush estimate</span><b>+25%</b></div>}
            </div>
            <div className="border-t border-white/10 pt-4"><div className="flex items-end justify-between"><span>Estimated total</span><b className="text-3xl">{money(estimate.total)}</b></div><p className="muted mt-3 text-xs">Estimate only. Final pricing is confirmed after artwork, garment and deadline review.</p></div>
            <div className="mt-7 grid gap-2 text-xs muted"><p>1 location: $16/shirt</p><p>2 locations: $27/shirt</p><p>Extra locations: +$6/shirt</p><p>12+ / 24+ / 50+: 10% / 15% / 20% off</p></div>
          </aside>
        </div>
      </div>
    </section>

    <section className="section" id="how">
      <div className="shell"><p className="eyebrow">Simple process</p><h2 className="title my-6">How it works.</h2><div className="grid gap-5 md:grid-cols-3">{[
        ["01","Send the order","We confirm sizes, placement and the final price—usually the same day."],
        ["02","Approve the proof","A 50% deposit holds your spot. Nothing is pressed until you approve the proof in writing."],
        ["03","Pressed and ready","Production is normally 7–10 business days after proof approval. The balance is due at pickup or delivery."],
      ].map(([step,title,copy])=><div className="glass rounded-2xl p-6" key={step}><p className="eyebrow">Step {step}</p><h3 className="mt-3 text-xl font-black">{title}</h3><p className="muted mt-2">{copy}</p></div>)}</div></div>
    </section>

    <section className="section bg-white/[.025]" id="terms">
      <div className="shell"><p className="eyebrow">Before you order</p><h2 className="title my-6">Clear expectations.</h2><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[
        ["Deposit","50% up front, non-refundable once materials are ordered or printing begins. Balance is due at pickup or delivery."],
        ["Your own shirts","Customer-supplied garments are pressed at your risk. Include 1–2 spares for test presses when possible."],
        ["Rush orders","Orders needed in under seven days are accepted when the schedule allows and add 25%."],
        ["Custom means final","Made-to-order pieces cannot be returned or exchanged. Check spelling and sizes carefully on the proof."],
        ["Color and placement","Screen colors can shift slightly once pressed. Placement may vary up to 1/2 inch from shirt to shirt."],
        ["Artwork rights","You confirm that you own or have permission to use submitted artwork. Tell us if finished work must stay out of our portfolio."],
        ["Care","Wash inside out in cold water, no bleach, dry low, do not iron the design, and wait 24 hours before the first wash."],
        ["Pickup window","Completed orders are held for 30 days."],
      ].map(([title,copy])=><div className="glass rounded-2xl p-6" key={title}><h3 className="font-black uppercase tracking-wide">{title}</h3><p className="muted mt-2">{copy}</p></div>)}</div></div>
    </section>
  </>;
}
