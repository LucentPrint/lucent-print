# Holiday customization and payment gate

The customization page is usable now: bundle/style/name/colors/quantity/shirt size/date/delivery preference, server-validated price summary, then explicit email handoff. No form fields are transmitted until the customer selects Review. Review is not a persisted order, email send, payment or reservation. Inputs remain in page memory after review/errors; no personal data is placed in URLs or browser storage. Reload intentionally clears the draft. Artwork may be attached in the customer's email app.

## Payment remains blocked

The existing generic checkout is catalog-UUID/inventory based. The generic webhook does not preserve custom bundle details and has multi-step partial-write hazards. Do not route these bundles through it. The `/api/holiday-gifts/checkout` endpoint is a **review endpoint**, deliberately with no Stripe session creation, and always returns `paymentAvailable:false`/`requestSent:false`. No env flag can accidentally enable payments.

Before actual payments are enabled:
1. Confirm holiday pickup/shipping eligibility, actual delivery fees, production deadlines and any refund restrictions. Existing catalog $6.95 / free-over-$75 rules are not approval for this offer.
2. Verify Stripe Tax settings/registrations and correct product treatment/price tax behavior. Do not blindly turn on automatic tax or silently assume tax-free.
3. Persist customization, artwork reference, selected shirt size(s), final delivery and total durably before opening checkout. Use server-priced, immutable order revisions and stable idempotency keys. Approval-required artwork/timing must be confirmed before taking payment.
4. Create Stripe-hosted one-time Checkout sessions for that approved revision only, with server-defined line items and total; keep customer-entered text out of amount/origin fields. Do not specify payment_method_types.
5. Add signed webhook processing for completed/async succeeded/async failed/expired; gate fulfillment on verified paid status and expected amount/currency/revision. Use atomic idempotent order upsert, not the generic product-inventory route. Fail/retry if persistence fails.
6. Success page retrieves and verifies Stripe status server-side, exposes no customer data via a session URL, and does not fulfill. Test replay, repeated clicks, failure/retry, cancellation, unknown session, amount mismatch and delayed payment in a sandbox, never by charging a real card.

No Stripe configuration, database schema, live orders, credentials or deployments were changed by this implementation.
