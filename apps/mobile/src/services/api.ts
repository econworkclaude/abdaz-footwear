/** Single entry point the screens use. Routes to Supabase (live) or the on-device demo database. */
import { IS_LIVE } from '@/config';
import { demo } from '@/services/demoDb';
import { live } from '@/services/live';
import { useSession } from '@/stores/session';
import type { Address, CartItem, OrderStatus, PaymentMethod, Product, Settings, DeliveryZone } from '@/types';

export const api = {
  catalog: () => (IS_LIVE ? live.catalog() : demo.catalog()),
  addresses: () => (IS_LIVE ? live.addresses() : demo.addresses()),
  saveAddress: (a: Address) => (IS_LIVE ? live.saveAddress(a) : demo.saveAddress(a)),
  deleteAddress: (id: string) => (IS_LIVE ? live.deleteAddress(id) : demo.deleteAddress(id)),
  placeOrder: (a: { items: CartItem[]; addressId: string; paymentMethod: PaymentMethod; idempotencyKey: string }) =>
    IS_LIVE ? live.placeOrder(a) : demo.placeOrder({ ...a, customerPhone: useSession.getState().session?.phone ?? null }),
  myOrders: () => (IS_LIVE ? live.myOrders() : demo.myOrders()),
  order: (id: string) => (IS_LIVE ? live.order(id) : demo.order(id)),
  cancelMyOrder: (id: string) => (IS_LIVE ? live.cancelMyOrder(id) : demo.cancelMyOrder(id)),
  adminOrders: () => (IS_LIVE ? live.adminOrders() : demo.adminOrders()),
  adminSetStatus: (id: string, s: OrderStatus, note?: string) => (IS_LIVE ? live.adminSetStatus(id, s, note) : demo.adminSetStatus(id, s)),
  adminDashboard: () => (IS_LIVE ? live.adminDashboard() : demo.adminDashboard()),
  adminSetStock: (variantId: string, n: number) => (IS_LIVE ? live.adminSetStock(variantId, n) : demo.adminSetStock(variantId, n)),
  adminSaveProduct: (p: Product, sizes: number[]) => (IS_LIVE ? live.adminSaveProduct(p, sizes) : demo.adminSaveProduct(p, sizes)),
  adminSaveZone: (z: DeliveryZone) => (IS_LIVE ? live.adminSaveZone(z) : demo.adminSaveZone(z)),
  adminSaveSettings: (s: Settings) => (IS_LIVE ? live.adminSaveSettings(s) : demo.adminSaveSettings(s)),
};
