"use client";

import { ProductImage as Image } from "@/components/product-image";
import { COMING_SOON_IMAGE } from "@/lib/product-images";
import { customShirtEstimate, SHIRT_SIZES, PRINT_PLACEMENTS, type PrintMethod } from "@/lib/custom-pricing";
import Link from "next/link";
import { SUBLIMATION_COLORS, isSublimationColor } from "@/lib/apparel-options";
import { useMemo, useRef, useState } from "react";

const sizes = SHIRT_SIZES;
const placements = PRINT_PLACEMENTS;
const shirtExamples = [
  { name: "Inspirada Bulldogs", image: "/images/our-work/inspirada-green-front.jpg", slug: "inspirada-bulldogs-custom-shirt" },
  { name: "Bulldogs Bolt", image: "/images/our-work/bulldogs-bolt-shirt.jpg", slug: "bulldogs-bolt-custom-shirt" },
  { name: "Exotica Scissors", image: "/images/our-work/exotica-scissors-shirt.jpg", slug: "exotica-scissors-custom-shirt" },
  { name: "Tiger Baby Bro", image: "/images/our-work/tiger-baby-bro-shirt.jpg", slug: "tiger-baby-bro-custom-shirt" },
] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function Page() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supply, setSupply] = useState("lucent");
  const [garment, setGarment] = useState("tshirt");
  const [printMethod, setPrintMethod] = useState("heat-transfer");
  const [shirtColor, setShirtColor] = useState("");
  const [artwork, setArtwork] = useState("ready");
  const [personalization, setPersonalization] = useState("same");
  const [neededBy, setNeededBy] = useState("");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estimate = useMemo(() => customShirtEstimate({ method: printMethod as PrintMethod, quantities, placements: selectedPlacements, supply, garment, artwork }), [printMethod, quantities, selectedPlacements, supply, garment, artwork]);

  function choosePrintMethod(method: string) {
    setPrintMethod(method);
    if (method === "sublimation" && !isSublimationColor(shirtColor)) setShirtColor("White");
  }

  function togglePlacement(value: string) {
    setSelectedPlacements((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function removeSelectedFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
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
    form.set("garment_type", garment);
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
      setSupply("lucent");
      setGarment("tshirt");
      setPrintMethod("heat-transfer");
      setShirtColor("");
      setArtwork("ready");
      setPersonalization("same");
      setNeededBy("");
      setSelectedPlacements([]);
      setQuantities({});
      setSelectedFile(null);
    }
  }

  return <>
    <section className="section border-b border-white/10">
      <div className="shell grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="eyebrow">Las Vegas · Custom apparel</p>
          <h1 className="title my-6">Your design, pressed on <span className="text-pink-500">our table.</span></h1>
          <p className="muted max-w-2xl text-lg">Heat-pressed shirts for teams, salons, family events and small businesses. Bring your own blanks or let us supply them—two shirts or two hundred, with the same care either way.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="btn btn-primary" href="#shirt-examples">See shirts we&apos;ve made</a>
            <a className="btn btn-secondary" href="#order">Start an apparel order</a>
            <Link className="btn btn-secondary" href="/pricing">View price list &amp; drinkware</Link>
          </div>
          <div className="mt-6 rounded-2xl border border-pink-400/30 bg-pink-500/10 p-5">
            <p className="font-black text-pink-200">Sublimation-printed shirts arrive September 28, 2026.</p>
            <p className="muted mt-1 text-sm">Full-color printing on white or light-colored polyester and polyester-cotton blends. Higher polyester content gives brighter results; blends create a softer, vintage look. Pricing will be confirmed after we review your shirt and artwork.</p>
          </div>
          <p className="muted mt-4 text-sm">Name, text and number personalization and your supplied artwork are included. Custom design is $15 per design; complex artwork starts at $35 by quote. Two revisions are included, then $5 each.</p>
        </div>
        <div className="glass grid gap-4 rounded-3xl p-7 sm:grid-cols-2">
          {[["Turnaround","7–10 business days"],["Minimum","No minimum"],["Deposit","50% to start"],["Proof","Approved before pressing"]].map(([label,value])=><div key={label}><p className="eyebrow">{label}</p><b>{value}</b></div>)}
        </div>
      </div>
    </section>

    <section className="section" id="black-shirts">
      <div className="shell">
        <p className="eyebrow text-pink-400">Choose your custom shirt</p>
        <h2 className="mt-3 text-4xl font-black">Your artwork. Your shirt color.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[
            { method: "heat-transfer", color: "Black", title: "Black Custom Heat-Transfer Shirt", copy: "Add your design to a black shirt using our normal heat-transfer printing. Suitable fabrics include cotton, polyester and polyester-cotton blends, using a transfer matched to the garment. Build your estimate with the existing garment, placement and artwork options.", action: "Customize a black heat-transfer shirt" },
            { method: "sublimation", color: "White", title: "Light-Color Custom Sublimation Shirt", copy: "Choose white, light gray, light blue, light pink, pale yellow, mint, light lavender or cream. Available starting September 28, 2026 on polyester or polyester-cotton blends. 100% polyester gives the brightest results; blends give a softer, vintage finish. Color availability and final price are confirmed with your quote.", action: "Customize a light-color sublimation shirt" },
          ].map((option) => <article key={option.method} className="glass overflow-hidden rounded-3xl p-7">
            <div className="relative mb-5 aspect-[3/2]"><Image src={COMING_SOON_IMAGE} alt={option.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-contain"/></div>
            <p className="eyebrow">{option.method === "sublimation" ? "Light colors · Sublimation" : "Black shirt · Heat transfer"}</p>
            <h3 className="mt-3 text-2xl font-black">{option.title}</h3>
            <p className="muted mt-3">{option.copy}</p>
            <a className="btn btn-primary mt-6" href="#order" onClick={() => { setPrintMethod(option.method); setShirtColor(option.color); setGarment("tshirt"); }}>{option.action}</a>
          </article>)}
        </div>
      </div>
    </section>

    <section className="section bg-white/[.025]" id="shirt-examples">
      <div className="shell">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-pink-400">Finished custom apparel</p>
            <h2 className="mt-2 text-4xl font-black sm:text-5xl">See shirts we&apos;ve made.</h2>
            <p className="muted mt-3 max-w-2xl">Real Lucent Print projects for teams, businesses, and families.</p>
          </div>
          <Link className="btn btn-secondary" href="/our-work">View the full gallery</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shirtExamples.map((example) => (
            <Link key={example.slug} href={`/products/${example.slug}`} className="glass group overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={example.image} alt={`${example.name} custom shirt`} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <p className="eyebrow">Custom shirt</p>
                <h3 className="mt-2 text-lg font-black">{example.name}</h3>
                <p className="mt-2 text-sm text-blue-300">View details →</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a className="btn btn-primary" href="#order">Start your custom shirt order</a>
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
                <label className="input flex items-center gap-3"><input type="radio" checked={supply === "lucent"} onChange={()=>setSupply("lucent")}/> Lucent Print supplies them (included in listed shirt prices)</label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select name="garment_type" className="input" value={garment} onChange={(event)=>setGarment(event.target.value)}><option value="tshirt">T-shirt</option><option value="hoodie">Hoodie (quoted per order)</option></select>
                <label className="grid gap-2 text-sm font-bold">Shirt color{printMethod === "sublimation" ? <select name="shirt_color" className="input" value={shirtColor} onChange={(event)=>setShirtColor(event.target.value)} required>{SUBLIMATION_COLORS.map((color)=><option key={color} value={color}>{color}</option>)}</select> : <><input name="shirt_color" className="input" placeholder="Choose or enter a color" list="shirt-colors" value={shirtColor} onChange={(event)=>setShirtColor(event.target.value)} required/><datalist id="shirt-colors"><option value="Black"/><option value="White"/><option value="Green"/><option value="Charcoal"/></datalist></>}</label>
                <input name="brand" className="input" placeholder="Brand / style (optional)"/>
              </div>
              {printMethod !== "sublimation" && <button type="button" className="btn btn-secondary justify-self-start" aria-pressed={shirtColor.toLowerCase() === "black"} onClick={() => setShirtColor("Black")}>Choose black shirt</button>}
            </fieldset>

            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">2. Size run</legend>
              <p className="muted">Enter how many you need in each size.</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {sizes.map((size)=><label className="text-sm" key={size}><span className="mb-1 block font-bold">{size}</span><input className="input w-full" min="0" step="1" name={`size_${size}`} type="number" inputMode="numeric" onChange={(event)=>setQuantities((current)=>({...current,[size]:Math.max(0,Math.floor(Number(event.target.value)||0))}))}/></label>)}
              </div>
              <p className="font-bold">Total shirts: {estimate.quantity}</p>
            </fieldset>

            <fieldset className="glass grid gap-4 rounded-3xl p-6">
              <legend className="px-2 text-xl font-black">3. Print and artwork</legend>
              <label className="grid gap-2 text-sm font-bold">Printing method<select name="print_method" className="input" value={printMethod} onChange={(event)=>choosePrintMethod(event.target.value)}><option value="heat-transfer">Normal heat transfer</option><option value="sublimation">Sublimation</option></select></label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-bold">Which shirt material can I use?</h3>
                {printMethod === "sublimation" ? <>
                  <p className="muted mt-2 text-sm">Choose white or light-colored polyester or a polyester-cotton blend. 100% polyester gives the brightest results; a blend with at least 65% polyester is recommended for a softer, vintage look. The ink bonds to the polyester fibers, so more cotton means a lighter print. Standard sublimation is not suitable for untreated 100% cotton.</p>
                  <p className="muted mt-2 text-sm">Available starting September 28, 2026. White gives the clearest colors; pastel shirt colors can affect the printed result. Choose heat transfer for black or dark shirts. We confirm the fabric blend, color availability and final price before production.</p>
                </> : <p className="muted mt-2 text-sm">Cotton, polyester and polyester-cotton blends can be used for heat transfer, including black and dark shirts. We match the transfer type and pressing settings to your fabric. If you’re supplying the shirt, include its fabric percentages in the brand/style field or notes so we can confirm compatibility.</p>}
              </div>
              <p className="muted">Choose every print location. Heat transfer: up to 8 × 10 in. per side. Sublimation: standard front up to 8.5 × 11 in.; adult large front or full back up to 13 × 15 in. Sleeves, hoodies and unlisted combinations need a quote.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {placements.map((placement)=><label className="input flex items-center gap-3" key={placement}><input type="checkbox" checked={selectedPlacements.includes(placement)} onChange={()=>togglePlacement(placement)}/>{placement}</label>)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="input" value={artwork} onChange={(event)=>setArtwork(event.target.value)}><option value="ready">I have print-ready artwork</option><option value="design">Create a custom design (+$15 per design)</option><option value="complex">Complex artwork (from $35, quoted)</option></select>
                <select className="input" value={personalization} onChange={(event)=>setPersonalization(event.target.value)}><option value="same">Same design on every shirt</option><option value="individual">Individual names / numbers (included)</option></select>
              </div>
              <textarea name="description" className="input min-h-32" placeholder="Describe the design, wording, colors and placement details" required/>
              <div className="grid gap-2 text-sm font-bold">
                <label htmlFor="artwork-file">Upload artwork or reference file</label>
                <input
                  ref={fileInputRef}
                  id="artwork-file"
                  name="file"
                  type="file"
                  className="input"
                  accept=".pdf,.svg,.png,.jpg,.jpeg,.webp,image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                {selectedFile && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 font-normal">
                    <span className="min-w-0 break-all text-sm" aria-live="polite">Selected: {selectedFile.name}</span>
                    <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={removeSelectedFile}>Remove file</button>
                  </div>
                )}
                <p className="muted text-xs font-normal">PDF, SVG, PNG, JPG or WebP · 10 MB maximum. You can remove or replace the file before sending.</p>
              </div>
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
              <div className="flex justify-between gap-4"><span>Shirt color</span><b className="break-words text-right">{shirtColor || "Choose a color"}</b></div>
              <div className="flex justify-between"><span>Printing method</span><b>{printMethod === "sublimation" ? "Sublimation" : "Heat transfer"}</b></div>
              <div className="flex justify-between"><span>Print locations</span><b>{selectedPlacements.length}</b></div>
              {estimate.lines.map(line => <div key={line.size} className="flex justify-between gap-3"><span>{line.size} × {line.count}</span><b>{line.unit == null ? "Quoted" : `${money(line.unit)} each`}</b></div>)}
              {estimate.setup > 0 && <div className="flex justify-between"><span>Custom design · one fee</span><b>{money(estimate.setup)}</b></div>}
              {artwork === "complex" && <p>Complex artwork: from $35, quoted.</p>}
              {estimate.team && <p className="text-emerald-300">12+ shirt team rates applied.</p>}
              <p className="muted">Name, text and number personalization included.</p>
            </div>
            <div className="border-t border-white/10 pt-4">{estimate.total == null ? <p className="text-xl font-black">Quote after garment &amp; artwork review</p> : <div className="flex items-end justify-between"><span>Estimated total</span><b className="text-3xl">{money(estimate.total)}</b></div>}<p className="muted mt-3 text-xs">Based on our September 2026 price list. Free local pickup; shipping is calculated when you order. Final price and availability are confirmed after review.</p></div>
            <Link className="mt-5 inline-block text-blue-300 underline" href="/pricing">View the full price list</Link>
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
        ["Rush orders","Orders needed in under seven days depend on availability; any rush cost is confirmed in your quote."],
        ["Custom means final","Made-to-order pieces cannot be returned or exchanged. Check spelling and sizes carefully on the proof."],
        ["Color and placement","Screen colors can shift slightly once pressed. Placement may vary up to 1/2 inch from shirt to shirt."],
        ["Design iterations","The first two revisions are included. Extra revisions are $5 each. One design fee covers an entire team or bulk order."],
        ["Artwork rights","You confirm that you own or have permission to use submitted artwork. Tell us if finished work must stay out of our portfolio."],
        ["Care","Wash inside out in cold water, no bleach, dry low, do not iron the design, and wait 24 hours before the first wash."],
        ["Pickup window","Completed orders are held for 30 days."],
      ].map(([title,copy])=><div className="glass rounded-2xl p-6" key={title}><h3 className="font-black uppercase tracking-wide">{title}</h3><p className="muted mt-2">{copy}</p></div>)}</div></div>
    </section>
  </>;
}
