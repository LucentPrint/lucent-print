import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import Stripe from "stripe";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireFromProject = createRequire(new URL("../package.json", import.meta.url));

// Compile the actual TypeScript source in memory. Keeping dependency overrides
// local to each load avoids a test framework, generated files, and live services.
function loadSource(entry, overrides = {}, environment = process.env) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(root, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const moduleRecord = { exports: {} };
    cache.set(absolute, moduleRecord);
    const { outputText } = ts.transpileModule(readFileSync(absolute, "utf8"), {
      fileName: absolute,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    });
    const localRequire = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (specifier.startsWith("@/")) return load(`${specifier.slice(2)}.ts`);
      if (specifier.startsWith(".")) {
        const dependency = path.resolve(path.dirname(absolute), specifier);
        return load(dependency.endsWith(".ts") ? dependency : `${dependency}.ts`);
      }
      return requireFromProject(specifier);
    };
    const compiled = new vm.Script(
      `(function(exports, require, module, __filename, __dirname, process) {\n${outputText}\n})`,
      { filename: absolute },
    ).runInThisContext();
    compiled(moduleRecord.exports, localRequire, moduleRecord, absolute, path.dirname(absolute), { env: environment });
    return moduleRecord.exports;
  }
  return load(entry);
}

const { reservationSchema, reservationAddonSchema, pacificDateTime } = loadSource("lib/reservations.ts");
const {
  buildReservationCheckout,
  buildReservationAddonCheckout,
  reservationIdempotencyKey,
  reservationAddonIdempotencyKey,
  reservationMetadata,
  reservationServiceDetails,
  isReservationSession,
  reservationPaymentState,
  validCheckoutSessionId,
  listReservationSessions,
} = loadSource("lib/reservation-checkout.ts");
const { isReservationOwner } = loadSource("lib/reservation-owner.ts");

function validInput(changes = {}) {
  return {
    clientRequestId: "1583025c-a00f-4d9e-8686-cea973fd04fb",
    fullName: "Taylor Example",
    email: "taylor@example.com",
    phone: "+1 (702) 555-0100",
    eventType: "Birthday",
    preferredDate: pacificDateTime(new Date(Date.now() + 30 * 86400000)).date,
    preferredTime: "18:30",
    guestCount: 30,
    location: "Las Vegas, Nevada",
    details: "An outdoor birthday celebration.",
    acknowledged: true,
    ...changes,
  };
}

function paidSession(changes = {}) {
  return {
    id: "cs_test_reservation1234567890",
    object: "checkout.session",
    metadata: { service: "reservation-booking", schema_version: "1" },
    mode: "payment",
    payment_status: "paid",
    currency: "usd",
    amount_total: 39000,
    status: "complete",
    ...changes,
  };
}

function addonInput(changes = {}) {
  return { clientRequestId: "1583025c-a00f-4d9e-8686-cea973fd04fb", ...changes };
}

function paidAddonSession(changes = {}) {
  return paidSession({
    id: "cs_test_reservationaddon1234567890",
    metadata: { service: "reservation-booking-addon", schema_version: "1" },
    amount_total: 6000,
    ...changes,
  });
}

test("booking details are normalized, bounded, and require date acknowledgment", () => {
  const result = reservationSchema.parse(validInput({ fullName: "  Taylor Example  ", details: "  Birthday  " }));
  assert.equal(result.fullName, "Taylor Example");
  assert.equal(result.details, "Birthday");
  for (const changes of [
    { acknowledged: false },
    { acknowledged: undefined },
    { fullName: "a".repeat(101) },
    { email: "invalid-email" },
    { phone: "call me tomorrow" },
    { location: "a".repeat(181) },
    { details: "a".repeat(451) },
    { guestCount: 0 },
    { guestCount: 1.5 },
    { guestCount: 10001 },
    { clientRequestId: "not-a-uuid" },
  ]) {
    assert.equal(reservationSchema.safeParse(validInput(changes)).success, false, JSON.stringify(changes));
  }
  const metadata = reservationMetadata(result);
  assert.equal(metadata.date_confirmation, "required");
  assert.equal(metadata.time_zone, "America/Los_Angeles");
  assert.ok(Object.values(metadata).every((value) => typeof value === "string" && value.length <= 500));
});

