import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { products, variants as baseVariants, zones } from '@/data/demo';
import { findZoneForAddress, formatOrderNumber, priceCart, validateAddress } from '@/services/rules';
import type { Address, CartItem, Order, OrderStatus, PaymentMethod, Variant } from '@/types';

/** AsyncStorage, falling back to memory where storage is blocked (e.g. sandboxed web preview). */
const mem = new Map<string, string>();
const safeStorage = {
  getItem: async (k: string) => {
    try {
      return await AsyncStorage.getItem(k);
    } catch {
      return mem.get(k) ?? null;
    }
  },
  setItem: async (k: string, v: string) => {
    mem.set(k, v);
    try {
      await AsyncStorage.setItem(k, v);
    } catch {}
  },
  removeItem: async (k: string) => {
    mem.delete(k);
    try {
      await AsyncStorage.removeItem(k);
    } catch {}
  },
};

export const productsById = new Map(products.map((p) => [p.id, p]));

interface ShopState {
  onboarded: boolean;
  phone: string | null; // signed-in (demo) customer
  name: string;
  cart: CartItem[];
  wishlist: string[];
  addresses: Address[];
  selectedAddressId: string | null;
  orders: Order[];
  sold: Record<string, number>; // demo inventory deductions per variant
  orderSeq: number;
  usedKeys: Record<string, string>; // idempotency key -> order id

  finishOnboarding: () => void;
  signIn: (phone: string) => void;
  signOut: () => void;
  setName: (n: string) => void;
  addToCart: (variantId: string, qty?: number) => { ok: boolean; message: string };
  setQty: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  toggleWishlist: (productId: string) => void;
  saveAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  placeOrder: (args: { paymentMethod: PaymentMethod; idempotencyKey: string }) => Promise<{ ok: true; order: Order } | { ok: false; error: string }>;
  demoAdvanceOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => { ok: boolean; message: string };
  resetDemo: () => void;
}

export function getVariantsById(sold: Record<string, number>) {
  return new Map<string, Variant>(baseVariants.map((v) => [v.id, { ...v, stock: Math.max(0, v.stock - (sold[v.id] ?? 0)) }]));
}

