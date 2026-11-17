/**
 * DEMO "database" kept on the device. It mirrors the Supabase functions
 * (place_order, admin_set_order_status, ...) so both modes behave the same.
 * Never used when Supabase keys are configured.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { categories, products, settings, variants, zones } from '@/data/demo';
import { findZoneForAddress, formatOrderNumber, priceCart, validateAddress } from '@/services/rules';
import { safeStorage } from '@/services/storage';
import type { Address, CartItem, Catalog, Dashboard, DeliveryZone, Order, OrderStatus, PaymentMethod, Product, Settings, Variant } from '@/types';

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivery_failed: ['out_for_delivery', 'cancelled'],
  delivered: ['returned'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
};

interface DemoDb {
  catalog: Catalog;
  orders: Order[];
  addresses: Address[];
  orderSeq: number;
  keys: Record<string, string>;
  seededAdmin: boolean;
}

const fresh = (): DemoDb => ({
  catalog: {
    categories,
    products: products.map((p) => ({ ...p, isActive: true, purchaseCost: Math.round(p.sellingPrice * 0.55) })),
    variants,
    zones,
    settings,
  },
  orders: [],
  addresses: [],
  orderSeq: 0,
  keys: {},
  seededAdmin: false,
});

export const useDemoDb = create<DemoDb>()(persist(fresh, { name: 'abdaz-demo-db-v2', storage: createJSONStorage(() => safeStorage) }));

const db = () => useDemoDb.getState();
const put = (patch: Partial<DemoDb>) => useDemoDb.setState(patch);
const now = () => new Date().toISOString();
const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
export const DEMO_USER = 'demo-customer';

export async function waitForDemoDb() {
  if (useDemoDb.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsub = useDemoDb.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    setTimeout(resolve, 2500);
  });
}

export const demo = {
  async catalog(): Promise<Catalog> {
    await waitForDemoDb();
    return clone(db().catalog);
  },

  async addresses() {
    await waitForDemoDb();
    return clone(db().addresses);
  },
  async saveAddress(a: Address) {
    const e = validateAddress(a);
    if (Object.keys(e).length) throw new Error(Object.values(e)[0]);
    let list = db().addresses.filter((x) => x.id !== a.id);
    const saved = { ...a, id: a.id || `addr-${Date.now()}`, isDefault: a.isDefault || list.length === 0 };
    if (saved.isDefault) list = list.map((x) => ({ ...x, isDefault: false }));
    put({ addresses: [...list, saved] });
    return saved;
  },
  async deleteAddress(id: string) {
    const list = db().addresses.filter((x) => x.id !== id);
    if (list.length && !list.some((x) => x.isDefault)) list[0] = { ...list[0], isDefault: true };
    put({ addresses: list });
  },

  async placeOrder(args: { items: CartItem[]; addressId: string; paymentMethod: PaymentMethod; idempotencyKey: string; customerPhone: string | null }) {
    await wait(800);
    const s = db();
    const existing = s.keys[args.idempotencyKey];
    if (existing) {
      const o = s.orders.find((x) => x.id === existing);
      if (o) return clone(o);
    }
    const address = s.addresses.find((a) => a.id === args.addressId);
    if (!address) throw new Error('Please add a delivery address.');
    if (Object.keys(validateAddress(address)).length) throw new Error('Your address is incomplete. Please edit it.');
    const zc = findZoneForAddress(s.catalog.zones, address.area, address.pincode);
    if (!zc.serviceable) throw new Error(zc.reason);
    if (args.paymentMethod !== 'cod') throw new Error('Only Cash on Delivery is available right now.');
    if (!s.catalog.settings.codEnabled) throw new Error('Cash on Delivery is paused right now.');
    const vmap = new Map(s.catalog.variants.map((v) => [v.id, v]));
    const pmap = new Map(s.catalog.products.filter((p) => p.isActive !== false).map((p) => [p.id, p]));
    const { lines, quote, problems } = priceCart(args.items, vmap, pmap, zc.zone);
    if (!lines.length) throw new Error('Your bag is empty.');
    if (problems.length) throw new Error(problems[0]);
    if (quote.total > s.catalog.settings.codMaxOrder) throw new Error(`Cash on Delivery is available for orders up to ₹${s.catalog.settings.codMaxOrder}.`);
    const seq = s.orderSeq + 1;
    const order: Order = {
      id: `demo-${Date.now()}`,
      orderNumber: formatOrderNumber(seq),
      items: lines.map((l) => ({
        productId: l.product.id,
        variantId: l.variant.id,
        productName: l.product.name,
        colourName: l.product.colours.find((c) => c.id === l.variant.colourId)?.name ?? '',
        size: l.variant.size,
        quantity: l.item.quantity,
        unitPrice: l.product.sellingPrice,
      })),
      address,
      ...quote,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'placed',
      history: [{ status: 'placed', at: now() }],
      etaMinutes: zc.zone.etaMinutes,
      createdAt: now(),
      userId: DEMO_USER,
      customerPhone: args.customerPhone,
    };
    const qty = new Map(lines.map((l) => [l.variant.id, l.item.quantity]));
    put({
      orders: [order, ...s.orders],
      orderSeq: seq,
      keys: { ...s.keys, [args.idempotencyKey]: order.id },
      catalog: { ...s.catalog, variants: s.catalog.variants.map((v) => (qty.has(v.id) ? { ...v, stock: v.stock - qty.get(v.id)! } : v)) },
    });
    return clone(order);
  },

  async myOrders() {
    await waitForDemoDb();
    return clone(db().orders.filter((o) => o.userId === DEMO_USER));
  },
  async order(id: string) {
    await waitForDemoDb();
    const o = db().orders.find((x) => x.id === id);
    if (!o) throw new Error('Order not found.');
    return clone(o);
  },
  async cancelMyOrder(id: string) {
    const o = db().orders.find((x) => x.id === id);
    if (!o || !['placed', 'confirmed'].includes(o.status)) throw new Error('This order can no longer be cancelled.');
    return setStatus(id, 'cancelled');
  },

  // ───────────── admin ─────────────
  async adminOrders() {
    await waitForDemoDb();
    seedAdminDemo();
    return clone(db().orders);
  },
  async adminSetStatus(id: string, status: OrderStatus) {
    await wait(250);
    return setStatus(id, status);
  },
  async adminDashboard(): Promise<Dashboard> {
    await waitForDemoDb();
    seedAdminDemo();
    const os = db().orders;
    const today = new Date().toDateString();
    const isToday = (o: Order) => new Date(o.createdAt).toDateString() === today;
    return {
      todayOrders: os.filter(isToday).length,
      todaySales: os.filter((o) => isToday(o) && o.status !== 'cancelled').reduce((n, o) => n + o.total, 0),
      pending: os.filter((o) => ['placed', 'confirmed', 'packed'].includes(o.status)).length,
      outForDelivery: os.filter((o) => o.status === 'out_for_delivery').length,
      completed: os.filter((o) => o.status === 'delivered').length,
      cancelled: os.filter((o) => o.status === 'cancelled').length,
      revenue: os.filter((o) => o.status === 'delivered').reduce((n, o) => n + o.total, 0),
      lowStock: db().catalog.variants.filter((v) => v.stock <= 2).length,
    };
  },
  async adminSetStock(variantId: string, stock: number) {
    if (stock < 0 || !Number.isInteger(stock)) throw new Error('Stock must be a whole number, 0 or more.');
    const c = db().catalog;
    put({ catalog: { ...c, variants: c.variants.map((v) => (v.id === variantId ? { ...v, stock } : v)) } });
  },
  async adminSaveProduct(p: Product, sizes: number[]) {
    const c = db().catalog;
    if (!p.name.trim() || p.sellingPrice <= 0 || p.mrp <= 0) throw new Error('Name, price and MRP are required.');
    if (c.products.some((x) => x.sku === p.sku && x.id !== p.id)) throw new Error('That SKU is already used.');
    const id = p.id || `p-${Date.now()}`;
    const saved = { ...p, id };
    const exists = c.products.some((x) => x.id === id);
    const newVariants: Variant[] = saved.colours.flatMap((col) =>
      sizes.map((size) => ({ id: `${id}-${col.id}-${size}`, productId: id, colourId: col.id, size, stock: 0 })),
    );
    const known = new Set(c.variants.map((v) => v.id));
    put({
      catalog: {
        ...c,
        products: exists ? c.products.map((x) => (x.id === id ? saved : x)) : [saved, ...c.products],
        variants: [...c.variants, ...newVariants.filter((v) => !known.has(v.id))],
      },
    });
    return saved;
  },
  async adminSaveZone(z: DeliveryZone) {
    const c = db().catalog;
    put({ catalog: { ...c, zones: c.zones.map((x) => (x.id === z.id ? z : x)) } });
  },
  async adminSaveSettings(st: Settings) {
    const c = db().catalog;
    put({ catalog: { ...c, settings: st } });
  },
  reset() {
    useDemoDb.setState(fresh());
  },
};

function setStatus(id: string, status: OrderStatus) {
  const o = db().orders.find((x) => x.id === id);
  if (!o) throw new Error('Order not found.');
  if (!TRANSITIONS[o.status].includes(status)) throw new Error(`Cannot move an order from ${o.status} to ${status}.`);
  const updated: Order = {
    ...o,
    status,
    paymentStatus: status === 'delivered' ? 'paid' : o.paymentStatus,
    history: [...o.history, { status, at: now() }],
  };
  const c = db().catalog;
  const restock = status === 'cancelled' || status === 'returned';
  const qty = new Map(o.items.map((i) => [i.variantId, i.quantity]));
  put({
    orders: db().orders.map((x) => (x.id === id ? updated : x)),
    catalog: restock ? { ...c, variants: c.variants.map((v) => (qty.has(v.id) ? { ...v, stock: v.stock + qty.get(v.id)! } : v)) } : c,
  });
  return clone(updated);
}

/** The admin app on its own has no customers, so in DEMO mode it starts with three sample orders. */
function seedAdminDemo() {
  const s = db();
  if (s.seededAdmin || s.orders.length) return put({ seededAdmin: true });
  const addr: Address = { id: 'demo-addr', fullName: 'Sample Customer', phone: '9876543210', house: '12A', street: 'GST Road', area: 'Chromepet', landmark: 'Chromepet bus stand', city: 'Chennai', state: 'Tamil Nadu', pincode: '600044', type: 'Home', isDefault: true };
  const mk = (n: number, pid: string, col: string, size: number, qty: number, status: OrderStatus, minsAgo: number): Order => {
    const p = s.catalog.products.find((x) => x.id === pid)!;
    const at = (m: number) => new Date(Date.now() - m * 60000).toISOString();
    const flow: OrderStatus[] = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
    const hist = flow.slice(0, flow.indexOf(status) + 1).map((st, i) => ({ status: st, at: at(minsAgo - i * 12) }));
    const sub = p.sellingPrice * qty;
    return {
      id: `demo-seed-${n}`, orderNumber: formatOrderNumber(n),
      items: [{ productId: pid, variantId: `${pid}-${col}-${size}`, productName: p.name, colourName: p.colours.find((c) => c.id === col)!.name, size, quantity: qty, unitPrice: p.sellingPrice }],
      address: addr, subtotal: sub, mrpTotal: p.mrp * qty, discount: (p.mrp - p.sellingPrice) * qty, deliveryFee: 60, taxAmount: 0, total: sub + 60,
      paymentMethod: 'cod', paymentStatus: status === 'delivered' ? 'paid' : 'pending', status, history: hist, etaMinutes: 120,
      createdAt: at(minsAgo), userId: 'demo-sample', customerPhone: '+919876543210',
    };
  };
  put({ seededAdmin: true, orderSeq: 3, orders: [mk(3, 'p8', 'wg', 8, 1, 'placed', 8), mk(2, 'p3', 'nb', 9, 1, 'packed', 70), mk(1, 'p1', 'bw', 8, 2, 'delivered', 300)] });
}
