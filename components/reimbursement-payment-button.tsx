"use client";

import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { REIMBURSEMENT_AMOUNT, REIMBURSEMENT_CURRENCY, REIMBURSEMENT_REFERENCE, REIMBURSEMENT_VERSION } from "@/lib/reimbursement";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const storageKey = `lucent.reimbursement.${REIMBURSEMENT_REFERENCE}.v${REIMBURSEMENT_VERSION}`;
const price = new Intl.NumberFormat("en-US", { style: "currency", currency: REIMBURSEMENT_CURRENCY }).format(REIMBURSEMENT_AMOUNT / 100);
const confirmationPath = "/pay/deepgram/reimbursement/success";

export function ReimbursementPaymentButton() {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const attemptRef = useRef("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackId = useId();

  useEffect(() => {
    const resumeAfterBackNavigation = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submittingRef.current = false;
      setPending(false);
      try {
        const stored = window.sessionStorage.getItem(storageKey);
        attemptRef.current = stored && uuidPattern.test(stored) ? stored : "";
      } catch { /* Retain the attempt in memory when browser storage is unavailable. */ }
    };
    window.addEventListener("pageshow", resumeAfterBackNavigation);
    return () => window.removeEventListener("pageshow", resumeAfterBackNavigation);
  }, []);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  function requestId() {
    if (attemptRef.current) return attemptRef.current;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored && uuidPattern.test(stored)) attemptRef.current = stored;
    } catch { /* The ref preserves retries when browser storage is unavailable. */ }
    if (!attemptRef.current) attemptRef.current = window.crypto.randomUUID();
    try { window.sessionStorage.setItem(storageKey, attemptRef.current); } catch { /* Preserve the in-memory attempt. */ }
    return attemptRef.current;
  }

  async function openCheckout() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    setFeedback(null);
    let navigating = false;

    try {
      const response = await fetch("/api/pay/deepgram/reimbursement/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientRequestId: requestId() }),
      });
      const result: unknown = await response.json();
      const body = result && typeof result === "object" && !Array.isArray(result)
        ? result as Record<string, unknown>
        : {};

      if (response.status === 409 && body.code === "checkout_expired") {
        attemptRef.current = "";
        try { window.sessionStorage.removeItem(storageKey); } catch { /* A new explicit click starts the next attempt. */ }
        setFeedback(`That checkout expired. Select Pay reimbursement — ${price} again to open a fresh checkout.`);
        return;
      }

      if (response.ok && typeof body.confirmationPath === "string") {
        const confirmationUrl = new URL(body.confirmationPath, window.location.origin);
        const sessionId = confirmationUrl.searchParams.get("session_id");
        if (
          confirmationUrl.origin !== window.location.origin ||
          confirmationUrl.pathname !== confirmationPath || confirmationUrl.hash !== "" ||
          Array.from(confirmationUrl.searchParams.keys()).length !== 1 ||
          !sessionId || !/^cs_[a-zA-Z0-9_]{10,240}$/.test(sessionId) ||
          body.confirmationPath !== `${confirmationPath}?session_id=${sessionId}`
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
        setPending(false);
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
      <button
        type="button"
        onClick={openCheckout}
        disabled={pending}
        aria-busy={pending}
        aria-describedby={feedback ? feedbackId : undefined}
        className="btn btn-primary min-h-14 w-full gap-2 px-3 text-sm disabled:cursor-wait disabled:opacity-65 sm:text-base"
      >
        {pending ? <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" /> : <LockKeyhole size={16} className="shrink-0" aria-hidden="true" />}
        {pending ? "Opening checkout…" : `Pay reimbursement — ${price}`}
        {!pending && <ArrowRight size={16} className="shrink-0" aria-hidden="true" />}
      </button>
      <p className="muted mt-4 text-center text-xs">Secure one-time payment through Stripe</p>
      <noscript><p className="muted mt-4 text-sm">Enable JavaScript to open secure checkout, or contact Lucent Print for payment assistance.</p></noscript>
    </div>
  );
}