const FLOW: OrderStatus[] = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
const now = () => new Date().toISOString();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const initial = {
  onboarded: false,
  phone: null,
  name: '',
  cart: [],
  wishlist: [],
  addresses: [],
  selectedAddressId: null,
  orders: [],
  sold: {},
  orderSeq: 0,
  usedKeys: {},
};

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      ...initial,
      finishOnboarding: () => set({ onboarded: true }),
      signIn: (phone) => set({ phone }),
      signOut: () => set({ phone: null }),
      setName: (name) => set({ name }),

      addToCart: (variantId, qty = 1) => {
        const v = getVariantsById(get().sold).get(variantId);
        if (!v || v.stock <= 0) return { ok: false, message: 'This size is out of stock.' };
        const existing = get().cart.find((c) => c.variantId === variantId);
        const next = (existing?.quantity ?? 0) + qty;
        if (next > v.stock) return { ok: false, message: `Only ${v.stock} left in this size.` };
        set({
          cart: existing ? get().cart.map((c) => (c.variantId === variantId ? { ...c, quantity: next } : c)) : [...get().cart, { variantId, quantity: qty }],
        });
        return { ok: true, message: 'Added to bag' };
      },
      setQty: (variantId, qty) => {
        const v = getVariantsById(get().sold).get(variantId);
        const capped = Math.max(1, Math.min(qty, v?.stock ?? 1, 10));
        set({ cart: get().cart.map((c) => (c.variantId === variantId ? { ...c, quantity: capped } : c)) });
      },
      removeFromCart: (variantId) => set({ cart: get().cart.filter((c) => c.variantId !== variantId) }),
      toggleWishlist: (id) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(id) ? w.filter((x) => x !== id) : [...w, id] });
      },
      saveAddress: (a) => {
        let list = get().addresses.filter((x) => x.id !== a.id);
        if (a.isDefault || list.length === 0) list = list.map((x) => ({ ...x, isDefault: false }));
        const saved = { ...a, isDefault: a.isDefault || list.length === 0 };
        set({ addresses: [...list, saved], selectedAddressId: saved.id });
      },
      deleteAddress: (id) => {
        const list = get().addresses.filter((x) => x.id !== id);
        if (list.length && !list.some((x) => x.isDefault)) list[0] = { ...list[0], isDefault: true };
        set({ addresses: list, selectedAddressId: get().selectedAddressId === id ? (list[0]?.id ?? null) : get().selectedAddressId });
      },
      selectAddress: (id) => set({ selectedAddressId: id }),

      /** DEMO backend. Mirrors the server-side checkout steps from the spec. */
      placeOrder: async ({ paymentMethod, idempotencyKey }) => {
        await wait(900);
        const s = get();
        const existingId = s.usedKeys[idempotencyKey];
        if (existingId) {
          const o = s.orders.find((x) => x.id === existingId);
          if (o) return { ok: true, order: o };
        }
        if (!s.phone) return { ok: false, error: 'Please sign in to place your order.' };
        const address = s.addresses.find((a) => a.id === s.selectedAddressId);
        if (!address) return { ok: false, error: 'Please add a delivery address.' };
        if (Object.keys(validateAddress(address)).length) return { ok: false, error: 'Your address is incomplete. Please edit it.' };
        const zoneCheck = findZoneForAddress(zones, address.area, address.pincode);
        if (!zoneCheck.serviceable) return { ok: false, error: zoneCheck.reason };
        if (paymentMethod === 'upi') return { ok: false, error: 'UPI is not set up yet. Please choose Cash on Delivery.' };
        const vmap = getVariantsById(s.sold);
        const { lines, quote, problems } = priceCart(s.cart, vmap, productsById, zoneCheck.zone);
        if (!lines.length) return { ok: false, error: 'Your bag is empty.' };
        if (problems.length) return { ok: false, error: problems[0] };
        if (quote.total > 5000) return { ok: false, error: 'Cash on Delivery is available for orders up to ₹5,000.' };

        const seq = s.orderSeq + 1;
        const id = `demo-${Date.now()}`;
        const order: Order = {
          id,
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
          paymentMethod,
          paymentStatus: 'pending',
          status: 'placed',
          history: [{ status: 'placed', at: now() }],
          etaMinutes: zoneCheck.zone.etaMinutes,
          createdAt: now(),
          isDemo: true,
        };
        const sold = { ...s.sold };
        for (const l of lines) sold[l.variant.id] = (sold[l.variant.id] ?? 0) + l.item.quantity;
        set({ orders: [order, ...s.orders], sold, cart: [], orderSeq: seq, usedKeys: { ...s.usedKeys, [idempotencyKey]: id } });
        return { ok: true, order };
      },

      demoAdvanceOrder: (orderId) =>
        set({
          orders: get().orders.map((o) => {
            const i = FLOW.indexOf(o.status);
            if (i < 0 || i === FLOW.length - 1) return o;
            const status = FLOW[i + 1];
            return { ...o, status, paymentStatus: status === 'delivered' ? 'paid' : o.paymentStatus, history: [...o.history, { status, at: now() }] };
          }),
        }),

      cancelOrder: (orderId) => {
        const o = get().orders.find((x) => x.id === orderId);
        if (!o || !['placed', 'confirmed'].includes(o.status)) return { ok: false, message: 'This order can no longer be cancelled.' };
        const sold = { ...get().sold };
        for (const it of o.items) sold[it.variantId] = Math.max(0, (sold[it.variantId] ?? 0) - it.quantity);
        set({
          sold,
          orders: get().orders.map((x) => (x.id === orderId ? { ...x, status: 'cancelled', history: [...x.history, { status: 'cancelled', at: now() }] } : x)),
        });
        return { ok: true, message: 'Order cancelled' };
      },

      resetDemo: () => set({ ...initial, onboarded: true }),
    }),
    { name: 'abdaz-demo-v1', storage: createJSONStorage(() => safeStorage) },
  ),
);

export const statusLabel: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  confirmed: 'Order Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  delivery_failed: 'Delivery Failed',
  returned: 'Returned',
  refunded: 'Refunded',
};
export const ORDER_FLOW = FLOW;
