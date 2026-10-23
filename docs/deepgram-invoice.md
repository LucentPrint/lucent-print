# Deepgram invoice LP-2026-1020 (Rev. 2)

## Payment page

The unlisted page is `/pay/deepgram`. Its browser title is **Lucent Print — Invoice LP-2026-1020.** It uses the existing Lucent Print header, logo, and styling, and shows the $1,480.00 total, $615.00 deposit received, and $865.00 balance due on receipt:

| Button | Stripe line item | Amount |
| --- | --- | --- |
| Deposit — $615.00 (paid), disabled | Deepgram centerpieces — deposit | $615.00 USD |
| Pay balance — $865.00 | Deepgram centerpieces — balance | $865.00 USD |

The balance button opens Stripe-hosted Checkout in `payment` mode with one line item and quantity one. Neither starts a subscription. The site does not collect card details. There are no new shipping charges, discounts, automatic taxes, or paid post-payment invoice generation in this flow.

The page and success page have `noindex`, `nofollow`, and `no-referrer` metadata. Neither appears in the sitemap or public navigation. This is an unlisted URL, not password protection: anyone who has the URL can open it.

## Email, company, and receipt setup

Checkout collects an email address and requires a business/company name using `name_collection.business.enabled: true` and `optional: false`. With `customer_creation: "always"`, Stripe preserves the supplied company and contact details in its customer records. The page and Checkout instruct the payer to use **Deepgram's accounts payable email**. No AP address has been supplied, so the integration does not guess one or assume that entering the company name determines the email recipient.

**Stripe account setting required:** In live-mode Stripe, open **Settings → Business → Customer emails → Payments**, then turn on **Successful payments** and save if prompted. Direct setting: https://dashboard.stripe.com/settings/emails. Stripe then automatically sends a receipt for successful payments to the email collected at checkout. A webhook is not needed to make Stripe send these native receipts.

The account-wide automatic-receipt toggle could not be accessed or verified from the connected browser during implementation. Treat it as an outstanding account setup check; the source code does not enable it. No live payment or email was sent during testing.

`invoice_creation.enabled` is deliberately not enabled. The existing invoice identifier is carried in Checkout and PaymentIntent metadata, the line-item description, and the success page. Stripe's paid invoice generation is a separate feature with separate pricing, and it still requires the automatic-receipt setting for email delivery.

Official Stripe references:

- https://docs.stripe.com/receipts
- https://docs.stripe.com/payments/checkout/name-collection
- https://docs.stripe.com/api/checkout/sessions/create

## Vercel environment variables

Set these under the existing Vercel project's **Settings → Environment Variables**, with the appropriate Production/Preview scope, and redeploy after changes. Keep test keys in a separate test/staging deployment.

| Variable | Required for this page? | Value / behavior |
| --- | --- | --- |
| `STRIPE_API_KEY` **or** `STRIPE_SECRET_KEY` | Yes, one server key | Existing Stripe live server key. This stack reads `STRIPE_API_KEY` first and falls back to `STRIPE_SECRET_KEY`. Use a key for the same account as the existing store. Never prefix a server key with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Set explicitly | `https://lucent-print.vercel.app` in Production. Used for trusted origin and success/cancel destinations. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No, for this hosted flow | Redirecting to the hosted Session URL does not initialize Stripe.js. Leave any existing value in place for other integrations; this feature adds no browser key requirement. |
| `STRIPE_WEBHOOK_SECRET` | Only for the existing webhook | The `whsec_...` signing secret for `/api/webhooks/stripe`, if that endpoint is enabled. It is separate from the API key. Not needed for Checkout or Stripe automatic receipts. |

A restricted server key must permit the Checkout Session create/retrieve operations and related inline product/price, customer, and payment operations. No keys, card details, or secret environment values are hardcoded or sent to the browser.

## Server-controlled payment flow

`POST /api/pay/deepgram/checkout` accepts only `{ part: "deposit" | "balance", clientRequestId: UUID }`. Strict validation rejects client-supplied amounts, currency, quantity, invoice identifiers, redirect URLs, or other payment settings. The server fixes the amount at **61500 cents for deposit or 86500 cents for balance**, currency at **usd**, and product name from the selected permitted part. It also validates the request origin, bounds the body to 2048 bytes, and returns controlled errors without secret details.

Session and PaymentIntent metadata identify service `deepgram-centerpieces`, invoice `LP-2026-1020`, the payment part, schema version `2`, and request ID. Independent deposit/balance attempt IDs and idempotency keys reduce accidental duplicates across repeated clicks and network retries. The browser retains an attempt after payment. The API retrieves the current Stripe Session after idempotent creation, so it can redirect completed attempts to their confirmation or ask the customer to restart an expired attempt.

The paid deposit button is disabled; the API still supports the unchanged deposit amount for verification and isolated tests. This is a one-time payment flow, not a global invoice installment lock across devices. An additional browser or a fresh attempt can create another payment; review the Stripe payment history before requesting another payment for an already-paid installment.

Successful checkout returns to `/pay/deepgram/success?session_id={CHECKOUT_SESSION_ID}`. The success page retrieves the Session on the server and requires the exact invoice, service, schema version, part, payment mode, the part-specific total ($615.00 USD deposit or $865.00 USD balance), completed status, and paid status before showing **Payment received — thank you**, the amount, and invoice number. An arbitrary success URL or another service's Session cannot claim this invoice was paid. No payer email, company details, or card information appears on the public confirmation page. Stripe cancellation returns exactly to `/pay/deepgram`.

## Webhook behavior

No new webhook is required for hosted Checkout, server-verified success display, or Stripe automatic receipt emails. The existing `/api/webhooks/stripe` handler has been updated to recognize these invoice payments before merchandise fulfillment. Keep its existing `STRIPE_WEBHOOK_SECRET` and event subscriptions if the store already uses it:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

For Deepgram payments, the handler uses the same part-specific amount verification as the success page and verifies payment details and acknowledges the event without creating merchandise orders, adjusting inventory, adding loyalty points, or sending apparel/order emails. Repeated notifications have no invoice fulfillment side effects. If future work must trigger production, update accounting, or persist an invoice-paid status even when the customer closes the browser, use verified webhooks and durable records for that work.

## Verification

```sh
npm run test:deepgram
npm run test:reservations
npm run typecheck
npm run lint
```

The new regression suite uses synthetic data, mocked Stripe calls, and real Stripe-generated test signatures. It covers fixed amounts and product names for both parts, input tampering, required company/email collection, retry behavior and expired/completed Sessions, malformed and oversized requests, provider failures, rendered success pages rejecting swapped installment amounts, verified success states, and isolation from merchandise fulfillment. It never charges a card or sends an email.
