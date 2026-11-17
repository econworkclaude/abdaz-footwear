-- ABDAZ FOOTWEAR · initial schema
-- Prices, stock and order totals are only ever computed server-side (see place_order).

create extension if not exists pgcrypto;

-- ───────────────────────── Profiles & roles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'rider')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, email) values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ───────────────────────── Catalogue ─────────────────────────
create table public.categories (
  slug text primary key,
  name text not null,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(name) > 1),
  slug text unique,
  sku text unique not null,
  category_slug text not null references public.categories(slug),
  style text not null default 'low' check (style in ('low', 'runner', 'formal', 'slide', 'sandal')),
  description text not null default '',
  material text not null default '',
  sole text not null default '',
  fit text not null default '',
  care text not null default '',
  purchase_cost numeric(10,2) not null default 0 check (purchase_cost >= 0),
  selling_price numeric(10,2) not null check (selling_price > 0),
  mrp numeric(10,2) not null check (mrp > 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- colours: [{id, name, upper, accent, sole}] used for swatches and illustrations
alter table public.products add column colours jsonb not null default '[]'::jsonb;

create table public.product_variants (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  colour_id text not null,
  size int not null check (size between 3 and 13),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  unique (product_id, colour_id, size)
);
create index on public.product_variants (product_id);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  sort_order int not null default 0
);

-- ───────────────────────── Delivery ─────────────────────────
create table public.delivery_zones (
  id text primary key,
  name text not null,
  areas text[] not null default '{}',
  pincodes text[] not null default '{}',
  boundary_data jsonb,
  delivery_fee numeric(10,2) not null default 60 check (delivery_fee >= 0),
  estimated_delivery_minutes int not null default 120 check (estimated_delivery_minutes > 0),
  minimum_order numeric(10,2) not null default 0,
  is_active boolean not null default false
);

create table public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null
);

