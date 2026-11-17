import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { EmptyState, GoldButton, OutlineButton, TopBar, s as ui } from '@/components/ui';
import { useAddresses, useCatalog } from '@/hooks/queries';
import { findZoneForAddress, priceCart } from '@/services/rules';
import { useShop } from '@/stores/shop';
import { colors, formatINR, radius, space } from '@/theme';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { cart, setQty, removeFromCart } = useShop();
  const { catalog, variantsById, productsById } = useCatalog();
  const selectedId = useShop((s) => s.selectedAddressId);
  const { data: addresses } = useAddresses();
  const address = addresses?.find((a) => a.id === selectedId) ?? addresses?.find((a) => a.isDefault);
  const zone = address && catalog ? findZoneForAddress(catalog.zones, address.area, address.pincode) : null;
  const { lines, quote, problems } = useMemo(
    () => priceCart(cart, variantsById, productsById, zone?.serviceable ? zone.zone : undefined),
    [cart, variantsById, productsById, zone?.serviceable, zone?.zone],
  );
  const count = cart.reduce((n, c) => n + c.quantity, 0);

  if (!cart.length)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="My Bag" />
        <EmptyState icon="bag-handle-outline" title="Your bag is empty" text="Find your perfect pair and add it here." action={<GoldButton title="Start Shopping" onPress={() => router.replace('/(tabs)')} />} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={`My Bag (${count})`} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: 12, paddingBottom: 200 }}>
        {lines.map(({ item, variant, product, available }) => {
          const colour = product.colours.find((c) => c.id === variant.colourId)!;
          return (
            <View key={item.variantId} style={[ui.lightCard, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
              <Pressable onPress={() => router.push(`/product/${product.id}`)} style={{ width: 84, height: 70, backgroundColor: '#ECE8DF', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}>
                <ShoeArt product={product} colour={colour} width={80} />
              </Pressable>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: '#111', fontWeight: '800' }} numberOfLines={1}>{product.name}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{colour.name} · UK {variant.size}</Text>
                <Text style={{ color: '#111', fontWeight: '800', fontSize: 16 }}>{formatINR(product.sellingPrice)}</Text>
                {!available && <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>{variant.stock === 0 ? 'Out of stock. Please remove.' : `Only ${variant.stock} left`}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 10 }}>
                <Pressable onPress={() => removeFromCart(item.variantId)} accessibilityLabel={`Remove ${product.name}`} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#666" />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D6D0C4', borderRadius: radius.pill }}>
                  <Pressable onPress={() => (item.quantity > 1 ? setQty(item.variantId, item.quantity - 1, variant.stock) : removeFromCart(item.variantId))} style={{ padding: 8 }} accessibilityLabel="Decrease quantity">
                    <Ionicons name="remove" size={16} color="#111" />
                  </Pressable>
                  <Text style={{ color: '#111', fontWeight: '800', minWidth: 18, textAlign: 'center' }}>{item.quantity}</Text>
                  <Pressable onPress={() => setQty(item.variantId, item.quantity + 1, variant.stock)} disabled={item.quantity >= variant.stock} style={{ padding: 8, opacity: item.quantity >= variant.stock ? 0.3 : 1 }} accessibilityLabel="Increase quantity">
                    <Ionicons name="add" size={16} color="#111" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <View style={[ui.lightCard, { padding: space.lg }]}>
          <Text style={{ color: '#111', fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Order Summary</Text>
          <SummaryRow label="Item Total (MRP)" value={formatINR(quote.mrpTotal)} />
          {quote.discount > 0 && <SummaryRow label="Discount" value={'− ' + formatINR(quote.discount)} green />}
          <SummaryRow label="Delivery Fee" value={zone?.serviceable ? formatINR(quote.deliveryFee) : 'Calculated at checkout'} />
          <View style={{ height: 1, backgroundColor: '#E2DCCF', marginVertical: 8 }} />
          <SummaryRow label="Total" value={formatINR(quote.total)} bold />
        </View>
        {problems.map((p) => (
          <Text key={p} style={{ color: colors.danger }}>{p}</Text>
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg2, borderTopWidth: 1, borderColor: colors.border, gap: 10 }}>
        <GoldButton title="Proceed to Checkout" icon="arrow-forward" disabled={problems.length > 0} onPress={() => router.push('/checkout')} />
        <OutlineButton title="Continue Shopping" onPress={() => router.replace('/(tabs)')} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: bold ? '#111' : '#555', fontWeight: bold ? '800' : '400', fontSize: bold ? 17 : 14 }}>{label}</Text>
      <Text style={{ color: green ? colors.success : '#111', fontWeight: bold ? '800' : '600', fontSize: bold ? 17 : 14 }}>{value}</Text>
    </View>
  );
}
