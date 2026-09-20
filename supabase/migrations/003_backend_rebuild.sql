begin;

-- Product catalog scale layer.
alter type product_status add value if not exists 'sold_out';
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists weight_oz numeric(10,2);
alter table public.products add column if not exists length_in numeric(10,2);
alter table public.products add column if not exists width_in numeric(10,2);
alter table public.products add column if not exists height_in numeric(10,2);
alter table public.products add column if not exists etsy_taxonomy_id bigint;
alter table public.products add column if not exists etsy_shipping_profile_id bigint;
alter table public.products add column if not exists search_document tsvector generated always as (
  setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(category,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(collection_name,'')), 'C')
) stored;
create unique index if not exists products_sku_key on public.products(sku) where sku is not null;
create index if not exists products_search_document_idx on public.products using gin(search_document);
create index if not exists products_catalog_idx on public.products(is_active,status,sort_order);
create index if not exists products_collection_idx on public.products(collection_id);

create table if not exists public.product_variants(
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  sku text unique, title text not null, options jsonb not null default '{}'::jsonb, price numeric(10,2),
  inventory_quantity int not null default 0, is_active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants(product_id,is_active,sort_order);

create table if not exists public.product_media(
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  url text not null, media_type text not null default 'image', alt_text text, sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_media_product_idx on public.product_media(product_id,sort_order);

-- Etsy sales channel readiness. OAuth tokens should be encrypted externally before production use.
create table if not exists public.etsy_connections(
  id uuid primary key default gen_random_uuid(), shop_id bigint unique, shop_name text,
  access_token_encrypted text, refresh_token_encrypted text, token_expires_at timestamptz,
  status text not null default 'disconnected', last_synced_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.etsy_listings(
  id uuid primary key default gen_random_uuid(), product_id uuid not null unique references public.products(id) on delete cascade,
  etsy_listing_id bigint unique, state text not null default 'draft', etsy_url text,
  last_sync_status text not null default 'never', last_sync_error text, last_synced_at timestamptz,
  remote_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.etsy_sync_jobs(
  id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade,
  direction text not null check(direction in ('push','pull')), status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb, error text, attempts int not null default 0,
  started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists etsy_sync_jobs_queue_idx on public.etsy_sync_jobs(status,created_at);

-- Durable admin and operational records.
create table if not exists public.admin_audit_log(
  id bigserial primary key, admin_user_id uuid references auth.users(id), action text not null,
  entity_type text not null, entity_id text, before_data jsonb, after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log(entity_type,entity_id,created_at desc);

-- Atomic inventory adjustment used by admin, checkout webhooks, and Etsy sync.
create or replace function public.adjust_inventory(
  p_product_id uuid, p_change int, p_reason text, p_reference_id text default null
) returns int language plpgsql security definer set search_path=public as $$
declare new_quantity int;
begin
  update products
  set inventory_quantity = greatest(0, inventory_quantity + p_change), updated_at = now()
  where id = p_product_id
  returning inventory_quantity into new_quantity;
  if new_quantity is null then raise exception 'Product not found'; end if;
  insert into inventory_events(product_id,change,reason,reference_id) values(p_product_id,p_change,p_reason,p_reference_id);
  return new_quantity;
end; $$;

-- Keep profile point balance consistent with transaction ledger.
create or replace function public.recalculate_loyalty_balance(p_user_id uuid) returns int
language plpgsql security definer set search_path=public as $$
declare total_points int;
begin
  select coalesce(sum(points),0)::int into total_points from loyalty_transactions where user_id=p_user_id;
  update profiles set loyalty_points=total_points where id=p_user_id;
  return total_points;
end; $$;
create or replace function public.loyalty_ledger_changed() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  perform recalculate_loyalty_balance(coalesce(new.user_id,old.user_id));
  return coalesce(new,old);
end; $$;
drop trigger if exists loyalty_ledger_balance on public.loyalty_transactions;
create trigger loyalty_ledger_balance after insert or update or delete on public.loyalty_transactions
for each row execute procedure public.loyalty_ledger_changed();

-- Admin authorization from database role; ADMIN_EMAILS remains a bootstrap option in the app.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from profiles where id=auth.uid() and role in ('admin','owner'));
$$;

alter table public.collections enable row level security;
alter table public.printers enable row level security;
alter table public.print_jobs enable row level security;
alter table public.design_vault_items enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.etsy_connections enable row level security;
alter table public.etsy_listings enable row level security;
alter table public.etsy_sync_jobs enable row level security;
alter table public.admin_audit_log enable row level security;

-- Public catalog/read policies.
drop policy if exists "public collections" on public.collections;
create policy "public collections" on public.collections for select using(is_active=true);
drop policy if exists "public printers" on public.printers;
create policy "public printers" on public.printers for select using(true);
drop policy if exists "public print jobs" on public.print_jobs;
create policy "public print jobs" on public.print_jobs for select using(status in ('queued','printing','paused','completed'));
drop policy if exists "public vault" on public.design_vault_items;
create policy "public vault" on public.design_vault_items for select using(is_public=true);
drop policy if exists "public product variants" on public.product_variants;
create policy "public product variants" on public.product_variants for select using(is_active=true);
drop policy if exists "public product media" on public.product_media;
create policy "public product media" on public.product_media for select using(true);

-- Admin policies for authenticated database-role admins.
do $$ declare t text; begin
  foreach t in array array['products','collections','product_variants','product_media','printers','print_jobs','design_vault_items','orders','order_items','reviews','coupons','loyalty_transactions','etsy_connections','etsy_listings','etsy_sync_jobs'] loop
    execute format('drop policy if exists "admin manage %1$s" on public.%1$I',t);
    execute format('create policy "admin manage %1$s" on public.%1$I for all using(public.is_admin()) with check(public.is_admin())',t);
  end loop;
end $$;
drop policy if exists "admin audit read" on public.admin_audit_log;
create policy "admin audit read" on public.admin_audit_log for select using(public.is_admin());

-- Storage policies suitable for the admin product manager.
drop policy if exists "admin product image uploads" on storage.objects;
create policy "admin product image uploads" on storage.objects for insert to authenticated
with check(bucket_id='product-images' and public.is_admin());
drop policy if exists "admin product image updates" on storage.objects;
create policy "admin product image updates" on storage.objects for update to authenticated
using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
drop policy if exists "admin product image deletes" on storage.objects;
create policy "admin product image deletes" on storage.objects for delete to authenticated
using(bucket_id='product-images' and public.is_admin());

commit;