test("client input cannot inject price, currency, quantity, or redirect destination", () => {
  for (const changes of [
    { amount: 1 }, { price: 1 }, { currency: "eur" }, { quantity: 2 },
    { success_url: "https://example.net" }, { cancel_url: "https://example.net" },
    { promotion_code: "FREE" }, { paymentPlan: "deposit" },
  ]) {
    assert.equal(reservationSchema.safeParse(validInput(changes)).success, false, JSON.stringify(changes));
  }
});

test("dates and times use Pacific calendar boundaries and reject past or impossible requests", () => {
  assert.deepEqual(pacificDateTime(new Date("2030-01-01T07:30:00Z")), { date: "2029-12-31", time: "23:30" });
  assert.deepEqual(pacificDateTime(new Date("2030-07-01T06:30:00Z")), { date: "2030-06-30", time: "23:30" });
  const past = pacificDateTime(new Date(Date.now() - 3600000));
  for (const changes of [
    { preferredDate: "2099-02-30" },
    { preferredDate: "2099-02-29" },
    { preferredDate: "2099-13-01" },
    { preferredDate: "2099-1-01" },
    { preferredDate: past.date, preferredTime: past.time },
    { preferredTime: "24:00" },
    { preferredTime: "12:60" },
  ]) {
    assert.equal(reservationSchema.safeParse(validInput(changes)).success, false, JSON.stringify(changes));
  }
  assert.equal(reservationSchema.safeParse(validInput({ preferredDate: "2096-02-29" })).success, true);
});

