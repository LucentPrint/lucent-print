# Lucent Print Backend Rebuild

## Implemented
- Supabase is the only catalog/data source. `lib/mock-data.ts` was removed.
- Product catalog queries now return database records only.
- Database-role admin authorization (`profiles.role = admin|owner`) plus `ADMIN_EMAILS` bootstrap support.
- Generic editable admin API and UI for collections, printers, Design Vault, orders, reviews, coupons, loyalty, and Etsy listing records.
- Product manager remains available for detailed catalog editing.
- Atomic inventory adjustment RPC and inventory event ledger.
- Loyalty balance is automatically recalculated from the transaction ledger.
- Product variants, media, full-text search, SKU and physical/Etsy listing fields.
- Etsy channel tables, sync queue, listing mappings, and Etsy-compatible CSV export.
- Admin audit logging.
- Public/admin RLS policies and admin Storage policies.

## Required Supabase step
Run `supabase/migrations/003_backend_rebuild.sql` after migrations 001 and 002, then run `supabase/migrations/004_live_catalog_seed.sql` to place the eight live products, collections, printers, and Design Vault records in Supabase.

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `ADMIN_EMAILS` (comma-separated bootstrap admin emails)

## Make your account a permanent database admin
After you have signed up, run in Supabase SQL Editor:

```sql
update public.profiles set role='owner' where email='YOUR_EMAIL_HERE';
```

## Etsy readiness
Use Admin > Etsy Listings > Download Etsy CSV now. Direct API synchronization additionally requires Etsy OAuth credentials and a secure token-encryption service; the schema and sync queue are ready for that connection.
