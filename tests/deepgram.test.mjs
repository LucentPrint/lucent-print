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

// Execute the actual source with a local mock transport. No test contacts Stripe.
function loadSource(entry, overrides = {}, environment = {}) {
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
      if (specifier === "server-only") return {};
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

const { deepgramCheckoutSchema, deepgramPaymentName } = loadSource("lib/deepgram-invoice.ts");
const {
  buildDeepgramCheckout,
  deepgramIdempotencyKey,
  isDeepgramSession,
  deepgramPaymentState,
  validDeepgramSessionId,
} = loadSource("lib/deepgram-checkout.ts");

const invoice = "LP-2026-1020";
const service = "deepgram-centerpieces";
const requestId = "1583025c-a00f-4d9e-8686-cea973fd04fb";
const jsonResponse = { NextResponse: { json: (body, options) => Response.json(body, options) } };

function checkoutInput(changes = {}) {
  return { part: "deposit", clientRequestId: requestId, ...changes };
}

function paidSession(changes = {}) {
  return {
    id: "cs_test_deepgram1234567890",
    object: "checkout.session",
    metadata: {
      service,
      schema_version: "1",
      invoice_number: invoice,
      payment_part: "deposit",
      request_id: requestId,
    },
    mode: "payment",
    payment_status: "paid",
    currency: "usd",
    amount_total: 61500,
    status: "complete",
    ...changes,
  };
}

function checkoutRoute({
  environment = {},
  create = async () => { throw new Error("Unexpected Stripe create call"); },
  retrieve = async () => { throw new Error("Unexpected Stripe retrieve call"); },
} = {}) {
  return loadSource("app/api/pay/deepgram/checkout/route.ts", {
    "next/server": jsonResponse,
    stripe: class StripeMock { static errors = Stripe.errors; checkout = { sessions: { create, retrieve } }; },
  }, environment);
}

function checkoutRequest(body, headers = {}) {
  return new Request("https://lucent-print.vercel.app/api/pay/deepgram/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://lucent-print.vercel.app", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("invoice input allows only the selected installment and a retry UUID", () => {
  for (const part of ["deposit", "balance"]) {
    assert.deepEqual(deepgramCheckoutSchema.parse(checkoutInput({ part })), checkoutInput({ part }));
  }
  for (const input of [
    {}, null, [], checkoutInput({ part: "full" }), checkoutInput({ part: "DEPOSIT" }),
    checkoutInput({ part: undefined }), checkoutInput({ clientRequestId: "not-a-uuid" }),
    checkoutInput({ amount: 1 }), checkoutInput({ unit_amount: 1 }), checkoutInput({ currency: "eur" }),
    checkoutInput({ quantity: 2 }), checkoutInput({ invoice_number: "LP-FORGED" }),
    checkoutInput({ success_url: "https://example.net" }), checkoutInput({ cancel_url: "https://example.net" }),
    checkoutInput({ receipt_email: "someone@example.com" }), checkoutInput({ company: "Other company" }),
    checkoutInput({ metadata: { service: "merchandise" } }), checkoutInput({ promotion_code: "FREE" }),
  ]) {
    assert.equal(deepgramCheckoutSchema.safeParse(input).success, false, JSON.stringify(input));
  }
});

test("deposit and balance each create one hosted $615 USD payment with the correct invoice identity", () => {
  for (const part of ["deposit", "balance"]) {
    const input = deepgramCheckoutSchema.parse(checkoutInput({ part }));
    const params = buildDeepgramCheckout(input, "https://lucent-print.vercel.app/ignored?return=untrusted");
    assert.equal(params.mode, "payment");
    assert.equal(params.ui_mode, "hosted");
    assert.deepEqual(params.payment_method_types, ["card"]);
    assert.equal(params.line_items.length, 1);
    const item = params.line_items[0];
    assert.equal(item.quantity, 1);
    assert.equal(item.adjustable_quantity, undefined);
    assert.equal(item.price_data.unit_amount, 61500);
    assert.equal(item.price_data.currency, "usd");
    assert.equal(item.price_data.product_data.name, `Deepgram centerpieces — ${part}`);
    assert.equal(deepgramPaymentName(part), item.price_data.product_data.name);
    assert.equal(item.price_data.recurring, undefined);
    assert.equal(params.subscription_data, undefined);
    assert.equal(params.shipping_options, undefined);
    assert.equal(params.shipping_address_collection, undefined);
    assert.equal(params.discounts, undefined);
    assert.equal(params.allow_promotion_codes, false);
    assert.deepEqual(params.automatic_tax, { enabled: false });
    assert.equal(params.metadata.service, service);
    assert.equal(params.metadata.schema_version, "1");
    assert.equal(params.metadata.invoice_number, invoice);
    assert.equal(params.metadata.payment_part, part);
    assert.equal(params.metadata.request_id, requestId);
    assert.deepEqual(params.payment_intent_data.metadata, params.metadata);
    assert.equal(params.success_url, "https://lucent-print.vercel.app/pay/deepgram/success?session_id={CHECKOUT_SESSION_ID}");
    assert.equal(params.cancel_url, "https://lucent-print.vercel.app/pay/deepgram");
  }
});

test("hosted checkout asks for the payer email and requires a business name", () => {
  const params = buildDeepgramCheckout(checkoutInput(), "https://lucent-print.vercel.app");
  assert.equal(params.customer_email, undefined, "The payer enters the AP email directly into Stripe");
  assert.equal(params.customer, undefined, "An unrelated customer's details must not be prefilled");
  assert.equal(params.customer_creation, "always");
  assert.deepEqual(params.name_collection.business, { enabled: true, optional: false });
  assert.match(params.custom_text.submit.message, /accounts payable/i);
});

test("deposit and balance retry independently without changing their server-owned parameters", () => {
  const deposit = checkoutInput();
  const balance = checkoutInput({ part: "balance" });
  const depositKey = deepgramIdempotencyKey(deposit);
  assert.equal(depositKey, deepgramIdempotencyKey(deepgramCheckoutSchema.parse(checkoutInput())));
  assert.notEqual(depositKey, deepgramIdempotencyKey(balance));
  assert.notEqual(depositKey, deepgramIdempotencyKey(checkoutInput({ clientRequestId: "09c75004-5db5-4eae-8630-4c2ab3082224" })));
  assert.ok(depositKey.length <= 255);
});

test("a successful receipt requires the exact invoice, installment, amount, currency, mode, and completed paid session", () => {
  for (const part of ["deposit", "balance"]) {
    assert.equal(deepgramPaymentState(paidSession({ metadata: { ...paidSession().metadata, payment_part: part } })), "paid");
  }
  for (const changes of [
    { amount_total: 615 }, { amount_total: 123000 }, { amount_total: 0 }, { amount_total: null },
    { currency: "eur" }, { mode: "subscription" }, { metadata: null },
    { metadata: { ...paidSession().metadata, service: "reservation-booking" } },
    { metadata: { ...paidSession().metadata, schema_version: "2" } },
    { metadata: { ...paidSession().metadata, invoice_number: "LP-OTHER" } },
    { metadata: { ...paidSession().metadata, payment_part: "full" } },
    { metadata: { service } },
  ]) {
    assert.equal(deepgramPaymentState(paidSession(changes)), "invalid", JSON.stringify(changes));
  }
  assert.equal(deepgramPaymentState(paidSession({ payment_status: "unpaid", status: "complete" })), "processing");
  assert.equal(deepgramPaymentState(paidSession({ payment_status: "unpaid", status: "open" })), "incomplete");
  for (const changes of [{ payment_status: "no_payment_required" }, { status: "open" }, { status: "expired" }]) {
    assert.notEqual(deepgramPaymentState(paidSession(changes)), "paid", JSON.stringify(changes));
  }
});

test("invoice identification prevents malformed invoice events from falling through to merchandise fulfillment", () => {
  assert.equal(isDeepgramSession(paidSession()), true);
  assert.equal(isDeepgramSession(paidSession({ amount_total: 1 })), true);
  assert.equal(isDeepgramSession(paidSession({ metadata: { service, schema_version: "2" } })), true);
  assert.equal(isDeepgramSession(paidSession({ metadata: { service, invoice_number: "LP-OTHER" } })), true);
  assert.equal(isDeepgramSession(paidSession({ metadata: { invoice_number: invoice } })), true);
  assert.equal(isDeepgramSession(paidSession({ metadata: { service: "reservation-booking" } })), false);
  assert.equal(isDeepgramSession(paidSession({ metadata: null })), false);
});

test("success links accept bounded Stripe session identifiers rather than paths or arbitrary query values", () => {
  assert.equal(validDeepgramSessionId("cs_test_deepgram1234567890"), true);
  assert.equal(validDeepgramSessionId("cs_live_deepgram1234567890"), true);
  for (const value of [undefined, null, [], ["cs_test_deepgram1234567890"], "../private", "cs_x", "cs_test_" + "x".repeat(250), "cs_test_example&paid=true"]) {
    assert.equal(validDeepgramSessionId(value), false, JSON.stringify(value));
  }
});

test("checkout rejects malformed, oversized, foreign-origin, and price-tampering requests before Stripe", async () => {
  let calls = 0;
  const unexpected = async () => { calls += 1; throw new Error("Invalid request reached Stripe"); };
  const { POST } = checkoutRoute({ environment: { STRIPE_API_KEY: "sk_test_unused" }, create: unexpected, retrieve: unexpected });
  assert.equal((await POST(checkoutRequest("{"))).status, 400);
  assert.equal((await POST(checkoutRequest("x".repeat(2049)))).status, 413);
  assert.equal((await POST(checkoutRequest(JSON.stringify({ padding: "é".repeat(1100) })))).status, 413, "The body limit counts UTF-8 bytes");
  assert.equal((await POST(checkoutRequest(checkoutInput(), { "content-length": "2049" }))).status, 413);
  assert.equal((await POST(checkoutRequest(checkoutInput(), { origin: "https://example.net" }))).status, 403);
  for (const input of [{}, checkoutInput({ part: "full" }), checkoutInput({ amount: 1 }), checkoutInput({ currency: "eur" }), checkoutInput({ success_url: "https://example.net" })]) {
    assert.equal((await POST(checkoutRequest(input))).status, 400);
  }
  assert.equal(calls, 0);
});

test("checkout fails safely when the canonical site or server Stripe credential is missing", async () => {
  assert.equal((await checkoutRoute().POST(checkoutRequest(checkoutInput()))).status, 503);
  for (const site of ["invalid", "file:///tmp/not-a-website"]) {
    const { POST } = checkoutRoute({ environment: { STRIPE_SECRET_KEY: "sk_test_unused", NEXT_PUBLIC_SITE_URL: site } });
    assert.equal((await POST(checkoutRequest(checkoutInput()))).status, 503);
  }
});

test("both installment APIs use fixed pricing and retrieve current session state across identical retries", async () => {
  for (const part of ["deposit", "balance"]) {
    const calls = [];
    const retrievals = [];
    const cached = { id: `cs_test_deepgram_${part}1234567890`, status: "open", url: "https://checkout.stripe.com/c/pay/cs_test_cached" };
    const currentUrl = `https://checkout.stripe.com/c/pay/cs_test_current_${part}`;
    const { POST } = checkoutRoute({
      environment: { STRIPE_SECRET_KEY: "sk_test_unused", NEXT_PUBLIC_SITE_URL: "https://lucent-print.vercel.app/ignored" },
      create: async (params, options) => { calls.push({ params, options }); return cached; },
      retrieve: async (id) => { retrievals.push(id); return { ...cached, url: currentUrl, customer_details: { email: "private@example.com" } }; },
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await POST(checkoutRequest(checkoutInput({ part })));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { url: currentUrl });
    }
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], calls[1]);
    assert.deepEqual(retrievals, [cached.id, cached.id]);
    assert.equal(calls[0].params.line_items[0].price_data.unit_amount, 61500);
    assert.equal(calls[0].params.line_items[0].quantity, 1);
    assert.equal(calls[0].params.metadata.payment_part, part);
    assert.equal(calls[0].params.metadata.invoice_number, invoice);
    assert.equal(calls[0].options.idempotencyKey, deepgramIdempotencyKey(checkoutInput({ part })));
  }
});

test("expired and completed retries use retrieved status instead of the cached open creation response", async () => {
  for (const status of ["expired", "complete"]) {
    const current = paidSession({ status, url: null, customer_details: { email: "private@example.com" } });
    const retrievals = [];
    const { POST } = checkoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async () => ({ ...current, status: "open", payment_status: "unpaid", url: "https://checkout.stripe.com/c/pay/cs_test_cached" }),
      retrieve: async (id) => { retrievals.push(id); return current; },
    });
    const response = await POST(checkoutRequest(checkoutInput()));
    const body = await response.json();
    assert.deepEqual(retrievals, [current.id]);
    if (status === "complete") {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(body, { confirmationPath: `/pay/deepgram/success?session_id=${current.id}` });
    } else {
      assert.equal(response.status, 409);
      assert.equal(body.code, "checkout_expired");
      assert.deepEqual(Object.keys(body).sort(), ["code", "error"]);
    }
    assert.ok(!JSON.stringify(body).includes("private@example.com"));
  }
});

