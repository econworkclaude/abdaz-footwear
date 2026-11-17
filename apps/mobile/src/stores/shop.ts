/** Device-only shopping state: onboarding flag, bag, wishlist and the chosen delivery address. */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/services/storage';
import type { CartItem, OrderStatus } from '@/types';

interface ShopState {
  onboarded: boolean;
  cart: CartItem[];
  wishlist: string[];
  selectedAddressId: string | null;
  recentSearches: string[];
  finishOnboarding: () => void;
  addToCart: (variantId: string, stock: number, qty?: number) => { ok: boolean; message: string };
  setQty: (variantId: string, qty: number, stock: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  selectAddress: (id: string | null) => void;
  addSearch: (q: string) => void;
  clearSearches: () => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      cart: [],
      wishlist: [],
      selectedAddressId: null,
      recentSearches: [],
      finishOnboarding: () => set({ onboarded: true }),
      addToCart: (variantId, stock, qty = 1) => {
        if (stock <= 0) return { ok: false, message: 'This size is out of stock.' };
        const existing = get().cart.find((c) => c.variantId === variantId);
        const next = (existing?.quantity ?? 0) + qty;
        if (next > stock) return { ok: false, message: `Only ${stock} left in this size.` };
        set({ cart: existing ? get().cart.map((c) => (c.variantId === variantId ? { ...c, quantity: next } : c)) : [...get().cart, { variantId, quantity: qty }] });
        return { ok: true, message: 'Added to bag' };
      },
      setQty: (variantId, qty, stock) => {
        const capped = Math.max(1, Math.min(qty, Math.max(stock, 1), 10));
        set({ cart: get().cart.map((c) => (c.variantId === variantId ? { ...c, quantity: capped } : c)) });
      },
      removeFromCart: (variantId) => set({ cart: get().cart.filter((c) => c.variantId !== variantId) }),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(id) ? w.filter((x) => x !== id) : [...w, id] });
      },
      selectAddress: (id) => set({ selectedAddressId: id }),
      addSearch: (q) => {
        const t = q.trim();
        if (t.length < 2) return;
        set({ recentSearches: [t, ...get().recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6) });
      },
      clearSearches: () => set({ recentSearches: [] }),
    }),
    { name: 'abdaz-shop-v2', storage: createJSONStorage(() => safeStorage) },
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
export const ORDER_FLOW: OrderStatus[] = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
