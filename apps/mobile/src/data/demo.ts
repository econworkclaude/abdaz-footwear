/**
 * DEMO DATA ONLY. Illustrative products, prices and stock for testing the app.
 * Not confirmed retail pricing. Replace with Supabase data in production mode.
 */
import type { Category, Colourway, DeliveryZone, Product, Variant } from '@/types';

export const categories: Category[] = [
  { slug: 'sneakers', name: 'Sneakers', isActive: true },
  { slug: 'casual', name: 'Casual Shoes', isActive: true },
  { slug: 'sports', name: 'Sports Shoes', isActive: true },
  { slug: 'formal', name: 'Formal Shoes', isActive: true },
  { slug: 'sandals', name: 'Sandals', isActive: true },
  { slug: 'slides', name: 'Slides', isActive: true },
];

const c = (id: string, name: string, upper: string, accent: string, sole: string): Colourway => ({ id, name, upper, accent, sole });

const BW = c('bw', 'Black & White', '#15181F', '#FFFFFF', '#F2F2F2');
const GW = c('gw', 'Green & White', '#F4F4F2', '#1F8A5B', '#FFFFFF');
const AB = c('ab', 'All Black', '#14161B', '#2A2E36', '#1B1D22');
const WG = c('wg', 'White & Gold', '#F7F5F0', '#D8AE57', '#FFFFFF');
const NB = c('nb', 'Navy & Blue', '#1C2A4A', '#4F8DFF', '#F2F2F2');
const GR = c('gr', 'Grey & Red', '#8C9199', '#E5484D', '#F2F2F2');
const TN = c('tn', 'Tan Brown', '#8A5A33', '#5C3A1E', '#2A1B10');
const BL = c('bl', 'Black', '#0F1014', '#2C2F36', '#222');

export const products: Product[] = [
  {
    id: 'p1', name: 'Urban Everyday Sneaker', sku: 'ABZ-SNK-001', categorySlug: 'sneakers', style: 'low',
    sellingPrice: 699, mrp: 999, isFeatured: true, createdAt: '2026-10-01',
    description: 'A clean everyday low-top with a padded collar and cushioned insole, built for long days around the city.',
    material: 'Synthetic leather upper, mesh lining', sole: 'Rubber, non-marking', fit: 'True to size', care: 'Wipe with a damp cloth. Air dry.',
    colours: [BW, GW, AB],
  },
  {
    id: 'p2', name: 'Street Classic Sneaker', sku: 'ABZ-SNK-002', categorySlug: 'sneakers', style: 'low',
    sellingPrice: 649, mrp: 899, isFeatured: false, createdAt: '2026-10-20',
    description: 'Retro-inspired court silhouette with contrast side panel and a grippy cupsole.',
    material: 'Synthetic upper', sole: 'Rubber cupsole', fit: 'True to size', care: 'Wipe clean.',
    colours: [WG, BW],
  },
  {
    id: 'p3', name: 'ActiveRun Sports Shoe', sku: 'ABZ-SPT-001', categorySlug: 'sports', style: 'runner',
    sellingPrice: 799, mrp: 1199, isFeatured: true, createdAt: '2026-09-15',
    description: 'Lightweight knit runner with a responsive EVA midsole for walks, gym and light running.',
    material: 'Breathable knit', sole: 'EVA midsole, rubber outsole', fit: 'Snug, go half size up if between sizes', care: 'Hand wash, air dry.',
    colours: [NB, GR, AB],
  },
  {
    id: 'p4', name: 'Premium Casual Sneaker', sku: 'ABZ-CAS-001', categorySlug: 'casual', style: 'low',
    sellingPrice: 899, mrp: 1299, isFeatured: true, createdAt: '2026-11-05',
    description: 'Smart-casual sneaker with a minimal upper and gold-tone eyelets. Dresses up or down.',
    material: 'PU leather', sole: 'TPR', fit: 'True to size', care: 'Wipe with a soft cloth.',
    colours: [WG, AB],
  },
  {
    id: 'p5', name: 'Everyday Comfort Slide', sku: 'ABZ-SLD-001', categorySlug: 'slides', style: 'slide',
    sellingPrice: 399, mrp: 549, isFeatured: false, createdAt: '2026-10-10',
    description: 'Soft one-piece slide with a contoured footbed for home and quick errands.',
    material: 'EVA', sole: 'EVA, textured', fit: 'Relaxed', care: 'Rinse with water.',
    colours: [AB, GR],
  },
  {
    id: 'p6', name: 'Classic Formal Shoe', sku: 'ABZ-FRM-001', categorySlug: 'formal', style: 'formal',
    sellingPrice: 999, mrp: 1499, isFeatured: false, createdAt: '2026-09-01',
    description: 'Polished lace-up derby for office and occasions, with a cushioned footbed.',
    material: 'Synthetic leather', sole: 'TPR with heel block', fit: 'True to size', care: 'Polish regularly.',
    colours: [BL, TN],
  },
  {
    id: 'p7', name: 'Urban Street Runner', sku: 'ABZ-SPT-002', categorySlug: 'sports', style: 'runner',
    sellingPrice: 849, mrp: 1199, isFeatured: false, createdAt: '2026-11-10',
    description: 'Chunky-sole street runner with layered panels and a pull tab.',
    material: 'Mesh and synthetic overlays', sole: 'Phylon midsole', fit: 'True to size', care: 'Spot clean.',
    colours: [GR, BW],
  },
  {
    id: 'p8', name: 'Minimal White Sneaker', sku: 'ABZ-SNK-003', categorySlug: 'sneakers', style: 'low',
    sellingPrice: 749, mrp: 999, isFeatured: true, createdAt: '2026-11-12',
    description: 'The everyday all-white essential. Clean lines, cushioned insole, goes with everything.',
    material: 'PU leather', sole: 'Rubber', fit: 'True to size', care: 'Wipe clean, use white shoe cleaner.',
    colours: [WG, c('ww', 'All White', '#FAFAFA', '#E6E6E6', '#FFFFFF')],
  },
  {
    id: 'p9', name: 'Coastal Strap Sandal', sku: 'ABZ-SDL-001', categorySlug: 'sandals', style: 'sandal',
    sellingPrice: 499, mrp: 699, isFeatured: false, createdAt: '2026-10-25',
    description: 'Adjustable strap sandal with a cushioned sole, made for Chennai weather.',
    material: 'Webbing straps', sole: 'EVA', fit: 'Adjustable', care: 'Rinse and air dry.',
    colours: [AB, TN],
  },
];