-- ───────────────────────── Customer data ─────────────────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  full_name text not null,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  house text not null,
  street text not null,
  area text not null,
  landmark text not null default '',
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  address_type text not null default 'Home' check (address_type in ('Home', 'Work', 'Other')),
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.addresses (user_id);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ───────────────────────── Orders ─────────────────────────
create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('AB' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id uuid not null references auth.users(id),
  idempotency_key text not null,
  address_snapshot jsonb not null,
  zone_id text references public.delivery_zones(id),
  subtotal numeric(10,2) not null,
  mrp_total numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  payment_method text not null check (payment_method in ('cod', 'upi')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'placed' check (order_status in ('placed','confirmed','packed','out_for_delivery','delivered','cancelled','delivery_failed','returned','refunded')),
  eta_minutes int not null,
  delivery_partner_id uuid references public.delivery_partners(id),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index on public.orders (user_id, created_at desc);
create index on public.orders (order_status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  variant_id text not null references public.product_variants(id),
  product_name_snapshot text not null,
  colour_name_snapshot text not null,
  size int not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  unit_cost numeric(10,2) not null default 0
);
create index on public.order_items (order_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.order_status_history (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null,
  provider_reference text,
  amount numeric(10,2) not null,
  payment_status text not null,
  created_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_order numeric(10,2) not null default 0,
  expiry_date timestamptz,
  usage_limit int,
  is_active boolean not null default false
);

create table public.exchange_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  order_item_id uuid not null references public.order_items(id),
  user_id uuid not null references auth.users(id) default auth.uid(),
  reason text not null check (reason in ('Wrong Size','Wrong Colour','Damaged','Manufacturing Defect','Wrong Item','Other')),
  requested_variant_id text references public.product_variants(id),
  status text not null default 'requested' check (status in ('requested','under_review','approved','rejected','pickup_scheduled','replacement_processing','completed')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Row-level security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.app_settings enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.exchange_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

-- profiles: own row (role cannot be self-changed, see trigger), admins read all
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.uid() is not null then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

-- public catalogue
create policy cat_read on public.categories for select using (is_active or public.is_admin());
create policy prod_read on public.products for select using (is_active or public.is_admin());
create policy var_read on public.product_variants for select using (true);
create policy media_read on public.product_media for select using (true);
create policy zone_read on public.delivery_zones for select using (true);
create policy settings_read on public.app_settings for select using (true);
create policy cat_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy prod_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy var_admin on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy media_admin on public.product_media for all using (public.is_admin()) with check (public.is_admin());
create policy zone_admin on public.delivery_zones for all using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
create policy partners_admin on public.delivery_partners for all using (public.is_admin()) with check (public.is_admin());
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on public.admin_audit_logs for select using (public.is_admin());

-- customer-owned rows
create policy addr_own on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wish_own on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_own on public.notifications for select using (user_id = auth.uid());
create policy notif_own_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: read own (or admin). No direct insert/update: use place_order / cancel_my_order / admin_set_order_status.
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy items_read on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy history_read on public.order_status_history for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy payments_read on public.payments for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy exch_read on public.exchange_requests for select using (user_id = auth.uid() or public.is_admin());
create policy exch_insert on public.exchange_requests for insert with check (user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid() and o.order_status = 'delivered'));
create policy exch_admin on public.exchange_requests for update using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Functions ─────────────────────────
create or replace function public.order_json(p_order_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'orderNumber', o.order_number, 'address', o.address_snapshot,
    'subtotal', o.subtotal, 'mrpTotal', o.mrp_total, 'discount', o.discount, 'deliveryFee', o.delivery_fee,
    'taxAmount', o.tax_amount, 'total', o.total_amount, 'paymentMethod', o.payment_method,
    'paymentStatus', o.payment_status, 'status', o.order_status, 'etaMinutes', o.eta_minutes,
    'createdAt', o.created_at, 'userId', o.user_id,
    'customerPhone', (select p.phone from public.profiles p where p.id = o.user_id),
    'items', coalesce((select jsonb_agg(jsonb_build_object('productId', i.product_id, 'variantId', i.variant_id,
        'productName', i.product_name_snapshot, 'colourName', i.colour_name_snapshot, 'size', i.size,
        'quantity', i.quantity, 'unitPrice', i.unit_price) order by i.product_name_snapshot)
        from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('status', h.status, 'at', h.created_at) order by h.id)
        from public.order_status_history h where h.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id and (o.user_id = auth.uid() or public.is_admin());
$$;

/** Customer checkout. Validates auth, address, zone, stock; recalculates prices; idempotent. */
create or replace function public.place_order(p_items jsonb, p_address_id uuid, p_payment_method text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_addr public.addresses;
  v_zone public.delivery_zones;
  v_item jsonb;
  v_var public.product_variants;
  v_prod public.products;
  v_qty int;
  v_subtotal numeric := 0;
  v_mrp numeric := 0;
  v_fee numeric;
  v_total numeric;
  v_cod_max numeric;
  v_order_id uuid;
  v_colour text;
begin
  if v_uid is null then raise exception 'Please sign in to place your order.' using errcode = 'P0001'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then raise exception 'Invalid request.'; end if;

  select id into v_existing from public.orders where user_id = v_uid and idempotency_key = p_idempotency_key;
  if v_existing is not null then return public.order_json(v_existing); end if;

  if p_payment_method <> 'cod' then raise exception 'Only Cash on Delivery is available right now.'; end if;
  if coalesce((select (value)::text::boolean from public.app_settings where key = 'cod_enabled'), true) = false then
    raise exception 'Cash on Delivery is paused right now.';
  end if;

  select * into v_addr from public.addresses where id = p_address_id and user_id = v_uid;
  if not found then raise exception 'Please add a delivery address.'; end if;

  select * into v_zone from public.delivery_zones z
   where exists (select 1 from unnest(z.areas) a where lower(trim(a)) = lower(trim(v_addr.area)))
   order by z.is_active desc limit 1;
  if not found or not v_zone.is_active then raise exception 'Sorry, express delivery is not available at this location yet.'; end if;
  if not (v_addr.pincode = any (v_zone.pincodes)) then raise exception 'The pincode does not match this area. Please check your address.'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty.'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Too many items in one order.'; end if;

  insert into public.orders (user_id, idempotency_key, address_snapshot, zone_id, subtotal, mrp_total, total_amount, payment_method, eta_minutes)
  values (v_uid, p_idempotency_key, jsonb_build_object('id', v_addr.id, 'fullName', v_addr.full_name, 'phone', v_addr.phone, 'house', v_addr.house,
            'street', v_addr.street, 'area', v_addr.area, 'landmark', v_addr.landmark, 'city', v_addr.city, 'state', v_addr.state,
            'pincode', v_addr.pincode, 'type', v_addr.address_type, 'isDefault', v_addr.is_default),
          v_zone.id, 0, 0, 0, p_payment_method, v_zone.estimated_delivery_minutes)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'Invalid quantity.'; end if;
    -- lock the variant row so two customers cannot buy the last pair
    select * into v_var from public.product_variants where id = v_item->>'variantId' for update;
    if not found or not v_var.is_active then raise exception 'An item in your bag is no longer available.'; end if;
    select * into v_prod from public.products where id = v_var.product_id and is_active;
    if not found then raise exception 'An item in your bag is no longer available.'; end if;
    if v_var.stock_quantity < v_qty then
      raise exception '% UK %: only % left.', v_prod.name, v_var.size, v_var.stock_quantity;
    end if;
    update public.product_variants set stock_quantity = stock_quantity - v_qty where id = v_var.id;
    select c->>'name' into v_colour from jsonb_array_elements(v_prod.colours) c where c->>'id' = v_var.colour_id;
    insert into public.order_items (order_id, product_id, variant_id, product_name_snapshot, colour_name_snapshot, size, quantity, unit_price, unit_cost)
    values (v_order_id, v_prod.id, v_var.id, v_prod.name, coalesce(v_colour, v_var.colour_id), v_var.size, v_qty, v_prod.selling_price, v_prod.purchase_cost);
    v_subtotal := v_subtotal + v_prod.selling_price * v_qty;
    v_mrp := v_mrp + greatest(v_prod.mrp, v_prod.selling_price) * v_qty;
  end loop;

  if v_subtotal < v_zone.minimum_order then raise exception 'Minimum order for this area is ₹%.', v_zone.minimum_order; end if;
  v_fee := v_zone.delivery_fee;
  v_total := v_subtotal + v_fee;
  v_cod_max := coalesce((select (value)::text::numeric from public.app_settings where key = 'cod_max_order'), 5000);
  if v_total > v_cod_max then raise exception 'Cash on Delivery is available for orders up to ₹%.', v_cod_max; end if;

  update public.orders set subtotal = v_subtotal, mrp_total = v_mrp, discount = v_mrp - v_subtotal, delivery_fee = v_fee, total_amount = v_total
   where id = v_order_id;
  insert into public.order_status_history (order_id, status, changed_by) values (v_order_id, 'placed', v_uid);
  insert into public.notifications (user_id, title, message)
  values (v_uid, 'Order placed', 'Your order ' || (select order_number from public.orders where id = v_order_id) || ' has been placed.');
  return public.order_json(v_order_id);
end $$;

create or replace function public.restock_order(p_order_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.product_variants v set stock_quantity = v.stock_quantity + i.quantity
  from public.order_items i where i.order_id = p_order_id and i.variant_id = v.id;
$$;

create or replace function public.cancel_my_order(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_o public.orders;
begin
  select * into v_o from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_o.order_status not in ('placed', 'confirmed') then raise exception 'This order can no longer be cancelled.'; end if;
  update public.orders set order_status = 'cancelled' where id = p_order_id;
  perform public.restock_order(p_order_id);
  insert into public.order_status_history (order_id, status, changed_by, note) values (p_order_id, 'cancelled', auth.uid(), 'Cancelled by customer');
  return public.order_json(p_order_id);
end $$;

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_o public.orders;
  v_allowed text[];
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select * into v_o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  v_allowed := case v_o.order_status
    when 'placed' then array['confirmed', 'cancelled']
    when 'confirmed' then array['packed', 'cancelled']
    when 'packed' then array['out_for_delivery', 'cancelled']
    when 'out_for_delivery' then array['delivered', 'delivery_failed']
    when 'delivery_failed' then array['out_for_delivery', 'cancelled']
    when 'delivered' then array['returned']
    when 'returned' then array['refunded']
    else array[]::text[] end;
  if not (p_status = any (v_allowed)) then
    raise exception 'Cannot move an order from % to %.', v_o.order_status, p_status;
  end if;
  update public.orders set order_status = p_status,
    payment_status = case when p_status = 'delivered' and payment_method = 'cod' then 'paid'
                          when p_status = 'refunded' then 'refunded' else payment_status end
   where id = p_order_id;
  if p_status in ('cancelled', 'returned') then perform public.restock_order(p_order_id); end if;
  insert into public.order_status_history (order_id, status, changed_by, note) values (p_order_id, p_status, auth.uid(), p_note);
  insert into public.notifications (user_id, title, message)
  values (v_o.user_id, 'Order ' || v_o.order_number, 'Status: ' || replace(initcap(replace(p_status, '_', ' ')), 'For', 'for'));
  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'set_status', 'order', p_order_id::text, jsonb_build_object('from', v_o.order_status, 'to', p_status, 'note', p_note));
  return public.order_json(p_order_id);
end $$;

create or replace function public.admin_set_stock(p_variant_id text, p_stock int) returns void
language plpgsql security definer set search_path = public as $$
declare v_old int;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if p_stock < 0 then raise exception 'Stock cannot be negative.'; end if;
  select stock_quantity into v_old from public.product_variants where id = p_variant_id for update;
  if not found then raise exception 'Variant not found.'; end if;
  update public.product_variants set stock_quantity = p_stock where id = p_variant_id;
  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'set_stock', 'variant', p_variant_id, jsonb_build_object('from', v_old, 'to', p_stock));
end $$;

/** Dashboard numbers from real stored orders only. */
create or replace function public.admin_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  select jsonb_build_object(
    'todayOrders', count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'),
    'todaySales', coalesce(sum(total_amount) filter (where order_status <> 'cancelled' and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'), 0),
    'pending', count(*) filter (where order_status in ('placed', 'confirmed', 'packed')),
    'outForDelivery', count(*) filter (where order_status = 'out_for_delivery'),
    'completed', count(*) filter (where order_status = 'delivered'),
    'cancelled', count(*) filter (where order_status = 'cancelled'),
    'revenue', coalesce(sum(total_amount) filter (where order_status = 'delivered'), 0),
    'lowStock', (select count(*) from public.product_variants where is_active and stock_quantity <= 2)
  ) into v from public.orders;
  return v;
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.place_order(jsonb, uuid, text, text) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_set_order_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_stock(text, int) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.order_json(uuid) to authenticated;
revoke execute on function public.restock_order(uuid) from authenticated;

-- Live order updates for the admin app and customer tracking
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders, public.order_status_history;
  end if;
end $$;
