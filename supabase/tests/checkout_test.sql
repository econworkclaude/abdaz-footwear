-- Behaviour tests for checkout, stock, RLS and admin functions. Run after shim + migration + seed.
\set ON_ERROR_STOP 1
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage on all sequences in schema public to authenticated;
insert into auth.users (id, phone) values ('11111111-1111-1111-1111-111111111111', '919876543210'), ('22222222-2222-2222-2222-222222222222', '919000000000'), ('33333333-3333-3333-3333-333333333333', null);
update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into public.addresses (id, full_name, phone, house, street, area, city, state, pincode) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'Asha', '9876543210', '12A', 'GST Road', 'Chromepet', 'Chennai', 'Tamil Nadu', '600044'),
 ('aaaaaaaa-0000-0000-0000-000000000002', 'Asha', '9876543210', '5', 'OMR', 'Medavakkam', 'Chennai', 'Tamil Nadu', '600100');

-- 1. COD order: price & stock come from DB
select public.place_order('[{"variantId":"p1-bw-7","quantity":2,"unitPrice":1}]', 'aaaaaaaa-0000-0000-0000-000000000001', 'cod', 'key-00000001') as o \gset
select (:'o'::jsonb->>'total')::numeric = 699*2+60 as total_ok, :'o'::jsonb->>'orderNumber' as num;
-- 2. idempotent replay returns same order
select (public.place_order('[{"variantId":"p1-bw-7","quantity":2}]', 'aaaaaaaa-0000-0000-0000-000000000001', 'cod', 'key-00000001')->>'id') = (:'o'::jsonb->>'id') as idempotent_ok;
select count(*) = 1 as one_order from public.orders;
-- 3. unserviceable zone refused
do $$ begin perform public.place_order('[{"variantId":"p1-bw-7","quantity":1}]', 'aaaaaaaa-0000-0000-0000-000000000002', 'cod', 'key-00000002'); raise exception 'FAIL zone'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'zone refused ok: %', sqlerrm; end $$;
-- 4. oversell refused
do $$ begin perform public.place_order('[{"variantId":"p1-bw-7","quantity":10}]', 'aaaaaaaa-0000-0000-0000-000000000001', 'cod', 'key-00000003'); raise exception 'FAIL stock'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'oversell refused ok: %', sqlerrm; end $$;
-- 5. UPI refused
do $$ begin perform public.place_order('[{"variantId":"p1-bw-7","quantity":1}]', 'aaaaaaaa-0000-0000-0000-000000000001', 'upi', 'key-00000004'); raise exception 'FAIL upi'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'upi refused ok: %', sqlerrm; end $$;
-- 6. customer cannot insert orders directly or change prices or use admin functions
do $$ begin insert into public.orders (user_id, idempotency_key, address_snapshot, subtotal, mrp_total, total_amount, payment_method, eta_minutes) values (auth.uid(), 'hack-0001', '{}', 1, 1, 1, 'cod', 1); raise exception 'FAIL insert'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'direct insert refused ok'; end $$;
update public.products set selling_price = 1 where id = 'p1';
do $$ begin perform public.admin_set_stock('p1-bw-7', 99); raise exception 'FAIL admin'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'admin fn refused ok'; end $$;
do $$ begin update public.profiles set role = 'admin' where id = auth.uid(); raise exception 'FAIL role'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'role escalation refused ok'; end $$;

-- 7. another customer cannot see the order or the address
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select count(*) = 0 as other_cannot_see_orders from public.orders;
select count(*) = 0 as other_cannot_see_address from public.addresses;
-- anon cannot place order
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
do $$ begin perform public.place_order('[]', null, 'cod', 'key-anon-01'); raise exception 'FAIL anon'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'anon refused ok: %', sqlerrm; end $$;

-- 8. admin flow
reset role; set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
select count(*) = 1 as admin_sees_order from public.orders;
select public.admin_set_order_status((:'o'::jsonb->>'id')::uuid, 'confirmed')->>'status' as s1;
do $$ begin perform public.admin_set_order_status((select id from public.orders limit 1), 'delivered'); raise exception 'FAIL transition'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'bad transition refused ok: %', sqlerrm; end $$;
select public.admin_set_order_status((:'o'::jsonb->>'id')::uuid, 'cancelled')->>'status' as s2;
select (select stock_quantity from public.product_variants where id = 'p1-bw-7') as stock_after_cancel_restock;
select (select selling_price from public.products where id = 'p1') = 699 as price_untouched_by_customer;
select public.admin_dashboard();
reset role;
\echo ALL CHECKOUT TESTS PASSED
