# Lucent Print v2 — Phases 1–5

Production-oriented Next.js storefront with Supabase-backed commerce and business systems.

## Included

1. **Foundation:** dynamic products/collections, product pages, Print Lab, Design Vault, SEO, responsive brand system.
2. **Commerce:** persistent cart, wishlist, checkout page, Etsy/Stripe/PayPal routes, authentication and customer dashboard.
3. **Business:** protected admin dashboard, product/inventory editor, orders and business schema.
4. **Growth:** reviews API, loyalty dashboard, referrals, newsletter, analytics event capture, SEO metadata and abandoned-cart schema.
5. **Scale:** wholesale quote requests, affiliate applications, subscription interest, custom-order studio, AI product finder and mobile roadmap.

## Required setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Run Supabase migrations in order:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_phases_2_to_5.sql`
- `supabase/seed.sql`

## Private integrations

Features activate when these are configured in `.env.local`:

- `SUPABASE_SERVICE_ROLE_KEY` — admin writes and trusted webhooks
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `NEXT_PUBLIC_GA_ID`

Never commit `.env.local`.

## Before taking live payments

Verify taxes, shipping rules, refund policy, product safety copy, payment webhooks, order-email delivery, domain, and legal pages in a staging deployment.