test("Stripe checkout charges exactly $390 USD once, with canonical event metadata", () => {
  const input = reservationSchema.parse(validInput());
  const params = buildReservationCheckout(input, "https://lucent-print.vercel.app/a-path?ignored=true");
  assert.equal(params.mode, "payment");
  assert.deepEqual(params.payment_method_types, ["card"]);
  assert.equal(params.line_items.length, 1);
  assert.equal(params.line_items[0].quantity, 1);
  assert.equal(params.line_items[0].price_data.unit_amount, 39000);
  assert.equal(params.line_items[0].price_data.currency, "usd");
  assert.equal(params.line_items[0].price_data.product_data.name, "Reservation Booking Service");
  assert.equal(params.line_items[0].price_data.recurring, undefined);
  assert.equal(params.subscription_data, undefined);
  assert.equal(params.shipping_options, undefined);
  assert.equal(params.shipping_address_collection, undefined);
  assert.equal(params.discounts, undefined);
  assert.equal(params.allow_promotion_codes, false);
  assert.deepEqual(params.automatic_tax, { enabled: false });
  assert.deepEqual(params.payment_intent_data.metadata, params.metadata);
  assert.equal(params.payment_intent_data.statement_descriptor_suffix, "RESERVATION");
  assert.equal(params.payment_intent_data.statement_descriptor, undefined);
  assert.equal(params.metadata.preferred_date, input.preferredDate);
  assert.equal(params.metadata.event_location, input.location);
  assert.equal(params.customer_email, input.email);
  assert.equal(params.success_url, "https://lucent-print.vercel.app/party-planning/confirmation?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(params.cancel_url, "https://lucent-print.vercel.app/party-planning?checkout=cancelled#reservation");
});

test("retry keys are stable for normalized details and change for another request or event", () => {
  const input = reservationSchema.parse(validInput());
  const key = reservationIdempotencyKey(input);
  assert.equal(key, reservationIdempotencyKey(reservationSchema.parse(validInput({ fullName: " Taylor Example " }))));
  assert.notEqual(key, reservationIdempotencyKey({ ...input, guestCount: input.guestCount + 1 }));
  assert.notEqual(key, reservationIdempotencyKey({ ...input, clientRequestId: "09c75004-5db5-4eae-8630-4c2ab3082224" }));
  assert.ok(key.length <= 255);
  assert.ok(!key.includes(input.email) && !key.includes(input.fullName));
});

test("payment confirmation requires the reservation marker, version, mode, amount, currency, and paid state", () => {
  assert.equal(reservationPaymentState(paidSession()), "paid");
  for (const changes of [
    { metadata: null },
    { metadata: { service: "another-service", schema_version: "1" } },
    { metadata: { service: "reservation-booking", schema_version: "2" } },
    { mode: "subscription" }, { currency: "eur" }, { amount_total: 390 }, { amount_total: null },
  ]) {
    assert.equal(reservationPaymentState(paidSession(changes)), "invalid", JSON.stringify(changes));
  }
  assert.equal(reservationPaymentState(paidSession({ payment_status: "unpaid", status: "complete" })), "processing");
  assert.equal(reservationPaymentState(paidSession({ payment_status: "unpaid", status: "open" })), "incomplete");
  assert.equal(reservationPaymentState(paidSession({ payment_status: "no_payment_required" })), "incomplete");
  assert.equal(isReservationSession(paidSession({ amount_total: 1 })), true);
  assert.equal(isReservationSession(paidSession({ metadata: { service: "reservation-booking", schema_version: "2" } })), true);
  assert.equal(validCheckoutSessionId("cs_test_reservation1234567890"), true);
  for (const value of [null, ["cs_test_reservation1234567890"], "../private", "cs_x", "cs_test_" + "x".repeat(250)]) {
    assert.equal(validCheckoutSessionId(value), false);
  }
});

test("reservation records require an allowlisted, confirmed account email", () => {
  const owner = { email: "Owner@Example.com", email_confirmed_at: "2026-01-01T00:00:00Z" };
  assert.equal(isReservationOwner(owner, [" owner@example.com "]), true);
  for (const user of [null, {}, { ...owner, email_confirmed_at: null }, { ...owner, email: "customer@example.com" }, { email: "customer@example.com", email_confirmed_at: owner.email_confirmed_at, role: "owner" }]) {
    assert.equal(isReservationOwner(user, ["owner@example.com"]), false);
  }
  assert.equal(isReservationOwner(owner, []), false);
});

test("owner listing finds reservations after a full page of merchandise and retains older-record pagination", async () => {
  const calls = [];
  const merchandise = Array.from({ length: 100 }, (_, index) => ({ id: `cs_merchandise_${index}`, metadata: {} }));
  const reservation = paidSession();
  const stripe = { checkout: { sessions: { list: async (params) => {
    calls.push(params);
    return calls.length === 1
      ? { data: merchandise, has_more: true }
      : { data: [reservation, { id: "cs_older_merchandise", metadata: {} }], has_more: true };
  } } } };
  const result = await listReservationSessions(stripe);
  assert.deepEqual(calls, [{ limit: 100 }, { limit: 100, starting_after: "cs_merchandise_99" }]);
  assert.deepEqual(result.sessions, [reservation]);
  assert.equal(result.scanned, 102);
  assert.equal(result.hasMore, true);
  assert.equal(result.nextCursor, "cs_older_merchandise");
  const cursorCalls = [];
  await listReservationSessions({ checkout: { sessions: { list: async (params) => {
    cursorCalls.push(params);
    return { data: [], has_more: false };
  } } } }, result.nextCursor);
  assert.equal(cursorCalls[0].starting_after, result.nextCursor);
});

test("owner listing bounds merchandise scanning and provides a cursor to continue", async () => {
  let page = 0;
  const result = await listReservationSessions({ checkout: { sessions: { list: async () => {
    page += 1;
    return { data: Array.from({ length: 100 }, (_, index) => ({ id: `cs_page${page}_${index}`, metadata: {} })), has_more: true };
  } } } });
  assert.equal(page, 5);
  assert.equal(result.scanned, 500);
  assert.deepEqual(result.sessions, []);
  assert.equal(result.nextCursor, "cs_page5_99");
});

const jsonResponse = { NextResponse: { json: (body, options) => Response.json(body, options) } };

function checkoutRoute({ environment = {}, create = async () => { throw new Error("Unexpected Stripe call"); } } = {}) {
  return loadSource("app/api/reservations/checkout/route.ts", {
    "next/server": jsonResponse,
    stripe: class StripeMock { static errors = Stripe.errors; checkout = { sessions: { create } }; },
  }, environment);
}

function checkoutRequest(body, headers = {}) {
  return new Request("https://lucent-print.vercel.app/api/reservations/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://lucent-print.vercel.app", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function addonCheckoutRoute({ environment = {}, create = async () => { throw new Error("Unexpected Stripe call"); } } = {}) {
  return loadSource("app/api/reservations/add-on/checkout/route.ts", {
    "next/server": jsonResponse,
    stripe: class StripeMock { static errors = Stripe.errors; checkout = { sessions: { create } }; },
  }, environment);
}

function addonCheckoutRequest(body, headers = {}) {
  return new Request("https://lucent-print.vercel.app/api/reservations/add-on/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://lucent-print.vercel.app", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("checkout API rejects malformed, oversized, untrusted-origin, and tampered requests before Stripe", async () => {
  const { POST } = checkoutRoute({ environment: { STRIPE_API_KEY: "sk_test_unused" } });
  assert.equal((await POST(checkoutRequest("{"))).status, 400);
  assert.equal((await POST(checkoutRequest("x".repeat(8193)))).status, 413);
  assert.equal((await POST(checkoutRequest(validInput(), { origin: "https://example.net" }))).status, 403);
  assert.equal((await POST(checkoutRequest(validInput({ amount: 1 })))).status, 400);
});

test("checkout API handles missing configuration and Stripe failure without pretending payment succeeded", async () => {
  assert.equal((await checkoutRoute().POST(checkoutRequest(validInput()))).status, 503);
  assert.equal((await checkoutRoute({ environment: { NEXT_PUBLIC_SITE_URL: "invalid" } }).POST(checkoutRequest(validInput()))).status, 503);
  let attempts = 0;
  const { POST } = checkoutRoute({ environment: { STRIPE_API_KEY: "sk_test_unused" }, create: async () => { attempts += 1; throw new Error("private provider failure"); } });
  const response = await POST(checkoutRequest(validInput()));
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes("private provider failure"));
  assert.equal(attempts, 1);
});

test("checkout API passes fixed server parameters and retry key, then returns only the hosted checkout URL", async () => {
  let received;
  const { POST } = checkoutRoute({
    environment: { STRIPE_SECRET_KEY: "sk_test_unused" },
    create: async (params, options) => {
      received = { params, options };
      return { url: "https://checkout.stripe.com/c/pay/cs_test_example", status: "open" };
    },
  });
  const input = validInput();
  const response = await POST(checkoutRequest(input));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_example" });
  assert.equal(received.params.line_items[0].price_data.unit_amount, 39000);
  assert.equal(received.params.payment_intent_data.statement_descriptor_suffix, "RESERVATION");
  assert.equal(received.options.idempotencyKey, reservationIdempotencyKey(reservationSchema.parse(input)));
});

test("retries from before the statement descriptor update reuse the original Stripe attempt", async () => {
  for (const status of ["open", "complete", "expired", "provider-failure"]) {
    const input = reservationSchema.parse(validInput());
    const params = buildReservationCheckout(input, "https://lucent-print.vercel.app");
    const calls = [];
    const session = paidSession({ status, url: status === "open" ? "https://checkout.stripe.com/c/pay/cs_test_original" : null });
    const { POST } = checkoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async (received, options) => {
        calls.push({ params: received, options });
        if (calls.length === 1) throw new Stripe.errors.StripeIdempotencyError({ message: "Parameters do not match the original request." });
        if (status === "provider-failure") throw new Error("Private legacy provider failure");
        return session;
      },
    });
    const response = await POST(checkoutRequest(input));
    const body = await response.json();
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].params, params);
    assert.deepEqual(calls[1].params, { ...params, payment_intent_data: { metadata: params.metadata } });
    assert.deepEqual(calls[1].options, calls[0].options);
    assert.equal(calls[1].options.idempotencyKey, reservationIdempotencyKey(input));
    if (status === "open") {
      assert.equal(response.status, 200);
      assert.deepEqual(body, { url: session.url });
    } else if (status === "complete") {
      assert.equal(response.status, 200);
      assert.deepEqual(body, { confirmationPath: `/party-planning/confirmation?session_id=${session.id}` });
    } else if (status === "expired") {
      assert.equal(response.status, 409);
      assert.equal(body.code, "checkout_expired");
    } else {
      assert.equal(response.status, 502);
      assert.ok(!JSON.stringify(body).includes("Private legacy provider failure"));
    }
  }
});

