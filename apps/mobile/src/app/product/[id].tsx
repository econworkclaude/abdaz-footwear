import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { toast } from '@/components/Toast';
import { EmptyState, GoldButton, IconBtn, Notice, OutlineButton, Price, Skeleton, s as ui } from '@/components/ui';
import { SIZES, sizeGuide } from '@/data/demo';
import { useAddresses, useCatalog } from '@/hooks/queries';
import { findZoneForAddress } from '@/services/rules';
import { useShop } from '@/stores/shop';
import { colors, radius, space } from '@/theme';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catalog, productsById, variantsById: vmap, isLoading } = useCatalog();
  const product = productsById.get(id);
  const insets = useSafeAreaInsets();
  const liked = useShop((s) => s.wishlist.includes(id));
  const toggleWish = useShop((s) => s.toggleWishlist);
  const addToCart = useShop((s) => s.addToCart);
  const cartCount = useShop((s) => s.cart.reduce((n, c) => n + c.quantity, 0));
  const selectedId = useShop((s) => s.selectedAddressId);
  const { data: addresses } = useAddresses();
  const address = addresses?.find((a) => a.id === selectedId) ?? addresses?.find((a) => a.isDefault);
  const [colourPick, setColourId] = useState('');
  const [size, setSize] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guide, setGuide] = useState(false);

  if (isLoading)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.lg, paddingTop: insets.top + 60, gap: 16 }}>
        <Skeleton w="100%" h={260} r={24} />
        <Skeleton w="70%" h={28} />
        <Skeleton w="40%" h={28} />
        <Skeleton w="100%" h={60} />
      </View>
    );
  if (!product) return <EmptyState icon="alert-circle" title="Product not found" action={<OutlineButton title="Go back" onPress={() => router.back()} />} />;

  const colourId = colourPick || product.colours[0]?.id;
  const colour = product.colours.find((c) => c.id === colourId) ?? product.colours[0];
  const settings = catalog!.settings;
  const zones = catalog!.zones;
  const variantFor = (sz: number) => vmap.get(`${product.id}-${colourId}-${sz}`);
  const selected = size ? variantFor(size) : undefined;
  const zone = address ? findZoneForAddress(zones, address.area, address.pincode) : null;

  const add = (buyNow: boolean) => {
    if (!selected) return setMsg({ ok: false, text: 'Please select your UK size.' });
    const r = addToCart(selected.id, selected.stock, 1);
    setMsg(r.ok ? null : { ok: false, text: r.message });
    if (r.ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (buyNow) router.push('/cart');
      else toast(`Added · ${colour.name}, UK ${selected.size}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ backgroundColor: colors.cardLight, paddingTop: insets.top + 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg }}>
            <IconBtn name="arrow-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconBtn name={liked ? 'heart' : 'heart-outline'} color={liked ? colors.danger : colors.text} label="Wishlist" onPress={() => toggleWish(product.id)} />
              <IconBtn name="bag-handle-outline" label="My bag" badge={cartCount} onPress={() => router.push('/cart')} />
            </View>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ShoeArt product={product} colour={colour} width={320} />
          </View>
          <Text style={{ textAlign: 'center', color: '#8A8F98', fontSize: 11, paddingBottom: 12 }}>Illustration · real product photos will be added by admin</Text>
        </View>

        <View style={{ padding: space.lg, gap: space.lg }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{product.name}</Text>
            <Text style={{ color: colors.textDim, fontSize: 12 }}>No reviews yet</Text>
            <Price price={product.sellingPrice} mrp={product.mrp} size="lg" />
            <Text style={{ color: colors.textDim, fontSize: 12 }}>Inclusive of all taxes · Demo price</Text>
          </View>

          {zone ? (
            zone.serviceable ? (
              <Notice icon="flash" title="Delivery available in your area" text={`Up to ${zone.zone!.etaMinutes} min to ${address!.area}. Delivery fee ₹${zone.zone!.deliveryFee}.`} />
            ) : (
              <Notice tone="danger" title="Currently unavailable for this location" text={zone.reason} />
            )
          ) : (
            <Notice tone="info" icon="flash" title="Delivery in up to 120 min in eligible areas" text="Hasthinapuram, Chromepet, Chitlapakkam, Tambaram Sanatorium. Add your address at checkout to confirm." />
          )}

          <View style={{ gap: 10 }}>
            <Text style={ui.section}>
              Colour: <Text style={{ color: colors.textDim, fontWeight: '600', fontSize: 15 }}>{colour.name}</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {product.colours.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected: c.id === colourId }}
                  onPress={() => { setColourId(c.id); setSize(null); setMsg(null); }}
                  style={{ padding: 3, borderRadius: 22, borderWidth: 2, borderColor: c.id === colourId ? colors.gold : 'transparent' }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 17, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flex: 1, backgroundColor: c.upper }} />
                    <View style={{ flex: 1, backgroundColor: c.accent }} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={ui.section}>Size (UK)</Text>
              <Pressable onPress={() => setGuide(true)} hitSlop={8}>
                <Text style={{ color: colors.gold, fontWeight: '700' }}>Size Guide</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {SIZES.map((sz) => {
                const v = variantFor(sz);
                const out = !v || v.stock <= 0;
                return (
                  <Pressable
                    key={sz}
                    disabled={out}
                    onPress={() => { setSize(sz); setMsg(null); }}
                    accessibilityLabel={`UK ${sz}${out ? ', out of stock' : ''}`}
                    accessibilityState={{ selected: size === sz, disabled: out }}
                    style={{
                      width: 56, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                      borderColor: size === sz ? colors.gold : colors.border,
                      backgroundColor: size === sz ? colors.gold : colors.bg2,
                      opacity: out ? 0.35 : 1,
                    }}
                  >
                    <Text style={{ color: size === sz ? colors.textOnGold : colors.text, fontWeight: '800', textDecorationLine: out ? 'line-through' : 'none' }}>{sz}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selected && <Text style={{ color: selected.stock <= 3 ? colors.warning : colors.success, fontSize: 12, fontWeight: '600' }}>{selected.stock <= 3 ? `Only ${selected.stock} left in UK ${selected.size}` : 'In stock'}</Text>}
          </View>

          <View style={[ui.card, { gap: 8 }]}>
            <Text style={ui.section}>Product details</Text>
            <Text style={{ color: colors.textDim, lineHeight: 20 }}>{product.description}</Text>
            {[
              ['Material', product.material],
              ['Sole', product.sole],
              ['Fit', product.fit],
              ['Care', product.care],
              ['SKU', product.sku],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: colors.textDim, width: 70 }}>{k}</Text>
                <Text style={{ color: colors.text, flex: 1 }}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={[ui.card, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
            <Ionicons name="sync" size={20} color={colors.gold} />
            <Text style={{ color: colors.textDim, flex: 1, fontSize: 13 }}>Size exchange within {settings.exchangeWindowDays} days of delivery, subject to stock and policy (policy to be confirmed before launch).</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg2, borderTopWidth: 1, borderColor: colors.border, gap: 8 }}>
        {msg && (
          <Text style={{ color: msg.ok ? colors.success : colors.danger, fontWeight: '600', textAlign: 'center' }}>
            {msg.text}
            {msg.ok ? ' ✓' : ''}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <OutlineButton title="Add to Bag" icon="bag-add-outline" onPress={() => add(false)} style={{ flex: 1 }} />
          <GoldButton title="Buy Now" onPress={() => add(true)} style={{ flex: 1 }} />
        </View>
      </View>

      <Modal visible={guide} transparent animationType="slide" onRequestClose={() => setGuide(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000a' }} onPress={() => setGuide(false)} />
        <View style={{ backgroundColor: colors.bg2, padding: space.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 10, paddingBottom: insets.bottom + 24 }}>
          <Text style={ui.section}>Size Guide</Text>
          <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={{ flex: 1, color: colors.textDim, fontWeight: '700' }}>UK size</Text>
            <Text style={{ flex: 1, color: colors.textDim, fontWeight: '700' }}>Foot length (cm)</Text>
          </View>
          {sizeGuide.map((r) => (
            <View key={r.uk} style={{ flexDirection: 'row', paddingVertical: 4 }}>
              <Text style={{ flex: 1, color: colors.text }}>UK {r.uk}</Text>
              <Text style={{ flex: 1, color: colors.text }}>{r.cm}</Text>
            </View>
          ))}
          <Text style={{ color: colors.textDim, fontSize: 12, lineHeight: 18 }}>
            How to measure: stand on paper, mark heel and longest toe, measure the distance in cm. If between sizes, choose the larger size.{'\n'}Conversions are approximate and must be verified against supplier sizing before launch.
          </Text>
          <GoldButton title="Close" onPress={() => setGuide(false)} />
        </View>
      </Modal>
    </View>
  );
}
