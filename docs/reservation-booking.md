# Party planning and reservation booking

## Customer flow

- `/party-planning` introduces party planning and links inquiries to the existing contact page.
- The reservation form captures contact information, event preferences, and acknowledgment that the date still needs confirmation.
- `/api/reservations/checkout` validates those fields and creates a Stripe-hosted Checkout Session for **one Reservation Booking Service at $390.00 USD**, paid once.
- The server controls the amount, currency, quantity, and return URLs. No shipping charges, apparel deposits, subscription, promotions, or automatic tax are added by this flow.
- Checkout uses card payments, including eligible wallets offered by Stripe. The application never receives card details.
- Stripe cancellation returns to the form. A session-only draft preserves details and the checkout attempt across retries. A verified paid receipt clears the draft.
- `/party-planning/confirmation` retrieves the session from Stripe and checks the service marker, schema version, payment mode, amount, currency, and payment status. A query flag alone cannot display a successful payment.
- A successful payment does **not** confirm availability or reserve a date automatically. Date confirmation remains a manual business follow-up.

## $60 reservation booking add-on

`/party-planning/add-on` is a shareable payment page with a **Pay $60.00** button. The main party-planning page also has a direct add-on payment button. Clicking opens a Stripe-hosted Checkout Session for exactly one **Reservation Booking Service Add-On at $60.00 USD**. Customers do not repeat the event form or sign in; Stripe collects their email and offers an optional **Booking reference or event date** field for matching the payment to their booking.

`POST /api/reservations/add-on/checkout` accepts only a client-generated UUID, validates the origin and request size, and controls the product, price, quantity, currency, and redirect destinations on the server. It uses the existing Stripe credentials. The `reservation-booking-addon` metadata marker distinguishes add-ons from the $390 service. Both the Checkout Session and PaymentIntent carry that marker. The optional reference remains in the Checkout Session's `custom_fields` and is visible on the owner reservations page.

The browser stores the add-on request UUID in `sessionStorage["lucent.reservation.addon.request.v1"]` so repeated clicks, cancellations, and network retries reuse one attempt. Expired attempts prompt a new explicit click. A verified paid add-on receipt clears only the add-on request, preserving any separate $390 booking draft. The common receipt verifies the appropriate service, amount, currency, mode, version, and payment state before confirming payment; the webhook handles both reservation services before merchandise fulfillment. The owner page lists both service types with their amounts and customer contact details.

The add-on is a separate one-time payment. It adds no shipping, promotion, subscription, automatic tax, new refund terms, or automatic event-date confirmation. Existing $390 bookings retain their existing behavior. Merely visiting the add-on page does not create a checkout or initiate payment.

## Bank statement description

New reservation checkouts set `payment_intent_data.statement_descriptor_suffix` to `RESERVATION`. Stripe combines this with the account's shortened statement descriptor and `* `; a shortened descriptor of `LUCENT` produces `LUCENT* RESERVATION`. The combined text must fit Stripe's 22-character limit, so use a prefix of at most 9 characters to preserve the full suffix. The account setting must be checked in Stripe; the checkout page's business name does not verify it, and banks can format statements differently.

Checkout attempts created before this update keep their original descriptor. Retries preserve the existing idempotency key and recover the original session rather than creating another payment attempt. This update does not change the account-wide statement descriptor or the merchandise checkout.

## Records and access

Event details are attached to both the Checkout Session and its PaymentIntent metadata. Stripe is the system of record; this feature does not create merchandise orders or write customer details to Supabase tables.

`/admin/reservations` lists reservation checkouts and links paid attempts to their Stripe payment histories. Pagination searches batches of up to 500 checkouts and provides an older-record cursor; it does not silently exclude older bookings behind merchandise purchases. “Checkout paid” describes the original checkout and is not a current refund/dispute status.

The reservation owner page requires a user verified through Supabase `auth.getUser()`, a confirmed email, and a matching address in `ADMIN_EMAILS`. It deliberately does not use the existing profile-role fallback. Customer and event details never appear on the public confirmation page.

## Deployment configuration

Use the existing Vercel project and Stripe account. No new database migration or new payment provider is required.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical website origin, e.g. `https://lucent-print.vercel.app`. The form and Stripe return URLs must use this origin. |
| `STRIPE_API_KEY` | Existing server-only Stripe key. It must permit Checkout Session creation/retrieval/listing and the related inline price/product and payment operations. |
| `STRIPE_SECRET_KEY` | Supported legacy fallback when `STRIPE_API_KEY` is absent. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the existing `/api/webhooks/stripe` endpoint. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing Supabase authentication configuration for owner access. |
| `ADMIN_EMAILS` | Comma-separated verified owner email addresses allowed to read reservation details. |

Keep keys in deployment environment variables. No Stripe key is required in the browser for this hosted-checkout flow. Checkout reports a controlled unavailable state if the server key is missing.

The existing Stripe webhook must subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. It verifies Stripe signatures, recognizes reservation sessions before merchandise fulfillment, validates payment details, and returns without touching orders, inventory, loyalty, or order email. Duplicate reservation webhook deliveries therefore introduce no additional side effects.

## Verification

```bash
npm ci
npm run test:reservations
npm run typecheck
npm run build
```

Focused tests use synthetic customer details, mocked Stripe transport, and Stripe-generated test webhook signatures. They do not call Stripe or charge a card. They cover server-owned pricing, invalid or past dates, bounded metadata, idempotency, payment-state verification, owner authorization, pagination, error handling, signed reservation webhooks, and the existing merchandise branch.

The statement-description update passes **17 tests**, TypeScript, and ESLint, including reuse of pre-update open, completed, and expired Stripe attempts and controlled provider failures.

The $60 add-on update passes **27 tests**, TypeScript, and ESLint. The added coverage verifies strict add-on input, the fixed $60 USD amount, optional booking-reference collection, retry behavior, checkout failures, service-specific receipts, owner history, and signed add-on webhooks while preserving the original $390 tests.

Implementation checks completed: **16 tests passed**, TypeScript passed, ESLint passed, and a production build completed with Webpack. This workspace prevents Turbopack's internal worker socket and does not capture output from Next's detached TypeScript CLI process. The verification build therefore used `--webpack` and a temporary `experimental.useTypeScriptCli: false` setting, which runs the TypeScript compiler API with type checking enabled. The original Next configuration was restored afterward. No build-setting or dependency changes are part of this feature.

The local checks described here do not verify production credentials or the hosted Stripe payment screen. Verify the deployment and the intended Stripe account separately before relying on live payments.

Before publishing, verify that the production environment uses the intended Stripe account and that the owner can access the reservations page. A Stripe test-mode checkout in a separately configured staging environment can validate the final hosted UI without charging a real card.

## Scope

This change adds a paid reservation **request** service. It does not introduce an availability calendar, automatic date confirmation, refund policy, cancellation terms, automatic customer follow-up emails, or a separate price for party planning. Planning inquiries use the website’s existing contact workflow.