export const SIZES = [6, 7, 8, 9, 10];

/** Deterministic demo stock. Some sizes are out of stock on purpose so the UI can be tested. */
function demoStock(pi: number, ci: number, size: number) {
  const n = (pi * 7 + ci * 3 + size * 5) % 11;
  if (n === 0 || n === 4) return 0;
  return n;
}

export const variants: Variant[] = products.flatMap((p, pi) =>
  p.colours.flatMap((col, ci) =>
    SIZES.map((size) => ({ id: `${p.id}-${col.id}-${size}`, productId: p.id, colourId: col.id, size, stock: demoStock(pi, ci, size) })),
  ),
);

export const zones: DeliveryZone[] = [
  {
    id: 'zone-a', name: 'Zone A (pilot)', isActive: true, deliveryFee: 60, etaMinutes: 120, minimumOrder: 0,
    areas: ['Hasthinapuram', 'Chromepet', 'Chitlapakkam', 'Tambaram Sanatorium'],
    pincodes: ['600064', '600044', '600047'],
  },
  { id: 'zone-b', name: 'Zone B', isActive: false, deliveryFee: 80, etaMinutes: 120, minimumOrder: 0, areas: ['Tambaram', 'Rajakilpakkam'], pincodes: ['600045', '600073'] },
  { id: 'zone-c', name: 'Zone C', isActive: false, deliveryFee: 100, etaMinutes: 150, minimumOrder: 0, areas: ['Medavakkam', 'Pallikaranai', 'Sholinganallur'], pincodes: ['600100', '600119'] },
];

export const settings = {
  isDemo: true,
  storeArea: 'Hasthinapuram, Chennai',
  codEnabled: true,
  codMaxOrder: 5000,
  upiConfigured: false,
  whatsappNumber: '', // set by admin; left empty until a verified business number is provided
  exchangeWindowDays: 7,
  taxIncludedInPrice: true,
};

export const sizeGuide = [
  { uk: 6, cm: 24.5 },
  { uk: 7, cm: 25.4 },
  { uk: 8, cm: 26.2 },
  { uk: 9, cm: 27.1 },
  { uk: 10, cm: 27.9 },
];
