import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { ProductCard } from '@/components/ProductCard';
import { DemoBanner, ErrorState, IconBtn, Skeleton } from '@/components/ui';
import { STORE_AREA } from '@/data/demo';
import { useCatalog } from '@/hooks/queries';
import { useSession } from '@/stores/session';
import { useShop } from '@/stores/shop';
import { colors, radius, space } from '@/theme';
import type { Product } from '@/types';

const features = [
  { icon: 'flash' as const, label: 'Local\nDelivery' },
  { icon: 'cube' as const, label: 'Curated\nStyles' },
  { icon: 'sync' as const, label: 'Easy\nExchange' },
  { icon: 'shield-checkmark' as const, label: 'Quality\nAssured' },
];

const banners = [
  { title: 'Premium Footwear Near You', pill: 'Up to 120 min delivery', note: 'Available in eligible service areas.', grad: ['#3A2C12', '#1A1408', '#0E0C08'] as const, pick: 0, cat: undefined },
  { title: 'Run Your City', pill: 'Sports shoes from ₹799', note: 'Lightweight knit runners for daily miles.', grad: ['#13243F', '#0D1626', '#080B12'] as const, pick: 2, cat: 'sports' },
  { title: 'Office Ready', pill: 'Formal edit', note: 'Polished derbies with cushioned footbeds.', grad: ['#2B1A10', '#1A110B', '#0B0806'] as const, pick: 5, cat: 'formal' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cartCount = useShop((s) => s.cart.reduce((n, c) => n + c.quantity, 0));
  const name = useSession((s) => s.session?.name);
  const { catalog, activeProducts, variantsById, isLoading, error, refetch, isRefetching } = useCatalog();
  const inStock = (pid: string) => [...variantsById.values()].some((v) => v.productId === pid && v.stock > 0);

  const trending = activeProducts.filter((p) => p.isFeatured);
  const newest = [...activeProducts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const more = activeProducts.filter((p) => !p.isFeatured);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.gold} />}
    >
      <View style={st.header}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }} onPress={() => router.push('/address')} accessibilityLabel="Delivery location">
          <Ionicons name="location" size={18} color={colors.gold} />
          <View>
            <Text style={{ color: colors.textDim, fontSize: 11 }}>Delivering to</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{STORE_AREA}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </View>
          </View>
        </Pressable>
        <IconBtn name="bag-handle-outline" label="My bag" badge={cartCount} onPress={() => router.push('/cart')} />
        <IconBtn name="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
      </View>

      <DemoBanner />

      <View style={{ paddingHorizontal: space.lg, marginTop: 6 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Hi {name || 'there'}! 👋</Text>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Find Your Perfect Pair</Text>
        <Text style={{ color: colors.textDim, marginTop: 2 }}>Curated footwear. Delivered locally.</Text>
      </View>

      <Pressable style={st.search} onPress={() => router.push({ pathname: '/(tabs)/categories', params: { focus: String(Date.now()) } })} accessibilityRole="search">
        <Ionicons name="search" size={18} color={colors.textDim} />
        <Text style={{ color: colors.textDim, flex: 1 }}>Search sneakers, casuals, sports shoes...</Text>
        <Ionicons name="options-outline" size={18} color={colors.gold} />
      </Pressable>

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <BannerCarousel width={width} products={activeProducts} />

          <View style={st.features}>
            {features.map((f) => (
              <View key={f.label} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <View style={st.featIcon}>
                  <Ionicons name={f.icon} size={20} color={colors.gold} />
                </View>
                <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center' }}>{f.label}</Text>
              </View>
            ))}
          </View>

          <SectionTitle title="Categories" onSeeAll={() => router.push('/(tabs)/categories')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: 10 }}>
            {isLoading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} w={86} h={108} />)
              : catalog!.categories.map((c) => {
                  const p = activeProducts.find((x) => x.categorySlug === c.slug);
                  return (
                    <Pressable key={c.slug} onPress={() => router.push({ pathname: '/(tabs)/categories', params: { cat: c.slug } })} style={{ alignItems: 'center', gap: 6 }}>
                      <View style={st.catTile}>{p ? <ShoeArt product={p} width={70} /> : <Ionicons name="footsteps" size={28} color="#999" />}</View>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
                    </Pressable>
                  );
                })}
          </ScrollView>

          <Rail title="Trending Now" data={trending} loading={isLoading} inStock={inStock} />
          <Rail title="New Arrivals" data={newest} loading={isLoading} inStock={inStock} />
          <Rail title="Featured Picks" data={more} loading={isLoading} inStock={inStock} />

          <View style={st.promise}>
            <Ionicons name="ribbon-outline" size={26} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>The ABDAZ promise</Text>
              <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 2 }}>Every pair is quality-checked in Hasthinapuram before it leaves our store.</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function BannerCarousel({ width, products }: { width: number; products: Product[] }) {
  const w = Math.min(width, 520) - space.lg * 2;
  const [i, setI] = useState(0);
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    const t = setInterval(() => {
      setI((x) => {
        const n = (x + 1) % banners.length;
        ref.current?.scrollTo({ x: n * (w + 12), animated: true });
        return n;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [w]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setI(Math.round(e.nativeEvent.contentOffset.x / (w + 12)));
  return (
    <View style={{ marginTop: space.lg }}>
      <ScrollView ref={ref} horizontal snapToInterval={w + 12} decelerationRate="fast" showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} contentContainerStyle={{ paddingHorizontal: space.lg, gap: 12 }}>
        {banners.map((b) => {
          const p = products[b.pick] ?? products[0];
          return (
            <LinearGradient key={b.title} colors={b.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.banner, { width: w }]}>
              <View style={{ flex: 1, gap: 6, zIndex: 1, paddingRight: 100 }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 26 }}>{b.title}</Text>
                <View style={st.bannerPill}>
                  <Text style={{ color: colors.textOnGold, fontWeight: '800', fontSize: 11 }}>{b.pill}</Text>
                </View>
                <Text style={{ color: colors.textDim, fontSize: 11 }}>{b.note}</Text>
                <Pressable onPress={() => router.push(b.cat ? { pathname: '/(tabs)/categories', params: { cat: b.cat } } : '/(tabs)/categories')} style={st.shopNow}>
                  <Text style={{ color: colors.gold, fontWeight: '800' }}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.gold} />
                </Pressable>
              </View>
              {p && (
                <View style={{ position: 'absolute', right: -6, bottom: 14, transform: [{ rotate: '-8deg' }] }}>
                  <ShoeArt product={p} width={170} />
                </View>
              )}
            </LinearGradient>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {banners.map((b, k) => (
          <View key={b.title} style={{ height: 6, width: k === i ? 20 : 6, borderRadius: 3, backgroundColor: k === i ? colors.gold : colors.border }} />
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, marginTop: space.xl, marginBottom: space.md }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={{ color: colors.gold, fontWeight: '700' }}>See All ›</Text>
        </Pressable>
      )}
    </View>
  );
}

function Rail({ title, data, loading, inStock }: { title: string; data: Product[]; loading: boolean; inStock: (id: string) => boolean }) {
  if (!loading && !data.length) return null;
  return (
    <>
      <SectionTitle title={title} onSeeAll={() => router.push('/(tabs)/categories')} />
      {loading ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: space.lg }}>
          <Skeleton w={160} h={210} />
          <Skeleton w={160} h={210} />
        </View>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: 12 }}
          renderItem={({ item }) => <ProductCard product={item} width={160} inStock={inStock(item.id)} />}
        />
      )}
    </>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.lg, marginBottom: space.md },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', marginHorizontal: space.lg, marginTop: space.lg, height: 48, borderRadius: radius.md, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  banner: { borderRadius: radius.xl, padding: space.lg, minHeight: 176, overflow: 'hidden', borderWidth: 1, borderColor: '#5A4618', flexDirection: 'row' },
  bannerPill: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  shopNow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, borderWidth: 1, borderColor: colors.gold, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  features: { flexDirection: 'row', marginHorizontal: space.lg, marginTop: space.lg, backgroundColor: colors.bg2, borderRadius: radius.lg, paddingVertical: space.md, borderWidth: 1, borderColor: colors.border },
  featIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  catTile: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
  promise: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: space.lg, marginTop: space.xl, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: '#5A4618', backgroundColor: '#15120B' },
});
