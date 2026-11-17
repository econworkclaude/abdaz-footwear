import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findZoneForAddress, formatOrderNumber, priceCart, validateAddress } from '../rules.ts';

const zones = [
  { id: 'a', name: 'A', isActive: true, deliveryFee: 60, etaMinutes: 120, minimumOrder: 0, areas: ['Hasthinapuram', 'Chromepet'], pincodes: ['600064', '600044'] },
  { id: 'c', name: 'C', isActive: false, deliveryFee: 100, etaMinutes: 150, minimumOrder: 0, areas: ['Medavakkam'], pincodes: ['600100'] },
];

test('serviceability: active zone area is serviceable', () => {
  assert.equal(findZoneForAddress(zones, ' chromepet ', '600044').serviceable, true);
});
test('serviceability: inactive zone and unknown area are refused', () => {
  assert.equal(findZoneForAddress(zones, 'Medavakkam', '600100').serviceable, false);
  assert.equal(findZoneForAddress(zones, 'Velachery', '600042').serviceable, false);
});
test('serviceability: wrong pincode for area is refused', () => {
  assert.equal(findZoneForAddress(zones, 'Chromepet', '600100').serviceable, false);
});

const product = { id: 'p1', name: 'Shoe', mrp: 999, sellingPrice: 699 } as any;
const variant = { id: 'v1', productId: 'p1', colourId: 'bw', size: 8, stock: 3 };
const pm = new Map([['p1', product]]);
const vm = new Map([['v1', variant]]);

test('cart totals use server-side prices and zone fee', () => {
  const r = priceCart([{ variantId: 'v1', quantity: 2 }], vm, pm, zones[0] as any);
  assert.deepEqual([r.quote.subtotal, r.quote.discount, r.quote.deliveryFee, r.quote.total], [1398, 600, 60, 1458]);
  assert.equal(r.problems.length, 0);
});
test('cart flags quantity above stock', () => {
  const r = priceCart([{ variantId: 'v1', quantity: 4 }], vm, pm, undefined);
  assert.equal(r.problems.length, 1);
});
test('address validation', () => {
  const e = validateAddress({ fullName: 'A', phone: '12345', pincode: '123' });
  assert.ok(e.fullName && e.phone && e.pincode && e.house);
  const ok = validateAddress({ fullName: 'Asha', phone: '9876543210', house: '1', street: 'GST Rd', area: 'Chromepet', city: 'Chennai', state: 'TN', pincode: '600044' });
  assert.deepEqual(ok, {});
});
test('order number format', () => assert.equal(formatOrderNumber(1), 'AB000001'));
