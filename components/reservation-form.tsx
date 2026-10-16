"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  EVENT_TYPES,
  RESERVATION_CURRENCY,
  RESERVATION_NAME,
  RESERVATION_PRICE,
  pacificDateTime,
  reservationSchema,
  type ReservationInput,
} from "@/lib/reservations";

const DRAFT_STORAGE_KEY = "lucent.reservation.draft.v1";
const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: RESERVATION_CURRENCY,
}).format(RESERVATION_PRICE / 100);
const inputClass = "input mt-2 min-h-12 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25 disabled:opacity-60 [color-scheme:dark]";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fieldNames = [
  "fullName", "email", "phone", "eventType", "preferredDate", "preferredTime",
  "guestCount", "location", "details", "acknowledged",
] as const;

type FieldName = (typeof fieldNames)[number];
type FieldErrors = Partial<Record<FieldName, string>>;
type FormValues = Omit<ReservationInput, "clientRequestId" | "guestCount" | "eventType" | "acknowledged"> & {
  guestCount: string;
  eventType: ReservationInput["eventType"] | "";
  acknowledged: boolean;
};
type Draft = {
  values: FormValues;
  clientRequestId: string;
  fingerprint: string;
  restored: boolean;
};

function emptyDraft(): Draft {
  return {
    values: {
      fullName: "", email: "", phone: "", eventType: "", preferredDate: "",
      preferredTime: "", guestCount: "", location: "", details: "", acknowledged: false,
    },
    clientRequestId: "",
    fingerprint: "",
    restored: false,
  };
}

function readDraft(): Draft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return emptyDraft();
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return emptyDraft();
    const record = saved as Record<string, unknown>;
    if (record.version !== 1 || !record.values || typeof record.values !== "object" || Array.isArray(record.values)) return emptyDraft();
    const values = record.values as Record<string, unknown>;
    const text = (key: string, max: number) => typeof values[key] === "string" ? values[key].slice(0, max) : "";
    const eventType = text("eventType", 40);
    return {
      values: {
        fullName: text("fullName", 100),
        email: text("email", 254),
        phone: text("phone", 32),
        eventType: (EVENT_TYPES as readonly string[]).includes(eventType) ? eventType as ReservationInput["eventType"] : "",
        preferredDate: text("preferredDate", 10),
        preferredTime: text("preferredTime", 5),
        guestCount: text("guestCount", 5),
        location: text("location", 180),
        details: text("details", 450),
        acknowledged: values.acknowledged === true,
      },
      clientRequestId: typeof record.clientRequestId === "string" && uuidPattern.test(record.clientRequestId) ? record.clientRequestId : "",
      fingerprint: typeof record.fingerprint === "string" ? record.fingerprint : "",
      restored: true,
    };
  } catch {
    return emptyDraft();
  }
}

function fieldErrorsFromResponse(value: unknown): FieldErrors {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const errors: FieldErrors = {};
  for (const field of fieldNames) {
    const error = record[field];
    if (typeof error === "string") errors[field] = error;
    else if (Array.isArray(error) && typeof error[0] === "string") errors[field] = error[0];
  }
  return errors;
}

const subscribeToHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ReservationForm({ cancelled = false }: { cancelled?: boolean }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);

  // Mount the interactive form after hydration so a tab's saved draft never
  // creates a server/client markup mismatch or a second state-reset effect.
  if (!hydrated) {
    return (
      <div className="glass rounded-3xl p-6 sm:p-8" aria-busy="true" role="status">
        <p className="text-lg font-bold">Loading your event form…</p>
        <div aria-hidden="true" className="mt-6 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-20 rounded-xl bg-white/[.04]" />)}
        </div>
        <div aria-hidden="true" className="mt-6 h-28 rounded-xl bg-white/[.04]" />
      </div>
    );
  }

  return <InteractiveReservationForm cancelled={cancelled} />;
}

