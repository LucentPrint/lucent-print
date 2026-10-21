"use client";

import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  DEEPGRAM_CURRENCY,
  DEEPGRAM_INVOICE_NUMBER,
  DEEPGRAM_PAYMENT_AMOUNT,
  type DeepgramPaymentPart,
} from "@/lib/deepgram-invoice";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const parts: DeepgramPaymentPart[] = ["deposit", "balance"];
const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: DEEPGRAM_CURRENCY,
}).format(DEEPGRAM_PAYMENT_AMOUNT / 100);

function storageKey(part: DeepgramPaymentPart) {
  return `lucent.deepgram.${DEEPGRAM_INVOICE_NUMBER}.${part}.v1`;
}

export function DeepgramPaymentButtons() {
  const [activePart, setActivePart] = useState<DeepgramPaymentPart | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const attemptsRef = useRef<Record<DeepgramPaymentPart, string>>({ deposit: "", balance: "" });
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackId = useId();

  useEffect(() => {
    const resumeAfterBackNavigation = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submittingRef.current = false;
      setActivePart(null);
      for (const part of parts) {
        try {
          const stored = window.sessionStorage.getItem(storageKey(part));
          attemptsRef.current[part] = stored && uuidPattern.test(stored) ? stored : "";
        } catch {
          // Keep the in-memory attempt if browser storage is unavailable.
        }
      }
    };
    window.addEventListener("pageshow", resumeAfterBackNavigation);
    return () => window.removeEventListener("pageshow", resumeAfterBackNavigation);
  }, []);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  function requestId(part: DeepgramPaymentPart) {
    if (attemptsRef.current[part]) return attemptsRef.current[part];
    try {
      const stored = window.sessionStorage.getItem(storageKey(part));
      if (stored && uuidPattern.test(stored)) attemptsRef.current[part] = stored;
    } catch {
      // The ref preserves retries when browser storage is unavailable.
    }
    if (!attemptsRef.current[part]) attemptsRef.current[part] = window.crypto.randomUUID();
    try {
      window.sessionStorage.setItem(storageKey(part), attemptsRef.current[part]);
    } catch {
      // Retain this attempt in memory until navigation.
    }
    return attemptsRef.current[part];
  }

  async function openCheckout(part: DeepgramPaymentPart) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setActivePart(part);
    setFeedback(null);
    let navigating = false;

    try {
      const response = await fetch("/api/pay/deepgram/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, clientRequestId: requestId(part) }),
      });
      const result: unknown = await response.json();
      const body = result && typeof result === "object" && !Array.isArray(result)
        ? result as Record<string, unknown>
        : {};

      if (response.status === 409 && body.code === "checkout_expired") {
        attemptsRef.current[part] = "";
        try { window.sessionStorage.removeItem(storageKey(part)); } catch { /* The next explicit click starts a new attempt. */ }
        setFeedback(`That checkout expired. Select Pay ${part} — ${price} again to open a fresh checkout.`);
        return;
      }

      if (response.ok && typeof body.confirmationPath === "string") {
        const confirmationUrl = new URL(body.confirmationPath, window.location.origin);
        const sessionId = confirmationUrl.searchParams.get("session_id");
        if (
          confirmationUrl.origin !== window.location.origin ||
          confirmationUrl.pathname !== "/pay/deepgram/success" ||
          confirmationUrl.hash !== "" ||
          Array.from(confirmationUrl.searchParams.keys()).length !== 1 ||
          !sessionId || !/^cs_[a-zA-Z0-9_]{10,240}$/.test(sessionId) ||
          body.confirmationPath !== `/pay/deepgram/success?session_id=${sessionId}`
        ) throw new Error("Unexpected confirmation destination.");
        navigating = true;
        window.location.assign(body.confirmationPath);
        return;
      }

      if (!response.ok || typeof body.url !== "string") {
        setFeedback(typeof body.error === "string" ? body.error : "We couldn’t open checkout. Please try again or contact Lucent Print.");
        return;
      }

      const checkoutUrl = new URL(body.url);
      if (checkoutUrl.origin !== "https://checkout.stripe.com" || checkoutUrl.username || checkoutUrl.password) {
        throw new Error("Unexpected checkout destination.");
      }
      navigating = true;
      window.location.assign(checkoutUrl.toString());
    } catch {
      navigating = false;
      setFeedback("We couldn’t open secure checkout. Please try again or contact Lucent Print.");
    } finally {
      if (!navigating) {
        submittingRef.current = false;
        setActivePart(null);
      }
    }
  }

  return (
    <div>
      {feedback && (
        <div ref={feedbackRef} id={feedbackId} role="alert" tabIndex={-1} className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100 outline-none focus:ring-2 focus:ring-amber-300/50">
          {feedback}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {parts.map((part) => (
          <div key={part} className={`rounded-2xl border p-5 sm:p-6 ${part === "deposit" ? "border-blue-400/25 bg-blue-500/[.055]" : "border-white/10 bg-white/[.025]"}`}>
            <h2 className="text-xl font-bold">{part === "deposit" ? "Deposit" : "Balance"}</h2>
            <p className="muted mt-2 text-sm">One-time payment</p>
            <div className="my-6 flex flex-wrap items-baseline gap-2">
              <p className="text-4xl font-black tracking-tight sm:text-[2.75rem]">{price}</p>
              <span className="text-xs font-medium text-zinc-400">USD</span>
            </div>
            <button
              type="button"
              onClick={() => openCheckout(part)}
              disabled={activePart !== null}
              aria-busy={activePart === part}
              aria-describedby={feedback ? feedbackId : undefined}
              className={`btn min-h-14 w-full gap-2 px-3 text-sm disabled:cursor-wait disabled:opacity-65 sm:text-base ${part === "deposit" ? "btn-primary" : "btn-secondary hover:border-blue-400/40"}`}
            >
              {activePart === part ? <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" /> : <LockKeyhole size={16} className="shrink-0" aria-hidden="true" />}
              {activePart === part ? "Opening checkout…" : `Pay ${part} — ${price}`}
              {activePart !== part && <ArrowRight size={16} className="shrink-0" aria-hidden="true" />}
            </button>
          </div>
        ))}
      </div>
      <p className="muted mt-5 text-center text-xs">Secure payment through Stripe</p>
      <noscript><p className="muted mt-4 text-sm">Enable JavaScript to open secure checkout, or contact Lucent Print for payment assistance.</p></noscript>
    </div>
  );
}