test("provider failures expose a controlled error and never return a cached checkout after retrieval fails", async () => {
  for (const failure of ["create", "retrieve", "missing-url"]) {
    const cached = { id: "cs_test_deepgram1234567890", status: "open", url: "https://checkout.stripe.com/c/pay/cs_test_cached" };
    const calls = [];
    const { POST } = checkoutRoute({
      environment: { STRIPE_API_KEY: "sk_test_unused" },
      create: async () => {
        calls.push("create");
        if (failure === "create") throw new Error("Private provider failure: sk_test_do_not_leak");
        return cached;
      },
      retrieve: async (id) => {
        calls.push("retrieve");
        assert.equal(id, cached.id);
        if (failure === "retrieve") throw new Error("Private provider failure: sk_test_do_not_leak");
        return { ...cached, url: null };
      },
    });
    const response = await POST(checkoutRequest(checkoutInput()));
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.deepEqual(Object.keys(body), ["error"]);
    assert.ok(!JSON.stringify(body).includes("Private provider failure"));
    assert.ok(!JSON.stringify(body).includes("sk_test_do_not_leak"));
    assert.deepEqual(calls, failure === "create" ? ["create"] : ["create", "retrieve"]);
  }
});

async function signedWebhook(session, { eventType = "checkout.session.completed", invalidSignature = false } = {}) {
  const payload = JSON.stringify({ id: "evt_test_deepgram", object: "event", type: eventType, data: { object: session } });
  const secret = "whsec_local_deepgram_regression_only";
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: invalidSignature ? "whsec_wrong_signature" : secret });
  let commerceCalls = 0;
  const unexpectedCommerce = () => { commerceCalls += 1; throw new Error("Invoice reached merchandise fulfillment"); };
  const { POST } = loadSource("app/api/webhooks/stripe/route.ts", {
    "next/server": jsonResponse,
    "next/headers": { headers: async () => new Headers({ "stripe-signature": signature }) },
    stripe: class StripeMock { webhooks = Stripe.webhooks; },
    "@/lib/supabase/admin": { createAdminClient: unexpectedCommerce },
    "@/lib/email": { sendEmail: unexpectedCommerce },
  }, { STRIPE_API_KEY: "sk_test_local_no_network", STRIPE_WEBHOOK_SECRET: secret });
  const response = await POST(new Request("https://lucent-print.vercel.app/api/webhooks/stripe", { method: "POST", body: payload }));
  assert.equal(commerceCalls, 0, "Invoice events must not create store orders, change inventory, or send merchandise emails");
  return response;
}

