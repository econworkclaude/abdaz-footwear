import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoBanner, GoldButton, Notice, OutlineButton, Row, TopBar, s as ui } from '@/components/ui';
import { settings, zones } from '@/data/demo';
import { findZoneForAddress, priceCart } from '@/services/rules';
import { getVariantsById, productsById, useShop } from '@/stores/shop';
import { colors, formatINR, radius, space } from '@/theme';
import type { PaymentMethod } from '@/types';

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { cart, sold, phone, placeOrder } = useShop();
  const address = useShop((s) => s.addresses.find((a) => a.id === s.selectedAddressId));
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = useRef(`ck-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const zone = address ? findZoneForAddress(zones, address.area, address.pincode) : null;
  const { lines, quote, problems } = useMemo(() => priceCart(cart, getVariantsById(sold), productsById, zone?.serviceable ? zone.zone : undefined), [cart, sold, zone?.serviceable, zone?.zone]);

  const blocker = !phone
    ? 'Sign in to place your order'
    : !address
      ? 'Add a delivery address'
      : !zone?.serviceable
        ? 'This address is outside our delivery area'
        : problems[0] ?? (method === 'upi' ? 'UPI is not set up yet' : '');
  const step = !address || !zone?.serviceable ? -1 : blocker ? 0 : 1;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const r = await placeOrder({ paymentMethod: method, idempotencyKey: key.current });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.replace(`/order-success/${r.order.id}`);
  };

  if (!cart.length && !busy) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Checkout" />
        <Notice tone="info" title="Your bag is empty" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Checkout" />
      <DemoBanner text="DEMO MODE · orders are saved on this phone only, nothing is delivered" />
      <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, marginVertical: space.md }}>
        {['Address', 'Payment', 'Place Order'].map((l, i) => {
          const done = i <= step;
          return (
            <View key={l} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? 'transparent' : done ? colors.success : colors.border }} />
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done ? colors.success : colors.bg2, borderWidth: 2, borderColor: done ? colors.success : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1, height: 2, backgroundColor: i === 2 ? 'transparent' : i < step ? colors.success : colors.border }} />
              </View>
              <Text style={{ color: done ? colors.text : colors.textDim, fontSize: 11 }}>{l}</Text>
            </View>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 0, gap: space.lg, paddingBottom: 200 }}>
        {!phone && (
          <View style={[ui.card, { gap: 10 }]}>
            <Text style={ui.section}>Sign in to order</Text>
            <Text style={{ color: colors.textDim }}>You can browse as a guest, but we need your mobile number to place an order.</Text>
            <GoldButton title="Sign In" onPress={() => router.push({ pathname: '/login', params: { next: '/checkout' } })} />
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={ui.section}>Delivery Address</Text>
          {address ? (
            <View style={[ui.lightCard, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
              <Ionicons name="location" size={22} color="#111" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111', fontWeight: '800' }}>{address.fullName} · {address.type}</Text>
                <Text style={{ color: '#555', fontSize: 13 }}>
                  {address.house}, {address.street}, {address.area}, {address.city} - {address.pincode}
                </Text>
              </View>
              <Pressable onPress={() => router.push({ pathname: '/address', params: { mode: 'select' } })} hitSlop={8}>
                <Text style={{ color: colors.goldDark, fontWeight: '800' }}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <OutlineButton title="Add Delivery Address" icon="add" onPress={() => router.push({ pathname: '/address', params: { mode: 'select' } })} />
          )}
          {zone &&
            (zone.serviceable ? (
              <Notice title="Delivery available in your area" text={`Estimated time: up to ${zone.zone!.etaMinutes} min after confirmation (not guaranteed)`} />
            ) : (
              <Notice tone="danger" title="Sorry, express delivery is not available at this location yet." text={zone.reason} />
            ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={ui.section}>Items ({quote.itemCount})</Text>
          {lines.map(({ item, product, variant }) => (
            <View key={item.variantId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                {product.name} · {product.colours.find((c) => c.id === variant.colourId)?.name} · UK {variant.size} × {item.quantity}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{formatINR(product.sellingPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={ui.section}>Payment Method</Text>
          <PayOption icon="cash-outline" title="Cash on Delivery (COD)" sub={`Pay when your order arrives · up to ${formatINR(settings.codMaxOrder)}`} active={method === 'cod'} onPress={() => setMethod('cod')} />
          <PayOption icon="phone-portrait-outline" title="UPI (GPay, PhonePe, Paytm)" sub="Not available yet · payment gateway not set up" active={method === 'upi'} disabled onPress={() => {}} />
          <PayOption icon="card-outline" title="Cards" sub="Coming later" disabled active={false} onPress={() => {}} />
        </View>

        <View style={[ui.card, { gap: 2 }]}>
          <Row label="Item Total (MRP)" value={formatINR(quote.mrpTotal)} />
          {quote.discount > 0 && <Row label="Discount" value={'− ' + formatINR(quote.discount)} />}
          <Row label="Delivery Fee" value={zone?.serviceable ? formatINR(quote.deliveryFee) : '—'} />
          <Row label="Taxes" value="Included in price" />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row label="Total Payable" value={formatINR(quote.total)} bold />
        </View>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>
          Exchange: size exchange within {settings.exchangeWindowDays} days of delivery, subject to stock. Final policy to be confirmed before launch.
        </Text>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg2, borderTopWidth: 1, borderColor: colors.border, gap: 8 }}>
        {!!(error || blocker) && <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '600' }}>{error || blocker}</Text>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ color: colors.textDim }}>Total Payable</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{formatINR(quote.total)}</Text>
        </View>
        <GoldButton title={busy ? 'Placing order…' : 'Place Order'} icon="lock-closed" loading={busy} disabled={!!blocker} onPress={submit} />
      </View>
    </View>
  );
}

function PayOption({ icon, title, sub, active, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; active: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: active, disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: active ? colors.gold : colors.border, backgroundColor: colors.card, opacity: disabled ? 0.5 : 1 }}
    >
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.gold : colors.textDim} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>{sub}</Text>
      </View>
      <Ionicons name={icon} size={22} color={colors.gold} />
    </Pressable>
  );
}