test("checkout API distinguishes expired retries from completed attempts without leaking session details", async () => {
  for (const status of ["expired", "complete"]) {
    const session = paidSession({
      status,
      url: null,
      metadata: { full_name: "Private Customer", email: "private@example.com", event_details: "Private event details" },
    });
    const { POST } = checkoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async () => session,
    });
    const response = await POST(checkoutRequest(validInput()));
    const body = await response.json();
    if (status === "expired") {
      assert.equal(response.status, 409);
      assert.equal(body.code, "checkout_expired");
      assert.equal(typeof body.error, "string");
      assert.deepEqual(Object.keys(body).sort(), ["code", "error"]);
    } else {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(body, { confirmationPath: `/party-planning/confirmation?session_id=${encodeURIComponent(session.id)}` });
    }
    assert.equal(body.url, undefined);
    assert.ok(!JSON.stringify(body).includes("Private"));
    assert.ok(!JSON.stringify(body).includes("private@example.com"));
  }
});

async function signedWebhook(session, { eventType = "checkout.session.completed", invalidSignature = false } = {}) {
  const payload = JSON.stringify({ id: "evt_test_reservation", object: "event", type: eventType, data: { object: session } });
  const secret = "whsec_local_reservation_regression_only";
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: invalidSignature ? "whsec_wrong_signature" : secret });
  let commerceCalls = 0;
  const unexpectedCommerce = () => { commerceCalls += 1; throw new Error("Reservation reached merchandise fulfillment"); };
  const { POST } = loadSource("app/api/webhooks/stripe/route.ts", {
    "next/server": jsonResponse,
    "next/headers": { headers: async () => new Headers({ "stripe-signature": signature }) },
    "@/lib/supabase/admin": { createAdminClient: unexpectedCommerce },
    "@/lib/email": { sendEmail: unexpectedCommerce },
  }, { STRIPE_API_KEY: "sk_test_local_no_network", STRIPE_WEBHOOK_SECRET: secret });
  const response = await POST(new Request("https://lucent-print.vercel.app/api/webhooks/stripe", { method: "POST", body: payload }));
  assert.equal(commerceCalls, 0, "Reservation events must never create merchandise orders, inventory changes, or order emails");
  return response;
}

