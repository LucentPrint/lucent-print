# Lucent Print Phases 1–5 Implementation

## Phase 1 — Foundation
- Supabase product/collection data layer with 8-product fallback
- Dynamic shop, product pages, Print Lab, and Design Vault
- SEO metadata, sitemap, robots, product schema
- Connection diagnostics

## Phase 2 — Commerce
- Persistent cart with shipping estimate
- Local wishlist
- Customer sign-up, sign-in, password reset, account dashboard
- Checkout page with Etsy, Stripe, Apple Pay/Google Pay readiness, and PayPal Orders API
- Product availability rules and coming-soon handling

## Phase 3 — Business Systems
- Protected admin dashboard
- Product and inventory CRUD manager
- Live read views for orders, collections, reviews, coupons, newsletter, Print Lab, Design Vault, wholesale, affiliates, and analytics
- Custom-order studio with file upload
- Stripe webhook order creation and loyalty records

## Phase 4 — Growth
- Customer reviews and product review display
- Loyalty dashboard and referral codes
- Newsletter and analytics routes
- Resend email integration hook
- Abandoned-cart and email-event database structures

## Phase 5 — Scale
- Wholesale quote workflow
- Affiliate application workflow
- Subscription-box interest workflow
- Community Design Vault voting
- AI product finder endpoint
- Mobile application roadmap

## External activation still required
Private service accounts and credentials must be supplied by the business owner. Run both Supabase migrations, configure environment variables, test payments in sandbox, and deploy to staging before accepting live orders.