test("signed deposit and balance webhooks validate payment without merchandise fulfillment", async () => {
  for (const part of ["deposit", "balance"]) {
    const session = paidSession({ metadata: { ...paidSession().metadata, payment_part: part } });
    for (const eventType of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
      const response = await signedWebhook(session, { eventType });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.service, service);
      assert.equal(body.payment_status, "paid");
    }
  }
  const processing = await signedWebhook(paidSession({ payment_status: "unpaid" }));
  assert.equal(processing.status, 200);
  assert.equal((await processing.json()).payment_status, "processing");
});

test("signed invoice webhooks reject mismatched payment details and invalid signatures", async () => {
  assert.equal((await signedWebhook(paidSession(), { invalidSignature: true })).status, 400);
  for (const changes of [
    { amount_total: 1 }, { amount_total: 123000 }, { currency: "eur" }, { mode: "subscription" },
    { metadata: { ...paidSession().metadata, schema_version: "2" } },
    { metadata: { ...paidSession().metadata, invoice_number: "LP-OTHER" } },
    { metadata: { ...paidSession().metadata, payment_part: "full" } },
    { metadata: { ...paidSession().metadata, service: "merchandise" } },
  ]) {
    assert.equal((await signedWebhook(paidSession(changes))).status, 400, JSON.stringify(changes));
  }
});
