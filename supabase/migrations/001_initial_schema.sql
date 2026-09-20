create extension if not exists pgcrypto;
create type product_status as enum ('active','preorder','coming_soon','draft','archived');
create type order_status as enum ('pending','paid','processing','shipped','delivered','cancelled','refunded');
create table profiles(id uuid primary key references auth.users(id) on delete cascade,email text,full_name text,role text default 'customer',birthday date,loyalty_points int default 0,vip_tier text default 'Creator',referral_code text unique,created_at timestamptz default now());
create table collections(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,description text,image_url text,is_active boolean default true,featured boolean default false,sort_order int default 0,created_at timestamptz default now());
create table products(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,description text,price numeric(10,2) not null,compare_at_price numeric(10,2),category text,collection_id uuid references collections(id),collection_name text,material text default 'PLA',colors jsonb default '[]',images jsonb default '[]',status product_status default 'draft',inventory_quantity int default 0,low_stock_threshold int default 5,featured boolean default false,best_seller boolean default false,is_active boolean default true,sort_order int default 0,seo_title text,seo_description text,created_at timestamptz default now(),updated_at timestamptz default now());
create table bundles(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,description text,price numeric(10,2),product_ids jsonb default '[]',is_active boolean default true,created_at timestamptz default now());
create table inventory_events(id uuid primary key default gen_random_uuid(),product_id uuid references products(id) on delete cascade,change int not null,reason text,reference_id text,created_at timestamptz default now());
create table carts(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),session_id text,items jsonb default '[]',coupon_code text,updated_at timestamptz default now());
create table orders(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),email text,status order_status default 'pending',provider text,provider_order_id text,subtotal numeric(10,2),discount numeric(10,2) default 0,shipping numeric(10,2) default 0,tax numeric(10,2) default 0,total numeric(10,2),shipping_address jsonb,billing_address jsonb,tracking_number text,created_at timestamptz default now(),updated_at timestamptz default now());
create table order_items(id uuid primary key default gen_random_uuid(),order_id uuid references orders(id) on delete cascade,product_id uuid references products(id),name text,price numeric(10,2),quantity int,options jsonb default '{}');
create table reviews(id uuid primary key default gen_random_uuid(),product_id uuid references products(id),user_id uuid references profiles(id),rating int check(rating between 1 and 5),title text,body text,images jsonb default '[]',verified boolean default false,status text default 'pending',created_at timestamptz default now());
create table coupons(id uuid primary key default gen_random_uuid(),code text unique not null,type text,value numeric(10,2),minimum_order numeric(10,2),starts_at timestamptz,ends_at timestamptz,usage_limit int,usage_count int default 0,is_active boolean default true);
create table newsletter_subscribers(id uuid primary key default gen_random_uuid(),email text unique not null,status text default 'subscribed',source text default 'website',created_at timestamptz default now());
create table loyalty_transactions(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),points int,reason text,order_id uuid references orders(id),created_at timestamptz default now());
create table referrals(id uuid primary key default gen_random_uuid(),referrer_id uuid references profiles(id),code text,visitor_id text,referred_user_id uuid references profiles(id),order_id uuid references orders(id),commission numeric(10,2) default 0,status text default 'clicked',created_at timestamptz default now());
create table affiliate_applications(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),website text,audience text,status text default 'pending',commission_rate numeric(5,2) default 10,created_at timestamptz default now());
create table wholesale_accounts(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),business_name text,tax_id text,status text default 'pending',discount_percent numeric(5,2) default 0,minimum_order numeric(10,2),created_at timestamptz default now());
create table wholesale_quotes(id uuid primary key default gen_random_uuid(),wholesale_account_id uuid references wholesale_accounts(id),items jsonb,status text default 'requested',total numeric(10,2),created_at timestamptz default now());
create table subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),plan text,status text default 'active',provider_subscription_id text,next_billing_at timestamptz,created_at timestamptz default now());
create table design_vault_items(id uuid primary key default gen_random_uuid(),name text not null,description text,stage text,image_url text,vote_count int default 0,is_public boolean default true,created_at timestamptz default now());
create table design_votes(id uuid primary key default gen_random_uuid(),design_id uuid references design_vault_items(id) on delete cascade,user_id uuid references profiles(id),visitor_id text,created_at timestamptz default now(),unique(design_id,user_id));
create table design_comments(id uuid primary key default gen_random_uuid(),design_id uuid references design_vault_items(id),user_id uuid references profiles(id),body text,status text default 'visible',created_at timestamptz default now());
create table design_requests(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),email text,title text,description text,status text default 'new',created_at timestamptz default now());
create table printers(id uuid primary key default gen_random_uuid(),name text not null,status text default 'idle',current_job text,progress int default 0,estimated_completion timestamptz,last_updated timestamptz default now());
create table print_jobs(id uuid primary key default gen_random_uuid(),printer_id uuid references printers(id),product_id uuid references products(id),name text,status text default 'queued',progress int default 0,quantity int default 1,started_at timestamptz,completed_at timestamptz,created_at timestamptz default now());
create table custom_orders(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),name text,email text,description text,dimensions text,quantity int,material text,colors text,file_url text,status text default 'new',estimate numeric(10,2),created_at timestamptz default now());
create table gallery_items(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),product_id uuid references products(id),image_url text,video_url text,caption text,instagram_handle text,status text default 'pending',created_at timestamptz default now());
create table notifications(id uuid primary key default gen_random_uuid(),user_id uuid references profiles(id),type text,title text,body text,read_at timestamptz,created_at timestamptz default now());
create table analytics_events(id bigserial primary key,user_id uuid references profiles(id),session_id text,event_name text,path text,properties jsonb default '{}',created_at timestamptz default now());

alter table profiles enable row level security; alter table products enable row level security; alter table orders enable row level security; alter table reviews enable row level security; alter table design_votes enable row level security; alter table custom_orders enable row level security;
create policy "public products" on products for select using(is_active=true);
create policy "own profile" on profiles for select using(auth.uid()=id);
create policy "update own profile" on profiles for update using(auth.uid()=id);
create policy "own orders" on orders for select using(auth.uid()=user_id);
create policy "create reviews" on reviews for insert with check(auth.uid()=user_id);
create policy "public approved reviews" on reviews for select using(status='approved');
create policy "own votes" on design_votes for insert with check(auth.uid()=user_id or user_id is null);
create policy "own custom orders" on custom_orders for select using(auth.uid()=user_id);
create policy "create custom orders" on custom_orders for insert with check(user_id is null or auth.uid()=user_id);

insert into collections(name,slug,description,featured) values ('Halloween','halloween','Limited seasonal clickers and bundles',true),('Sneaker','sneaker','Sneaker-culture inspired clickers',true),('Glow','glow','Glow-in-the-dark sensory designs',false),('Custom','custom','Made-to-order creations',true);


insert into storage.buckets(id,name,public) values ('product-images','product-images',true),('customer-gallery','customer-gallery',false),('custom-order-files','custom-order-files',false),('print-lab','print-lab',true) on conflict (id) do nothing;
create policy "public product images" on storage.objects for select using(bucket_id='product-images');
create policy "public print lab" on storage.objects for select using(bucket_id='print-lab');
create policy "authenticated custom uploads" on storage.objects for insert to authenticated with check(bucket_id in ('customer-gallery','custom-order-files') and owner_id = auth.uid()::text);
