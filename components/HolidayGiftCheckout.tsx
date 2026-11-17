"use client";
import { useState, type FormEvent } from "react";
import { HOLIDAY_BUNDLES, HOLIDAY_DESIGNS, HOLIDAY_SIZES, holidaySchema, holidaySubtotal, type HolidayInput } from "@/lib/holiday-gifts";

export function HolidayGiftCheckout({ initialBundle, initialDesign }: { initialBundle: HolidayInput["bundle"]; initialDesign: HolidayInput["design"] }) {
  const [input, setInput] = useState<HolidayInput>({ bundle: initialBundle, design: initialDesign, quantity: 1, wording: "", colors: "", details: "", shirtSize: "", neededBy: "", fulfillment: "discuss" });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [summary, setSummary] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  function update<K extends keyof HolidayInput>(key: K, value: HolidayInput[K]) { setInput(old => ({ ...old, [key]: value, ...(key === "bundle" && value === "set" ? { shirtSize: "" } : {}) })); setSummary(""); setErrors({}); setNotice(""); }
  const fieldClass = "mt-2 w-full rounded-xl border border-white/20 bg-zinc-950 px-4 py-3 text-white";
  function error(key: string) { return errors[key]?.length ? <p id={`${key}-error`} className="mt-2 text-sm text-red-300">{errors[key]?.[0]}</p> : null; }
  async function review(event: FormEvent) {
    event.preventDefault(); setNotice(""); setSummary("");
    const parsed = holidaySchema.safeParse(input);
    if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors); return; }
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/holiday-gifts/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok || typeof data.summary !== "string") { setErrors(data.fieldErrors ?? {}); throw new Error(data.error || "Unable to review right now. Your details are still here."); }
      setSummary(data.summary);
      setNotice("Ready to review. Nothing has been sent and no payment has been taken.");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Unable to review right now. Please try again."); }
    finally { setPending(false); }
  }
  async function copySummary() {
    try { await navigator.clipboard.writeText(summary); setNotice("Copied. Paste this into a message to Lucent Print. Nothing was sent automatically."); }
    catch { setNotice("Copy was unavailable. Select and copy the order summary below."); }
  }
  return <div className="grid items-start gap-7 lg:grid-cols-[1fr_330px]">
    <form onSubmit={review} className="space-y-6 rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
      <label className="block font-semibold">Your bundle<select className={fieldClass} value={input.bundle} onChange={e => update("bundle", e.target.value as HolidayInput["bundle"])}>{Object.entries(HOLIDAY_BUNDLES).map(([key, bundle]) => <option key={key} value={key}>{bundle.label} · ${bundle.cents / 100}</option>)}</select></label>
      <label className="block font-semibold">Design direction<select className={fieldClass} value={input.design} onChange={e => update("design", e.target.value as HolidayInput["design"])}>{Object.entries(HOLIDAY_DESIGNS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block font-semibold">How many matching bundles?<input type="number" min={1} max={50} required className={fieldClass} value={Number.isNaN(input.quantity) ? "" : input.quantity} onChange={e => update("quantity", e.target.valueAsNumber)} />{error("quantity")}</label>{input.bundle !== "set" && <label className="block font-semibold">Shirt size<select required className={fieldClass} value={input.shirtSize} onChange={e => update("shirtSize", e.target.value as HolidayInput["shirtSize"])} aria-invalid={Boolean(errors.shirtSize)}><option value="">Choose a size</option>{HOLIDAY_SIZES.map(size => <option key={size}>{size}</option>)}</select>{error("shirtSize")}</label>}</div>
      <p className="text-sm text-zinc-400">Shirt printing: direct sublimation is for white or light polyester. Black or dark shirts need a different transfer method, confirmed with Lu.</p>
      <p className="text-sm text-zinc-400">Quantity uses the same design and size. For different names or sizes, describe each in the details. Availability will be confirmed.</p>
      <label className="block font-semibold">Exact name or wording <span className="font-normal text-zinc-400">(optional)</span><input className={fieldClass} maxLength={120} value={input.wording} onChange={e => update("wording", e.target.value)} placeholder="Type it exactly as you want it printed" /></label>
      <label className="block font-semibold">Colors <span className="font-normal text-zinc-400">(optional)</span><input className={fieldClass} maxLength={100} value={input.colors} onChange={e => update("colors", e.target.value)} placeholder="Your preferred colors, or leave as shown" /></label>
      <label className="block font-semibold">Tell us about your design<textarea required minLength={3} maxLength={500} rows={4} className={fieldClass} value={input.details} onChange={e => update("details", e.target.value)} placeholder="Theme, recipient, artwork, or special details" aria-invalid={Boolean(errors.details)} />{error("details")}</label>
      <p className="text-sm text-zinc-400">Have artwork? Attach it to the email after reviewing. Only share artwork you have permission to use.</p>
      <div className="grid gap-5 sm:grid-cols-2"><label className="block font-semibold">Preferred date <span className="font-normal text-zinc-400">(optional)</span><input type="date" className={fieldClass} value={input.neededBy} onChange={e => update("neededBy", e.target.value)} /></label><label className="block font-semibold">Delivery preference<select className={fieldClass} value={input.fulfillment} onChange={e => update("fulfillment", e.target.value as HolidayInput["fulfillment"])}><option value="discuss">Let’s discuss</option><option value="pickup">Ask about pickup</option><option value="shipping">Ask about shipping</option></select></label></div>
      <p className="text-sm text-zinc-400">This is a preference, not a confirmed pickup, shipping price or delivery date.</p>
      <button disabled={pending} className="btn w-full bg-amber-200 text-zinc-950 disabled:opacity-50">{pending ? "Preparing your summary…" : "Review my gift set"}</button>
      <p role="status" className="text-sm text-amber-100">{notice}</p>
    </form>
    <aside className="rounded-3xl border border-amber-200/30 bg-amber-200/5 p-6 lg:sticky lg:top-28"><p className="text-xs font-bold uppercase tracking-widest text-amber-200">Your gift at a glance</p><h2 className="mt-4 text-2xl font-bold">{HOLIDAY_BUNDLES[input.bundle].label}</h2><p className="mt-3 text-zinc-300">{HOLIDAY_BUNDLES[input.bundle].includes}</p><p className="mt-5 text-4xl font-black">${(holidaySubtotal({ ...input, quantity: Number.isFinite(input.quantity) ? Math.max(0, input.quantity) : 0 }) / 100).toFixed(2)}</p><p className="mt-2 text-sm text-zinc-400">Bundle subtotal only. Tax and delivery are confirmed separately.</p><hr className="my-5 border-white/15" /><p className="text-sm leading-relaxed text-zinc-300">Online payment for these custom bundles is not available yet. Send your reviewed request, then receive a confirmed total before paying.</p></aside>
    {summary && <section className="rounded-3xl border border-emerald-300/30 bg-emerald-300/5 p-6 lg:col-span-2" aria-label="Review your request"><h2 className="text-2xl font-bold">Your request, ready to send.</h2><pre className="my-5 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-200">{summary}</pre><div className="flex flex-wrap gap-3"><a className="btn bg-amber-200 text-zinc-950" href={`mailto:lu@lucentprintlic.com?subject=${encodeURIComponent("Holiday gift set request")}&body=${encodeURIComponent(summary)}`}>Open email with my request</a><button type="button" className="btn btn-secondary" onClick={copySummary}>Copy request</button></div><p className="mt-4 text-sm text-zinc-400">Your email app opens with these details. Add artwork if needed and press Send there. Opening email does not place an order or collect payment.</p></section>}
  </div>;
}