test("real Stripe signatures verify while paid and asynchronous reservation events bypass merchandise fulfillment", async () => {
  for (const eventType of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
    const response = await signedWebhook(paidSession(), { eventType });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.payment_status, "paid");
    assert.equal(body.booking_confirmed, false);
  }
  const processing = await signedWebhook(paidSession({ payment_status: "unpaid" }));
  assert.equal(processing.status, 200);
  assert.equal((await processing.json()).payment_status, "processing");
});

test("webhook rejects invalid signatures and mismatched reservation payments without fulfillment", async () => {
  assert.equal((await signedWebhook(paidSession(), { invalidSignature: true })).status, 400);
  for (const changes of [
    { amount_total: 1 }, { currency: "eur" },
    { metadata: { service: "reservation-booking", schema_version: "2" } },
  ]) {
    assert.equal((await signedWebhook(paidSession(changes))).status, 400);
  }
});

test("a signed paid merchandise checkout still reaches the existing commerce branch", async () => {
  const payload = JSON.stringify({
    id: "evt_test_merchandise",
    object: "event",
    type: "checkout.session.completed",
    data: { object: paidSession({ metadata: {} }) },
  });
  const secret = "whsec_local_merchandise_regression_only";
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  let commerceCalls = 0;
  const { POST } = loadSource("app/api/webhooks/stripe/route.ts", {
    "next/server": jsonResponse,
    "next/headers": { headers: async () => new Headers({ "stripe-signature": signature }) },
    "@/lib/supabase/admin": { createAdminClient: () => { commerceCalls += 1; return null; } },
    "@/lib/email": { sendEmail: () => { throw new Error("Unexpected order email without a database"); } },
  }, { STRIPE_API_KEY: "sk_test_local_no_network", STRIPE_WEBHOOK_SECRET: secret });
  const response = await POST(new Request("https://lucent-print.vercel.app/api/webhooks/stripe", { method: "POST", body: payload }));
  assert.equal(response.status, 200);
  assert.equal(commerceCalls, 1);
  assert.deepEqual(await response.json(), { received: true, type: "checkout.session.completed" });
});

