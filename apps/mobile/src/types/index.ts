export type CategorySlug = 'sneakers' | 'casual' | 'sports' | 'formal' | 'sandals' | 'slides';

export interface Category {
  slug: CategorySlug;
  name: string;
  isActive: boolean;
}

export interface Colourway {
  id: string;
  name: string;
  /** upper, accent, sole colours used by the illustration */
  upper: string;
  accent: string;
  sole: string;
}

export interface Variant {
  id: string; // productId-colourId-size
  productId: string;
  colourId: string;
  size: number; // UK
  stock: number;
}

export interface Product {
  id: string;
  isActive?: boolean;
  purchaseCost?: number;
  name: string;
  sku: string;
  categorySlug: CategorySlug;
  style: 'low' | 'runner' | 'formal' | 'slide' | 'sandal';
  sellingPrice: number;
  mrp: number;
  description: string;
  material: string;
  sole: string;
  fit: string;
  care: string;
  colours: Colourway[];
  isFeatured: boolean;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  areas: string[];
  pincodes: string[];
  deliveryFee: number;
  etaMinutes: number;
  minimumOrder: number;
  isActive: boolean;
}

export type AddressType = 'Home' | 'Work' | 'Other';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  house: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  isDefault: boolean;
}

export interface CartItem {
  variantId: string;
  quantity: number;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'delivery_failed'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'cod' | 'upi';

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  colourName: string;
  size: number;
  quantity: number;
  unitPrice: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  mrpTotal?: number;
  discount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: OrderStatus;
  history: StatusEvent[];
  etaMinutes: number;
  createdAt: string;
  userId?: string;
  customerPhone?: string | null;
}

export interface Quote {
  subtotal: number;
  mrpTotal: number;
  discount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

export interface Settings {
  codEnabled: boolean;
  codMaxOrder: number;
  upiConfigured: boolean;
  whatsappNumber: string;
  supportPhone: string;
  exchangeWindowDays: number;
}

export interface Catalog {
  categories: Category[];
  products: Product[];
  variants: Variant[];
  zones: DeliveryZone[];
  settings: Settings;
}

export interface Session {
  userId: string;
  phone: string | null;
  email: string | null;
  name: string;
  role: 'customer' | 'admin' | 'rider';
}

export interface Dashboard {
  todayOrders: number;
  todaySales: number;
  pending: number;
  outForDelivery: number;
  completed: number;
  cancelled: number;
  revenue: number;
  lowStock: number;
}
