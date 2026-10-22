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

// Run the actual payment source with mocked transport; no live Stripe calls.
function loadSource(entry, overrides = {}, environment = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(root, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const moduleRecord = { exports: {} };
    cache.set(absolute, moduleRecord);
    const { outputText } = ts.transpileModule(readFileSync(absolute, "utf8"), {
      fileName: absolute,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
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

const { reimbursementCheckoutSchema, REIMBURSEMENT_ITEMS } = loadSource("lib/reimbursement.ts");
const {
  buildReimbursementCheckout, reimbursementIdempotencyKey,
  isReimbursementSession, reimbursementPaymentState, validReimbursementSessionId,
} = loadSource("lib/reimbursement-checkout.ts");

const reference = "LP-DG-SOUNDON-2026-REIMBURSEMENT";
const service = "deepgram-materials-reimbursement";
const requestId = "1583025c-a00f-4d9e-8686-cea973fd04fb";
const input = { clientRequestId: requestId };
const baseUrl = "https://lucent-print.vercel.app";
const paymentPath = "/pay/deepgram/reimbursement";
const jsonResponse = { NextResponse: { json: (body, options) => Response.json(body, options) } };

function paidSession(changes = {}) {
  return {
    id: "cs_test_reimbursement1234567890",
    object: "checkout.session",
    metadata: { service, schema_version: "1", reimbursement_reference: reference, request_id: requestId },
    mode: "payment", payment_status: "paid", currency: "usd", amount_total: 69107, status: "complete",
    ...changes,
  };
}

function checkoutRoute({
  environment = { STRIPE_SECRET_KEY: "sk_test_local_no_network" },
  create = async () => { throw new Error("Unexpected Stripe create"); },
  retrieve = async () => { throw new Error("Unexpected Stripe retrieve"); },
} = {}) {
  return loadSource("app/api/pay/deepgram/reimbursement/checkout/route.ts", {
    "next/server": jsonResponse,
    stripe: class StripeMock { checkout = { sessions: { create, retrieve } }; },
  }, environment);
}

function checkoutRequest(body = input, headers = {}) {
  return new Request(`${baseUrl}/api${paymentPath}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: baseUrl, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("reimbursement is exactly $691.07 USD once, with no editable price or added charges", () => {
  assert.deepEqual(reimbursementCheckoutSchema.parse(input), input);
  assert.deepEqual(REIMBURSEMENT_ITEMS, [
    { name: "Hobby Lobby", amount: 13907 }, { name: "Amazon", amount: 55200 },
  ]);
  assert.equal(REIMBURSEMENT_ITEMS.reduce((total, item) => total + item.amount, 0), 69107);
  for (const bad of [
    {}, null, [], { clientRequestId: "invalid" }, { ...input, amount: 1 },
    { ...input, currency: "eur" }, { ...input, quantity: 2 }, { ...input, part: "deposit" },
    { ...input, success_url: "https://example.net" }, { ...input, metadata: { service: "merchandise" } },
  ]) assert.equal(reimbursementCheckoutSchema.safeParse(bad).success, false);

  const params = buildReimbursementCheckout(input, `${baseUrl}/ignored?return=untrusted`);
  assert.equal(params.mode, "payment");
  assert.equal(params.line_items.length, 1);
  const item = params.line_items[0];
  assert.equal(item.quantity, 1);
  assert.equal(item.price_data.unit_amount, 69107);
  assert.equal(item.price_data.currency, "usd");
  assert.equal(item.price_data.product_data.name, "Deepgram Sound On 2026 materials reimbursement");
  for (const field of ["subscription_data", "shipping_options", "shipping_address_collection", "discounts"])
    assert.equal(params[field], undefined, field);
  assert.equal(item.adjustable_quantity, undefined);
  assert.equal(item.price_data.recurring, undefined);
  assert.deepEqual(params.automatic_tax, { enabled: false });
  assert.equal(params.allow_promotion_codes, false);
  assert.equal(params.customer_creation, "always");
  assert.deepEqual(params.name_collection.business, { enabled: true, optional: false });
  assert.equal(params.metadata.service, service);
  assert.equal(params.metadata.reimbursement_reference, reference);
  assert.equal(params.metadata.invoice_number, undefined, "The deposit/balance invoice has a separate identity");
  assert.deepEqual(params.payment_intent_data.metadata, params.metadata);
  assert.equal(params.success_url, `${baseUrl}${paymentPath}/success?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.cancel_url, `${baseUrl}${paymentPath}`);
  assert.equal(reimbursementIdempotencyKey(input), reimbursementIdempotencyKey({ ...input }));
  assert.notEqual(reimbursementIdempotencyKey(input), reimbursementIdempotencyKey({ clientRequestId: "09c75004-5db5-4eae-8630-4c2ab3082224" }));
});

test("receipt state requires exact reimbursement identity and a complete paid session", () => {
  assert.equal(reimbursementPaymentState(paidSession()), "paid");
  for (const changes of [
    { amount_total: 61500 }, { amount_total: 80730 }, { amount_total: 1 }, { amount_total: null },
    { currency: "eur" }, { mode: "subscription" }, { metadata: null },
    { metadata: { ...paidSession().metadata, service: "deepgram-centerpieces" } },
    { metadata: { ...paidSession().metadata, schema_version: "2" } },
    { metadata: { ...paidSession().metadata, reimbursement_reference: "LP-OTHER" } },
  ]) assert.equal(reimbursementPaymentState(paidSession(changes)), "invalid", JSON.stringify(changes));
  assert.equal(reimbursementPaymentState(paidSession({ payment_status: "unpaid" })), "processing");
  for (const changes of [{ status: "open" }, { status: "expired" }, { payment_status: "no_payment_required" }])
    assert.notEqual(reimbursementPaymentState(paidSession(changes)), "paid");
  assert.equal(validReimbursementSessionId(paidSession().id), true);
  for (const value of [undefined, null, [], "cs_x", "../private", "cs_test_example&paid=true", `cs_test_${"a".repeat(250)}`])
    assert.equal(validReimbursementSessionId(value), false);
});

test("invalid requests fail before Stripe and configuration/provider errors stay controlled", async () => {
  let providerCalls = 0;
  const unexpected = async () => { providerCalls += 1; throw new Error("Should not reach Stripe"); };
  const { POST } = checkoutRoute({ create: unexpected, retrieve: unexpected });
  for (const body of ["{", {}, { ...input, amount: 1 }, { ...input, currency: "eur" }])
    assert.equal((await POST(checkoutRequest(body))).status, 400);
  assert.equal((await POST(checkoutRequest(input, { origin: "https://example.net" }))).status, 403);
  assert.equal((await POST(checkoutRequest("x".repeat(2049)))).status, 413);
  assert.equal((await POST(checkoutRequest(JSON.stringify({ padding: "é".repeat(1100) })))).status, 413);
  assert.equal(providerCalls, 0);
  assert.equal((await checkoutRoute({ environment: {} }).POST(checkoutRequest())).status, 503);
  for (const failure of ["create", "retrieve", "missing-url"]) {
    const cached = { id: paidSession().id, status: "open", url: "https://checkout.stripe.com/c/pay/cached" };
    const fail = () => { throw new Error("private-provider-detail"); };
    const route = checkoutRoute({
      create: failure === "create" ? fail : async () => cached,
      retrieve: failure === "retrieve" ? fail : async () => ({ ...cached, url: null }),
    });
    const response = await route.POST(checkoutRequest());
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.deepEqual(Object.keys(body), ["error"]);
    assert.ok(!JSON.stringify(body).includes("private-provider-detail"));
  }
});

test("retries retain the same payment parameters and retrieve current checkout state", async () => {
  const calls = [];
  const cached = { id: paidSession().id, status: "open", url: "https://checkout.stripe.com/c/pay/cached" };
  let current = { ...cached, url: "https://checkout.stripe.com/c/pay/current" };
  const route = checkoutRoute({
    create: async (params, options) => { calls.push({ params, options }); return cached; },
    retrieve: async (id) => { assert.equal(id, cached.id); return current; },
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await route.POST(checkoutRequest());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { url: current.url });
  }
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].params.line_items[0].price_data.unit_amount, 69107);
  assert.equal(calls[0].options.idempotencyKey, reimbursementIdempotencyKey(input));
  current = { ...cached, status: "complete", url: null, customer_details: { email: "private@example.com" } };
  assert.deepEqual(await (await route.POST(checkoutRequest())).json(), { confirmationPath: `${paymentPath}/success?session_id=${cached.id}` });
  current = { ...current, status: "expired" };
  const expired = await route.POST(checkoutRequest());
  assert.equal(expired.status, 409);
  const body = await expired.json();
  assert.equal(body.code, "checkout_expired");
  assert.ok(!JSON.stringify(body).includes("private@example.com"));
});

async function signedWebhook(session, eventType = "checkout.session.completed", invalidSignature = false) {
  const payload = JSON.stringify({ id: "evt_test_reimbursement", object: "event", type: eventType, data: { object: session } });
  const secret = "whsec_local_reimbursement_only";
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: invalidSignature ? "whsec_wrong" : secret });
  let commerceCalls = 0;
  const unexpectedCommerce = () => { commerceCalls += 1; throw new Error("Reimbursement reached merchandise fulfillment"); };
  const { POST } = loadSource("app/api/webhooks/stripe/route.ts", {
    "next/server": jsonResponse,
    "next/headers": { headers: async () => new Headers({ "stripe-signature": signature }) },
    stripe: class StripeMock { webhooks = Stripe.webhooks; },
    "@/lib/supabase/admin": { createAdminClient: unexpectedCommerce },
    "@/lib/email": { sendEmail: unexpectedCommerce },
  }, { STRIPE_API_KEY: "sk_test_local_no_network", STRIPE_WEBHOOK_SECRET: secret });
  const response = await POST(new Request(`${baseUrl}/api/webhooks/stripe`, { method: "POST", body: payload }));
  assert.equal(commerceCalls, 0, "No merchandise orders, inventory, loyalty, or order emails for reimbursements");
  return response;
}

test("signed reimbursement events validate in isolation from merchandise and prior installments", async () => {
  for (const eventType of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
    const response = await signedWebhook(paidSession(), eventType);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.service, service);
    assert.equal(body.payment_status, "paid");
  }
  for (const changes of [
    { amount_total: 61500 }, { amount_total: 80730 }, { currency: "eur" }, { mode: "subscription" },
    { metadata: { ...paidSession().metadata, service: "merchandise" } },
    { metadata: { ...paidSession().metadata, reimbursement_reference: "LP-OTHER" } },
    { metadata: { service } }, { metadata: { reimbursement_reference: reference } },
  ]) {
    assert.equal(isReimbursementSession(paidSession(changes)), true);
    assert.equal((await signedWebhook(paidSession(changes))).status, 400, JSON.stringify(changes));
  }
  assert.equal(isReimbursementSession({ metadata: { service: "deepgram-centerpieces", invoice_number: "LP-2026-1020" } }), false);
  assert.equal((await signedWebhook(paidSession(), "checkout.session.completed", true)).status, 400);
});