test("add-on checkout accepts only an attempt UUID and rejects client-owned payment parameters", () => {
  assert.deepEqual(reservationAddonSchema.parse(addonInput()), addonInput());
  for (const input of [
    {}, { clientRequestId: "not-a-uuid" },
    addonInput({ amount: 1 }), addonInput({ price: 1 }), addonInput({ currency: "eur" }),
    addonInput({ quantity: 2 }), addonInput({ service: "reservation-booking" }),
    addonInput({ success_url: "https://example.net" }), addonInput({ cancel_url: "https://example.net" }),
    addonInput({ promotion_code: "FREE" }), addonInput({ paymentPlan: "deposit" }),
    addonInput({ email: "someone@example.com" }), addonInput({ metadata: { schema_version: "2" } }),
  ]) {
    assert.equal(reservationAddonSchema.safeParse(input).success, false, JSON.stringify(input));
  }
});

test("add-on checkout charges exactly $60 USD once and collects the optional booking reference in Stripe", () => {
  const input = reservationAddonSchema.parse(addonInput());
  const params = buildReservationAddonCheckout(input, "https://lucent-print.vercel.app/a-path?ignored=true");
  assert.equal(params.mode, "payment");
  assert.deepEqual(params.payment_method_types, ["card"]);
  assert.equal(params.line_items.length, 1);
  assert.equal(params.line_items[0].quantity, 1);
  assert.equal(params.line_items[0].price_data.unit_amount, 6000);
  assert.equal(params.line_items[0].price_data.currency, "usd");
  assert.equal(params.line_items[0].price_data.product_data.name, "Reservation Booking Service Add-On");
  assert.equal(params.line_items[0].price_data.product_data.metadata.service, "reservation-booking-addon");
  assert.equal(params.line_items[0].price_data.recurring, undefined);
  assert.equal(params.subscription_data, undefined);
  assert.equal(params.shipping_options, undefined);
  assert.equal(params.shipping_address_collection, undefined);
  assert.equal(params.discounts, undefined);
  assert.equal(params.allow_promotion_codes, false);
  assert.deepEqual(params.automatic_tax, { enabled: false });
  assert.equal(params.customer_email, undefined);
  assert.equal(params.client_reference_id, input.clientRequestId);
  assert.equal(params.metadata.service, "reservation-booking-addon");
  assert.equal(params.metadata.schema_version, "1");
  assert.equal(params.metadata.request_id, input.clientRequestId);
  assert.deepEqual(params.payment_intent_data.metadata, params.metadata);
  assert.equal(params.payment_intent_data.statement_descriptor_suffix, "RESERVATION");
  assert.equal(params.payment_intent_data.statement_descriptor, undefined);
  assert.equal(params.custom_fields.length, 1);
  const reference = params.custom_fields[0];
  assert.equal(reference.key, "bookingreference");
  assert.equal(reference.type, "text");
  assert.equal(reference.label.type, "custom");
  assert.equal(reference.label.custom, "Booking reference or event date");
  assert.equal(reference.optional, true);
  assert.equal(reference.text.maximum_length, 100);
  assert.equal(params.success_url, "https://lucent-print.vercel.app/party-planning/confirmation?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(params.cancel_url, "https://lucent-print.vercel.app/party-planning/add-on?checkout=cancelled");
});

test("add-on retries use stable keys distinct from full reservation payments", () => {
  const input = reservationAddonSchema.parse(addonInput());
  const key = reservationAddonIdempotencyKey(input);
  assert.equal(key, reservationAddonIdempotencyKey(reservationAddonSchema.parse(addonInput())));
  assert.notEqual(key, reservationAddonIdempotencyKey(addonInput({ clientRequestId: "09c75004-5db5-4eae-8630-4c2ab3082224" })));
  assert.notEqual(key, reservationIdempotencyKey(reservationSchema.parse(validInput())));
  assert.ok(key.length <= 255);
});

test("reservation receipts distinguish $60 add-ons from $390 bookings and reject mismatched payments", () => {
  const addon = paidAddonSession();
  assert.deepEqual(reservationServiceDetails(addon), {
    name: "Reservation Booking Service Add-On", price: 6000, service: "reservation-booking-addon", isAddon: true,
  });
  assert.deepEqual(reservationServiceDetails(paidSession()), {
    name: "Reservation Booking Service", price: 39000, service: "reservation-booking", isAddon: false,
  });
  assert.equal(reservationServiceDetails(paidSession({ metadata: null })), null);
  assert.equal(reservationPaymentState(addon), "paid");
  assert.equal(reservationPaymentState(paidAddonSession({ payment_status: "unpaid", status: "complete" })), "processing");
  assert.equal(reservationPaymentState(paidAddonSession({ payment_status: "unpaid", status: "open" })), "incomplete");
  assert.equal(reservationPaymentState(paidAddonSession({ payment_status: "no_payment_required" })), "incomplete");
  for (const changes of [
    { amount_total: 39000 }, { amount_total: 60 }, { amount_total: 0 }, { amount_total: null },
    { currency: "eur" }, { mode: "subscription" },
    { metadata: null },
    { metadata: { service: "reservation-booking-addon", schema_version: "2" } },
    { metadata: { service: "reservation-booking", schema_version: "1" } },
    { metadata: { service: "merchandise", schema_version: "1" } },
  ]) {
    assert.equal(reservationPaymentState(paidAddonSession(changes)), "invalid", JSON.stringify(changes));
  }
  assert.equal(reservationPaymentState(paidSession({ amount_total: 6000 })), "invalid");
  assert.equal(isReservationSession(paidAddonSession({ amount_total: 1 })), true);
  assert.equal(isReservationSession(paidAddonSession({ metadata: { service: "reservation-booking-addon", schema_version: "2" } })), true);
  assert.equal(isReservationSession(paidSession({ metadata: { service: "merchandise" } })), false);
});

test("owner reservation history includes add-on and full-service checkouts while excluding merchandise", async () => {
  const addon = paidAddonSession();
  const reservation = paidSession();
  const result = await listReservationSessions({ checkout: { sessions: { list: async () => ({
    data: [{ id: "cs_merchandise_1", metadata: {} }, addon, reservation], has_more: false,
  }) } } });
  assert.deepEqual(result.sessions, [addon, reservation]);
  assert.equal(result.scanned, 3);
  assert.equal(result.hasMore, false);
});

test("add-on API rejects malformed, oversized, foreign-origin, and tampered requests before contacting Stripe", async () => {
  let calls = 0;
  const { POST } = addonCheckoutRoute({
    environment: { STRIPE_API_KEY: "sk_test_unused" },
    create: async () => { calls += 1; return { url: "https://checkout.stripe.com/c/pay/cs_test_unused", status: "open" }; },
  });
  assert.equal((await POST(addonCheckoutRequest("{"))).status, 400);
  assert.equal((await POST(addonCheckoutRequest("x".repeat(2049)))).status, 413);
  assert.equal((await POST(addonCheckoutRequest(addonInput(), { "content-length": "2049" }))).status, 413);
  assert.equal((await POST(addonCheckoutRequest(addonInput(), { origin: "https://example.net" }))).status, 403);
  for (const input of [{}, addonInput({ clientRequestId: "invalid" }), addonInput({ amount: 1 }), addonInput({ service: "reservation-booking" })]) {
    assert.equal((await POST(addonCheckoutRequest(input))).status, 400);
  }
  assert.equal(calls, 0);
});

test("add-on API reports missing configuration and provider failures without legacy replay or leaking details", async () => {
  assert.equal((await addonCheckoutRoute().POST(addonCheckoutRequest(addonInput()))).status, 503);
  for (const site of ["invalid", "file:///tmp/not-a-website"]) {
    const { POST } = addonCheckoutRoute({ environment: { STRIPE_API_KEY: "sk_test_unused", NEXT_PUBLIC_SITE_URL: site } });
    assert.equal((await POST(addonCheckoutRequest(addonInput()))).status, 503);
  }
  for (const error of [
    new Error("Private provider failure"),
    new Stripe.errors.StripeIdempotencyError({ message: "Private provider failure" }),
  ]) {
    let calls = 0;
    const { POST } = addonCheckoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async () => { calls += 1; throw error; },
    });
    const response = await POST(addonCheckoutRequest(addonInput()));
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes("Private provider failure"));
    assert.equal(calls, 1);
  }
  const missingUrl = addonCheckoutRoute({ environment: { STRIPE_API_KEY: "sk_test_unused" }, create: async () => ({ status: "open", url: null }) });
  assert.equal((await missingUrl.POST(addonCheckoutRequest(addonInput()))).status, 502);
});

