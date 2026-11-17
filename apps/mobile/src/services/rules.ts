/**
 * Pure business rules. In production these run server-side (Supabase function);
 * the demo backend calls the same functions so behaviour matches.
 */
import type { Address, CartItem, DeliveryZone, Product, Quote, Variant } from '@/types';

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function findZoneForAddress(zones: DeliveryZone[], area: string, pincode: string) {
  const a = norm(area);
  const zone = zones.find((z) => z.areas.some((x) => norm(x) === a));
  if (!zone) return { serviceable: false as const, zone: undefined, reason: 'Sorry, express delivery is not available at this location yet.' };
  if (!zone.isActive)
    return { serviceable: false as const, zone, reason: `${zone.areas.find((x) => norm(x) === a)} is planned for a later phase. Express delivery is not available here yet.` };
  if (pincode && !zone.pincodes.includes(pincode.trim()))
    return { serviceable: false as const, zone, reason: 'The pincode does not match this area. Please check your address.' };
  return { serviceable: true as const, zone, reason: '' };
}

export function discountPercent(p: Pick<Product, 'mrp' | 'sellingPrice'>) {
  if (!p.mrp || p.mrp <= p.sellingPrice) return 0;
  return Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
}

export interface PricedLine {
  item: CartItem;
  variant: Variant;
  product: Product;
  available: boolean;
}

export function priceCart(
  items: CartItem[],
  variantsById: Map<string, Variant>,
  productsById: Map<string, Product>,
  zone?: DeliveryZone,
): { lines: PricedLine[]; quote: Quote; problems: string[] } {
  const problems: string[] = [];
  const lines: PricedLine[] = [];
  let subtotal = 0;
  let mrpTotal = 0;
  let itemCount = 0;
  for (const item of items) {
    const variant = variantsById.get(item.variantId);
    const product = variant && productsById.get(variant.productId);
    if (!variant || !product) {
      problems.push('An item in your bag is no longer available.');
      continue;
    }
    const available = variant.stock >= item.quantity && item.quantity > 0;
    if (!available) problems.push(`${product.name} UK ${variant.size}: only ${variant.stock} left.`);
    lines.push({ item, variant, product, available });
    subtotal += product.sellingPrice * item.quantity;
    mrpTotal += Math.max(product.mrp, product.sellingPrice) * item.quantity;
    itemCount += item.quantity;
  }
  const deliveryFee = zone && itemCount > 0 ? zone.deliveryFee : 0;
  if (zone && subtotal < zone.minimumOrder) problems.push(`Minimum order for this area is ₹${zone.minimumOrder}.`);
  return {
    lines,
    problems,
    quote: { subtotal, mrpTotal, discount: mrpTotal - subtotal, deliveryFee, taxAmount: 0, total: subtotal + deliveryFee, itemCount },
  };
}

export const PHONE_RE = /^[6-9]\d{9}$/;
export const PIN_RE = /^6\d{5}$/;

export function validateAddress(a: Partial<Address>) {
  const e: Partial<Record<keyof Address, string>> = {};
  if (!a.fullName || a.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  if (!a.phone || !PHONE_RE.test(a.phone.trim())) e.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!a.house?.trim()) e.house = 'Enter house / flat number';
  if (!a.street?.trim()) e.street = 'Enter street';
  if (!a.area?.trim()) e.area = 'Select or enter your area';
  if (!a.city?.trim()) e.city = 'Enter city';
  if (!a.state?.trim()) e.state = 'Enter state';
  if (!a.pincode || !PIN_RE.test(a.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
  return e;
}

export const formatOrderNumber = (n: number) => 'AB' + String(n).padStart(6, '0');
