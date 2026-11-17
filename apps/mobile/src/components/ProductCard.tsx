import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShoeArt } from './Art';
import { Price } from './ui';
import { useShop } from '@/stores/shop';
import { colors, radius } from '@/theme';
import type { Product } from '@/types';

export function ProductCard({ product, width = 160, inStock = true }: { product: Product; width?: number; inStock?: boolean }) {
  const liked = useShop((s) => s.wishlist.includes(product.id));
  const toggleWish = useShop((s) => s.toggleWishlist);
  const pop = useRef(new Animated.Value(1)).current;
  const toggle = (id: string) => {
    toggleWish(id);
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    Animated.sequence([Animated.spring(pop, { toValue: 1.35, useNativeDriver: true, speed: 40 }), Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 })]).start();
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ₹${product.sellingPrice}`}
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [st.card, { width, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={st.imgBox}>
        <ShoeArt product={product} width={width - 24} />
        <Pressable accessibilityLabel={liked ? 'Remove from wishlist' : 'Add to wishlist'} onPress={() => toggle(product.id)} hitSlop={8} style={st.heart}>
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.danger : '#333'} />
          </Animated.View>
        </Pressable>
        {product.isFeatured && inStock && (
          <View style={st.tag}>
            <Text style={st.tagText}>TRENDING</Text>
          </View>
        )}
        {!inStock && (
          <View style={st.oos}>
            <Text style={st.oosText}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        <Text style={st.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Price price={product.sellingPrice} mrp={product.mrp} />
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
          {product.colours.map((c) => (
            <View key={c.id} style={[st.sw, { backgroundColor: c.upper }]} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  imgBox: { backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  heart: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontWeight: '700', fontSize: 14 },
  sw: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  tag: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tagText: { color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  oos: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#000a', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  oosText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
