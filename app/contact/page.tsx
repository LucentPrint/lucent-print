"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";

const email = "lu@lucentprintlic.com";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="section">
      <div className="shell mx-auto max-w-3xl text-center">
        <p className="eyebrow">Contact Lucent Print</p>
        <h1 className="title my-6">Let&apos;s create something.</h1>
        <p className="muted mx-auto max-w-2xl text-lg">
          Questions about 3D prints, custom apparel, bulk orders, or an existing order?
          Email Lu and include as much detail as you can.
        </p>

        <div className="glass mt-10 rounded-3xl p-7 sm:p-10">
          <p className="text-sm uppercase tracking-[.18em] text-zinc-400">Email</p>
          <a className="my-4 block break-all text-2xl font-black text-pink-400 sm:text-3xl" href={`mailto:${email}?subject=Lucent%20Print%20Inquiry`}>
            {email}
          </a>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a className="btn btn-primary gap-2" href={`mailto:${email}?subject=Lucent%20Print%20Inquiry`}>
              <Mail size={18} /> Open email app
            </a>
            <a
              className="btn btn-secondary gap-2"
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=Lucent%20Print%20Inquiry`}
              target="_blank"
              rel="noreferrer"
            >
              Send with Gmail
            </a>
            <button className="btn btn-secondary gap-2" onClick={copyEmail}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Copied" : "Copy address"}
            </button>
          </div>
          <p className="muted mt-6 text-sm">We normally respond within one business day.</p>
        </div>
      </div>
    </section>
  );
}
