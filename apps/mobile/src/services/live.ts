/** LIVE backend: Supabase. Prices, stock and order totals are computed in Postgres (see supabase/migrations). */
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config';
import { safeStorage } from '@/services/storage';
import type { Address, CartItem, Catalog, CategorySlug, Dashboard, DeliveryZone, Order, OrderStatus, PaymentMethod, Product, Session, Settings } from '@/types';

let client: SupabaseClient | null = null;
export function sb() {
  if (!client)
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage: safeStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check<T = any>(r: { data: any; error: { message: string } | null }): T {
  if (r.error) throw new Error(cleanError(r.error.message));
  return r.data as T;
}
const cleanError = (m: string) => m.replace(/^.*?ERROR:\s*/, '');

type Row = Record<string, any>;
const toProduct = (r: Row): Product => ({
  id: r.id, name: r.name, sku: r.sku, categorySlug: r.category_slug as CategorySlug, style: r.style,
  sellingPrice: Number(r.selling_price), mrp: Number(r.mrp), purchaseCost: Number(r.purchase_cost ?? 0),
  description: r.description, material: r.material, sole: r.sole, fit: r.fit, care: r.care,
  colours: r.colours ?? [], isFeatured: r.is_featured, isActive: r.is_active, createdAt: r.created_at,
});
const toZone = (r: Row): DeliveryZone => ({
  id: r.id, name: r.name, areas: r.areas, pincodes: r.pincodes, deliveryFee: Number(r.delivery_fee),
  etaMinutes: r.estimated_delivery_minutes, minimumOrder: Number(r.minimum_order), isActive: r.is_active,
});
const toAddress = (r: Row): Address => ({
  id: r.id, fullName: r.full_name, phone: r.phone, house: r.house, street: r.street, area: r.area, landmark: r.landmark,
  city: r.city, state: r.state, pincode: r.pincode, type: r.address_type, isDefault: r.is_default,
});
const toOrder = (j: Row): Order => ({
  ...(j as Order),
  subtotal: Number(j.subtotal), mrpTotal: Number(j.mrpTotal), discount: Number(j.discount), deliveryFee: Number(j.deliveryFee),
  taxAmount: Number(j.taxAmount), total: Number(j.total),
  items: (j.items ?? []).map((i: Row) => ({ ...i, unitPrice: Number(i.unitPrice) })),
});

const SETTING_KEYS: Record<keyof Settings, string> = {
  codEnabled: 'cod_enabled', codMaxOrder: 'cod_max_order', upiConfigured: 'upi_configured',
  whatsappNumber: 'whatsapp_number', supportPhone: 'support_phone', exchangeWindowDays: 'exchange_window_days',
};

async function orderIds(q: any): Promise<Order[]> {
  const rows = check<Row[]>(await q);
  const out = await Promise.all(rows.map(async (r) => check<Row>(await sb().rpc('order_json', { p_order_id: r.id }))));
  return out.filter(Boolean).map(toOrder);
}

export const live = {
  // ───────────── auth ─────────────
  async session(): Promise<Session | null> {
    const { data } = await sb().auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    const p = (await sb().from('profiles').select('*').eq('id', u.id).maybeSingle()).data as Row | null;
    return { userId: u.id, phone: u.phone ? '+' + u.phone.replace(/^\+/, '') : null, email: u.email ?? null, name: p?.full_name ?? '', role: p?.role ?? 'customer' };
  },
  async requestOtp(target: { phone?: string; email?: string }) {
    if (target.phone) check(await sb().auth.signInWithOtp({ phone: target.phone }));
    else check(await sb().auth.signInWithOtp({ email: target.email!, options: { shouldCreateUser: true } }));
  },
  async verifyOtp(target: { phone?: string; email?: string }, token: string) {
    if (target.phone) check(await sb().auth.verifyOtp({ phone: target.phone, token, type: 'sms' }));
    else check(await sb().auth.verifyOtp({ email: target.email!, token, type: 'email' }));
  },
  async passwordSignIn(email: string, password: string) {
    check(await sb().auth.signInWithPassword({ email, password }));
  },
  async signOut() {
    await sb().auth.signOut();
  },
  async updateName(userId: string, name: string) {
    check(await sb().from('profiles').update({ full_name: name }).eq('id', userId));
  },

  // ───────────── catalogue ─────────────
  async catalog(): Promise<Catalog> {
    const [cats, prods, vars, zones, sets] = await Promise.all([
      sb().from('categories').select('*').order('sort_order'),
      sb().from('products').select('*').order('created_at', { ascending: false }),
      sb().from('product_variants').select('*').eq('is_active', true),
      sb().from('delivery_zones').select('*'),
      sb().from('app_settings').select('*'),
    ]);
    const settingsRows = check<Row[]>(sets as any);
    const get = (k: string) => settingsRows.find((r) => r.key === k)?.value;
    return {
      categories: check<Row[]>(cats as any).map((c) => ({ slug: c.slug, name: c.name, isActive: c.is_active })),
      products: check<Row[]>(prods as any).map(toProduct),
      variants: check<Row[]>(vars as any).map((v) => ({ id: v.id, productId: v.product_id, colourId: v.colour_id, size: v.size, stock: v.stock_quantity })),
      zones: check<Row[]>(zones as any).map(toZone),
      settings: {
        codEnabled: get('cod_enabled') ?? true, codMaxOrder: Number(get('cod_max_order') ?? 5000), upiConfigured: !!get('upi_configured'),
        whatsappNumber: get('whatsapp_number') ?? '', supportPhone: get('support_phone') ?? '', exchangeWindowDays: Number(get('exchange_window_days') ?? 7),
      },
    };
  },

  // ───────────── addresses ─────────────
  async addresses() {
    return check<Row[]>(await sb().from('addresses').select('*').order('created_at')).map(toAddress);
  },
  async saveAddress(a: Address) {
    const row = { full_name: a.fullName, phone: a.phone, house: a.house, street: a.street, area: a.area, landmark: a.landmark, city: a.city, state: a.state, pincode: a.pincode, address_type: a.type, is_default: a.isDefault };
    if (a.isDefault) {
      const { data } = await sb().auth.getUser();
      await sb().from('addresses').update({ is_default: false }).eq('user_id', data.user?.id ?? '');
    }
    const r = a.id ? await sb().from('addresses').update(row).eq('id', a.id).select().single() : await sb().from('addresses').insert(row).select().single();
    return toAddress(check<Row>(r as any));
  },
  async deleteAddress(id: string) {
    check(await sb().from('addresses').delete().eq('id', id));
  },

  // ───────────── orders ─────────────
  async placeOrder(args: { items: CartItem[]; addressId: string; paymentMethod: PaymentMethod; idempotencyKey: string }) {
    const r = await sb().rpc('place_order', { p_items: args.items, p_address_id: args.addressId, p_payment_method: args.paymentMethod, p_idempotency_key: args.idempotencyKey });
    return toOrder(check<Row>(r));
  },
  async myOrders() {
    const { data } = await sb().auth.getUser();
    return orderIds(sb().from('orders').select('id').eq('user_id', data.user?.id ?? '').order('created_at', { ascending: false }).limit(50));
  },
  async order(id: string) {
    const j = check<Row | null>(await sb().rpc('order_json', { p_order_id: id }));
    if (!j) throw new Error('Order not found.');
    return toOrder(j);
  },
  async cancelMyOrder(id: string) {
    return toOrder(check<Row>(await sb().rpc('cancel_my_order', { p_order_id: id })));
  },

  // ───────────── admin ─────────────
  async adminOrders() {
    return orderIds(sb().from('orders').select('id').order('created_at', { ascending: false }).limit(100));
  },
  async adminSetStatus(id: string, status: OrderStatus, note?: string) {
    return toOrder(check<Row>(await sb().rpc('admin_set_order_status', { p_order_id: id, p_status: status, p_note: note ?? null })));
  },
  async adminDashboard(): Promise<Dashboard> {
    const d = check<Row>(await sb().rpc('admin_dashboard'));
    return { ...(d as Dashboard), todaySales: Number(d.todaySales), revenue: Number(d.revenue) };
  },
  async adminSetStock(variantId: string, stock: number) {
    check(await sb().rpc('admin_set_stock', { p_variant_id: variantId, p_stock: stock }));
  },
  async adminSaveProduct(p: Product, sizes: number[]) {
    const row = {
      name: p.name, sku: p.sku, category_slug: p.categorySlug, style: p.style, description: p.description, material: p.material, sole: p.sole,
      fit: p.fit, care: p.care, purchase_cost: p.purchaseCost ?? 0, selling_price: p.sellingPrice, mrp: p.mrp, is_featured: p.isFeatured,
      is_active: p.isActive !== false, colours: p.colours,
    };
    const r = p.id ? await sb().from('products').update(row).eq('id', p.id).select().single() : await sb().from('products').insert(row).select().single();
    const saved = toProduct(check<Row>(r as any));
    const variants = saved.colours.flatMap((c) => sizes.map((size) => ({ id: `${saved.id}-${c.id}-${size}`, product_id: saved.id, colour_id: c.id, size, stock_quantity: 0 })));
    if (variants.length) check(await sb().from('product_variants').upsert(variants, { onConflict: 'id', ignoreDuplicates: true }));
    return saved;
  },
  async adminSaveZone(z: DeliveryZone) {
    check(await sb().from('delivery_zones').update({ delivery_fee: z.deliveryFee, estimated_delivery_minutes: z.etaMinutes, minimum_order: z.minimumOrder, is_active: z.isActive }).eq('id', z.id));
  },
  async adminSaveSettings(s: Settings) {
    const rows = (Object.keys(SETTING_KEYS) as (keyof Settings)[]).map((k) => ({ key: SETTING_KEYS[k], value: s[k] }));
    check(await sb().from('app_settings').upsert(rows));
  },
  subscribeOrders(onChange: () => void) {
    const ch = sb().channel('orders-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange).subscribe();
    return () => {
      sb().removeChannel(ch);
    };
  },
};
