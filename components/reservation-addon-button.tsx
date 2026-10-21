"use client";

import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { RESERVATION_ADDON_PRICE, RESERVATION_CURRENCY } from "@/lib/reservations";

const REQUEST_STORAGE_KEY = "lucent.reservation.addon.request.v1";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: RESERVATION_CURRENCY,
}).format(RESERVATION_ADDON_PRICE / 100);

export function ReservationAddonButton({ className = "" }: { className?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const attemptRef = useRef("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackId = useId();

  useEffect(() => {
    const resumeAfterBackNavigation = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submittingRef.current = false;
      setSubmitting(false);
      try {
        const stored = window.sessionStorage.getItem(REQUEST_STORAGE_KEY);
        // A verified paid receipt clears the stored attempt. Respect that when
        // this page returns from the browser's back/forward cache.
        attemptRef.current = stored && uuidPattern.test(stored) ? stored : "";
      } catch {
        // Keep the in-memory attempt when browser storage is unavailable.
      }
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
      const stored = window.sessionStorage.getItem(REQUEST_STORAGE_KEY);
      if (stored && uuidPattern.test(stored)) attemptRef.current = stored;
    } catch {
      // The ref still makes retries safe when browser storage is disabled.
    }
    if (!attemptRef.current) attemptRef.current = window.crypto.randomUUID();
    try { window.sessionStorage.setItem(REQUEST_STORAGE_KEY, attemptRef.current); } catch { /* The ref retains this attempt. */ }
    return attemptRef.current;
  }

  async function openCheckout() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setFeedback(null);
    let navigating = false;

    try {
      const response = await fetch("/api/reservations/add-on/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientRequestId: requestId() }),
      });
      const result: unknown = await response.json();
      const body = result && typeof result === "object" && !Array.isArray(result) ? result as Record<string, unknown> : {};

      if (response.status === 409 && body.code === "checkout_expired") {
        attemptRef.current = "";
        try { window.sessionStorage.removeItem(REQUEST_STORAGE_KEY); } catch { /* The next click starts a new in-memory attempt. */ }
        setFeedback("That checkout expired. Select Pay $60.00 again to open a fresh checkout.");
        return;
      }

      if (response.ok && typeof body.confirmationPath === "string") {
        const confirmationUrl = new URL(body.confirmationPath, window.location.origin);
        const sessionId = confirmationUrl.searchParams.get("session_id");
        if (
          confirmationUrl.origin !== window.location.origin ||
          confirmationUrl.pathname !== "/party-planning/confirmation" ||
          confirmationUrl.hash !== "" ||
          Array.from(confirmationUrl.searchParams.keys()).length !== 1 ||
          !sessionId || !/^cs_[a-zA-Z0-9_]{10,240}$/.test(sessionId) ||
          body.confirmationPath !== `/party-planning/confirmation?session_id=${sessionId}`
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
        setSubmitting(false);
      }
    }
  }

  return (
    <div className={className}>
      {feedback && (
        <div ref={feedbackRef} id={feedbackId} role="alert" tabIndex={-1} className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100 outline-none focus:ring-2 focus:ring-amber-300/50">
          {feedback}
        </div>
      )}
      <button
        type="button"
        onClick={openCheckout}
        disabled={submitting}
        aria-busy={submitting}
        aria-describedby={feedback ? feedbackId : undefined}
        className="btn btn-primary min-h-14 w-full gap-3 text-base disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
        {submitting ? "Opening secure checkout…" : `Pay ${price}`}
        {!submitting && <ArrowRight size={19} aria-hidden="true" />}
      </button>
      <p className="muted mt-3 text-center text-xs">Secure payment through Stripe</p>
      <noscript><p className="muted mt-3 text-sm">Enable JavaScript to open secure checkout, or contact Lucent Print for help with your payment.</p></noscript>
    </div>
  );
}