test("add-on API creates a fixed $60 checkout and retries the same attempt without exposing Stripe internals", async () => {
  const calls = [];
  const { POST } = addonCheckoutRoute({
    environment: { STRIPE_SECRET_KEY: "sk_test_unused", NEXT_PUBLIC_SITE_URL: "https://lucent-print.vercel.app/ignored" },
    create: async (params, options) => {
      calls.push({ params, options });
      return { id: "cs_test_private", url: "https://checkout.stripe.com/c/pay/cs_test_addon", status: "open", metadata: { private_detail: "not for response" } };
    },
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await POST(addonCheckoutRequest(addonInput()));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_addon" });
  }
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].params.line_items[0].price_data.unit_amount, 6000);
  assert.equal(calls[0].params.line_items[0].quantity, 1);
  assert.equal(calls[0].params.metadata.service, "reservation-booking-addon");
  assert.equal(calls[0].params.payment_intent_data.statement_descriptor_suffix, "RESERVATION");
  assert.equal(calls[0].options.idempotencyKey, reservationAddonIdempotencyKey(reservationAddonSchema.parse(addonInput())));
});

test("add-on API sends completed attempts to their receipt and reports expiration without creating a fresh attempt", async () => {
  for (const status of ["complete", "expired"]) {
    let calls = 0;
    const session = paidAddonSession({ status, url: null, customer_details: { email: "private@example.com" } });
    const { POST } = addonCheckoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async () => { calls += 1; return session; },
    });
    const response = await POST(addonCheckoutRequest(addonInput()));
    const body = await response.json();
    assert.equal(calls, 1);
    if (status === "complete") {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(body, { confirmationPath: `/party-planning/confirmation?session_id=${session.id}` });
    } else {
      assert.equal(response.status, 409);
      assert.equal(body.code, "checkout_expired");
      assert.deepEqual(Object.keys(body).sort(), ["code", "error"]);
    }
    assert.ok(!JSON.stringify(body).includes("private@example.com"));
  }
});

test("signed add-on webhooks validate the $60 payment and never reach merchandise fulfillment", async () => {
  for (const eventType of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
    const response = await signedWebhook(paidAddonSession(), { eventType });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.service, "reservation-booking-addon");
    assert.equal(body.payment_status, "paid");
    assert.equal(body.booking_confirmed, false);
  }
  const processing = await signedWebhook(paidAddonSession({ payment_status: "unpaid" }));
  assert.equal(processing.status, 200);
  assert.equal((await processing.json()).payment_status, "processing");
  assert.equal((await signedWebhook(paidAddonSession(), { invalidSignature: true })).status, 400);
  for (const changes of [
    { amount_total: 39000 }, { amount_total: 0 }, { currency: "eur" }, { mode: "subscription" },
    { metadata: { service: "reservation-booking-addon", schema_version: "2" } },
  ]) {
    assert.equal((await signedWebhook(paidAddonSession(changes))).status, 400, JSON.stringify(changes));
  }
});