function InteractiveReservationForm({ cancelled }: { cancelled: boolean }) {
  const [draft] = useState(readDraft);
  const [values, setValues] = useState<FormValues>(draft.values);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<{ message: string; focusField?: FieldName } | null>(null);
  const [earliestDate] = useState(() => pacificDateTime().date);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const attemptRef = useRef({ id: draft.clientRequestId, fingerprint: draft.fingerprint });

  useEffect(() => {
    const resumeAfterBackNavigation = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submittingRef.current = false;
      setSubmitting(false);
    };
    window.addEventListener("pageshow", resumeAfterBackNavigation);
    return () => window.removeEventListener("pageshow", resumeAfterBackNavigation);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const field = feedback.focusField ? formRef.current?.elements.namedItem(feedback.focusField) : null;
    if (field instanceof HTMLElement) field.focus();
    else feedbackRef.current?.focus();
  }, [feedback]);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedback(null);
  }

  function showError(message: string, errors: FieldErrors = {}) {
    setFieldErrors(errors);
    setFeedback({ message, focusField: fieldNames.find((field) => Boolean(errors[field])) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    let navigating = false;

    setFeedback(null);
    setFieldErrors({});

    try {
      const initialId = attemptRef.current.id || window.crypto.randomUUID();
      const parsed = reservationSchema.safeParse({
        clientRequestId: initialId,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        eventType: values.eventType,
        preferredDate: values.preferredDate,
        preferredTime: values.preferredTime,
        guestCount: values.guestCount.trim() === "" ? undefined : Number(values.guestCount),
        location: values.location.trim(),
        details: values.details.trim(),
        acknowledged: values.acknowledged,
      });

      if (!parsed.success) {
        const errors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && (fieldNames as readonly string[]).includes(field) && !errors[field as FieldName]) {
            errors[field as FieldName] = issue.message;
          }
        }
        if (!values.eventType) errors.eventType = "Choose an event type.";
        if (!values.phone.trim()) errors.phone = "Enter a phone number, including area code.";
        if (!values.preferredTime) errors.preferredTime = "Choose a preferred start time.";
        if (!values.guestCount.trim()) errors.guestCount = "Enter an estimated guest count.";
        showError("Please check the highlighted details before continuing.", errors);
        return;
      }

      const { clientRequestId: parsedId, ...details } = parsed.data;
      const fingerprint = JSON.stringify(details);
      const clientRequestId = attemptRef.current.fingerprint && attemptRef.current.fingerprint !== fingerprint
        ? window.crypto.randomUUID()
        : parsedId;
      attemptRef.current = { id: clientRequestId, fingerprint };
      const payload: ReservationInput = { clientRequestId, ...details };

      try {
        window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
          version: 1,
          values,
          clientRequestId,
          fingerprint,
        }));
      } catch {
        // Checkout remains usable when browser storage is unavailable.
      }

      submittingRef.current = true;
      setSubmitting(true);
      const response = await fetch("/api/reservations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      const body = result && typeof result === "object" ? result as Record<string, unknown> : {};

      if (response.status === 409 && body.code === "checkout_expired") {
        const freshAttemptId = window.crypto.randomUUID();
        attemptRef.current = { id: freshAttemptId, fingerprint };
        try {
          window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
            version: 1,
            values,
            clientRequestId: freshAttemptId,
            fingerprint,
          }));
        } catch {
          // The new attempt remains available in memory if storage is unavailable.
        }
        showError(typeof body.error === "string"
          ? body.error
          : "This checkout expired. Your details are still here. Select Continue to payment to start a new checkout.");
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
        ) {
          throw new Error("Unexpected confirmation destination.");
        }
        navigating = true;
        window.location.assign(body.confirmationPath);
        return;
      }

      if (!response.ok || typeof body.url !== "string") {
        showError(
          typeof body.error === "string" ? body.error : "We couldn’t open checkout. Your details are still here—please try again.",
          fieldErrorsFromResponse(body.fieldErrors),
        );
        return;
      }

      const checkoutUrl = new URL(body.url);
      if (checkoutUrl.protocol !== "https:" || !["checkout.stripe.com", "buy.stripe.com"].includes(checkoutUrl.hostname)) {
        throw new Error("Unexpected checkout destination.");
      }
      navigating = true;
      window.location.assign(checkoutUrl.href);
    } catch {
      navigating = false;
      showError("We couldn’t open checkout. Your details are still here—please try again.");
    } finally {
      if (!navigating) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }

  const id = (field: FieldName) => `${formId}-${field}`;
  const errorId = (field: FieldName) => `${id(field)}-error`;
  const describedBy = (field: FieldName, hint?: string) => [hint, fieldErrors[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined;
  const errorText = (field: FieldName) => fieldErrors[field]
    ? <p id={errorId(field)} className="mt-2 text-sm text-pink-300">{fieldErrors[field]}</p>
    : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="glass rounded-3xl p-6 sm:p-8" aria-label={RESERVATION_NAME} aria-busy={submitting}>
      {(cancelled || draft.restored) && (
        <div className="mb-7 flex gap-3 rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4 text-sm text-blue-100" role="status">
          <RotateCcw size={19} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">{cancelled ? "Ready when you are." : "Welcome back."}</p>
            <p className="mt-1 text-blue-100/80">
              {draft.restored
                ? "Your event details are restored in this tab. Review them before continuing to payment."
                : "Checkout was cancelled. Complete your event details below when you’re ready to continue."}
            </p>
          </div>
        </div>
      )}

      <div className="mb-7">
        <h3 className="text-2xl font-black">Your event, your details.</h3>
        <p className="muted mt-2 text-sm">All fields are required unless marked optional.</p>
      </div>

      {feedback && (
        <div ref={feedbackRef} role="alert" tabIndex={-1} className="mb-6 rounded-xl border border-pink-400/40 bg-pink-500/10 p-4 text-sm text-pink-100 outline-none focus:ring-2 focus:ring-pink-300">
          {feedback.message}
        </div>
      )}

      <fieldset disabled={submitting} className="min-w-0">
        <legend className="mb-5 flex items-center gap-3 text-sm font-black">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-300" aria-hidden="true">1</span>
          Contact information
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={id("fullName")} className="text-sm font-bold">Full name</label>
            <input id={id("fullName")} name="fullName" autoComplete="name" required minLength={2} maxLength={100} value={values.fullName} onChange={(event) => updateField("fullName", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={describedBy("fullName")} />
            {errorText("fullName")}
          </div>
          <div>
            <label htmlFor={id("email")} className="text-sm font-bold">Email address</label>
            <input id={id("email")} name="email" type="email" autoComplete="email" required maxLength={254} value={values.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
            {errorText("email")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={id("phone")} className="text-sm font-bold">Phone number</label>
            <input id={id("phone")} name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={32} value={values.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone")} />
            {errorText("phone")}
          </div>
        </div>
      </fieldset>

      <fieldset disabled={submitting} className="mt-8 min-w-0 border-t border-white/10 pt-7">
        <legend className="flex items-center gap-3 pr-3 text-sm font-black">
          <span className="flex size-7 items-center justify-center rounded-full bg-pink-500/15 text-pink-300" aria-hidden="true">2</span>
          The celebration
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={id("eventType")} className="text-sm font-bold">Event type</label>
            <select id={id("eventType")} name="eventType" required value={values.eventType} onChange={(event) => updateField("eventType", event.target.value as FormValues["eventType"])} className={inputClass} aria-invalid={Boolean(fieldErrors.eventType)} aria-describedby={describedBy("eventType")}>
              <option value="" disabled>Select your occasion</option>
              {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            {errorText("eventType")}
          </div>
          <div>
            <label htmlFor={id("guestCount")} className="text-sm font-bold">Estimated guests</label>
            <input id={id("guestCount")} name="guestCount" type="number" inputMode="numeric" required min={1} max={10000} step={1} value={values.guestCount} onChange={(event) => updateField("guestCount", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.guestCount)} aria-describedby={describedBy("guestCount")} />
            {errorText("guestCount")}
          </div>
          <div>
            <label htmlFor={id("preferredDate")} className="text-sm font-bold">Preferred date</label>
            <input id={id("preferredDate")} name="preferredDate" type="date" required min={earliestDate} value={values.preferredDate} onChange={(event) => updateField("preferredDate", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.preferredDate)} aria-describedby={describedBy("preferredDate")} />
            {errorText("preferredDate")}
          </div>
          <div>
            <label htmlFor={id("preferredTime")} className="text-sm font-bold">Preferred start time</label>
            <input id={id("preferredTime")} name="preferredTime" type="time" required value={values.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.preferredTime)} aria-describedby={describedBy("preferredTime", `${formId}-time-hint`)} />
            <p id={`${formId}-time-hint`} className="muted mt-2 text-xs">Las Vegas / Pacific time</p>
            {errorText("preferredTime")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={id("location")} className="text-sm font-bold">Event location or venue</label>
            <input id={id("location")} name="location" required minLength={2} maxLength={180} value={values.location} onChange={(event) => updateField("location", event.target.value)} className={inputClass} aria-invalid={Boolean(fieldErrors.location)} aria-describedby={describedBy("location", `${formId}-location-hint`)} />
            <p id={`${formId}-location-hint`} className="muted mt-2 text-xs">Still choosing a venue? Enter the city or area.</p>
            {errorText("location")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={id("details")} className="text-sm font-bold">Theme, ideas, or requests <span className="muted font-normal">(optional)</span></label>
            <textarea id={id("details")} name="details" rows={4} maxLength={450} value={values.details} onChange={(event) => updateField("details", event.target.value)} placeholder="Tell us what you have in mind for your celebration." className={`${inputClass} resize-y`} aria-invalid={Boolean(fieldErrors.details)} aria-describedby={describedBy("details", `${formId}-details-hint`)} />
            <p id={`${formId}-details-hint`} className="muted mt-2 text-right text-xs">{values.details.length} / 450 characters</p>
            {errorText("details")}
          </div>
        </div>
      </fieldset>

      <div className="mt-7 rounded-2xl border border-blue-400/20 bg-blue-500/[.07] p-4 sm:p-5">
        <label htmlFor={id("acknowledged")} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input id={id("acknowledged")} name="acknowledged" type="checkbox" required disabled={submitting} checked={values.acknowledged} onChange={(event) => updateField("acknowledged", event.target.checked)} className="mt-1 size-4 shrink-0 accent-blue-500" aria-invalid={Boolean(fieldErrors.acknowledged)} aria-describedby={describedBy("acknowledged")} />
          <span>I understand this is a <strong>one-time {price} USD payment</strong> for the {RESERVATION_NAME}, and my requested date and event details <strong>still require confirmation.</strong></span>
        </label>
        {errorText("acknowledged")}
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary mt-6 min-h-14 w-full gap-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#10131d] disabled:cursor-wait disabled:opacity-70">
        {submitting ? <><LoaderCircle size={19} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Opening secure checkout…</> : <>Continue to payment · {price}<ArrowRight size={19} aria-hidden="true" /></>}
      </button>
      <p className="muted mt-4 flex items-center justify-center gap-2 text-center text-xs">
        <LockKeyhole size={14} aria-hidden="true" /> Payment is completed securely with Stripe.
      </p>
      <p role="status" aria-live="polite" className="sr-only">{submitting ? "Opening secure Stripe checkout. Please wait." : ""}</p>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-blue-200/85"><CheckCircle2 size={14} aria-hidden="true" /> One-time service payment · USD</p>
    </form>
  );
}
