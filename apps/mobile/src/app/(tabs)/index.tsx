import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { ProductCard } from '@/components/ProductCard';
import { DemoBanner, IconBtn } from '@/components/ui';
import { categories, products, settings } from '@/data/demo';
import { useShop } from '@/stores/shop';
import { colors, radius, space } from '@/theme';
import type { Product } from '@/types';

const features = [
  { icon: 'flash' as const, label: 'Local\nDelivery' },
  { icon: 'cube' as const, label: 'Curated\nStyles' },
  { icon: 'sync' as const, label: 'Easy\nExchange' },
  { icon: 'shield-checkmark' as const, label: 'Quality\nAssured' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const cartCount = useShop((s) => s.cart.reduce((n, c) => n + c.quantity, 0));
  const name = useShop((s) => s.name);
  const trending = products.filter((p) => p.isFeatured);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}>
      <View style={st.header}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }} accessibilityLabel="Delivery location">
          <Ionicons name="location" size={18} color={colors.gold} />
          <View>
            <Text style={{ color: colors.textDim, fontSize: 11 }}>Delivering to</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{settings.storeArea}</Text>
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

      <Pressable style={st.search} onPress={() => router.push({ pathname: '/(tabs)/categories', params: { focus: '1' } })} accessibilityRole="search">
        <Ionicons name="search" size={18} color={colors.textDim} />
        <Text style={{ color: colors.textDim }}>Search sneakers, casuals, sports shoes...</Text>
      </Pressable>

      <LinearGradient colors={['#3A2C12', '#1A1408', '#0E0C08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.banner}>
        <View style={{ flex: 1, gap: 6, zIndex: 1, paddingRight: 90 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 26 }}>Premium Footwear Near You</Text>
          <View style={st.bannerPill}>
            <Text style={{ color: colors.textOnGold, fontWeight: '800', fontSize: 11 }}>Up to 120 min delivery</Text>
          </View>
          <Text style={{ color: colors.textDim, fontSize: 10 }}>Available in eligible service areas.</Text>
          <Pressable onPress={() => router.push('/(tabs)/categories')} style={st.shopNow}>
            <Text style={{ color: colors.gold, fontWeight: '800' }}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.gold} />
          </Pressable>
        </View>
        <View style={{ position: 'absolute', right: -4, bottom: 10 }}>
          <ShoeArt product={products[0]} width={165} />
        </View>
      </LinearGradient>

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
        {categories.map((c) => {
          const p = products.find((x) => x.categorySlug === c.slug)!;
          return (
            <Pressable key={c.slug} onPress={() => router.push({ pathname: '/(tabs)/categories', params: { cat: c.slug } })} style={{ alignItems: 'center', gap: 6 }}>
              <View style={st.catTile}>
                <ShoeArt product={p} width={70} />
              </View>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Rail title="Trending Now" data={trending} />
      <Rail title="New Arrivals" data={newest} />
      <Rail title="Featured Picks" data={products.filter((p) => !p.isFeatured)} />
    </ScrollView>
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

function Rail({ title, data }: { title: string; data: Product[] }) {
  return (
    <>
      <SectionTitle title={title} onSeeAll={() => router.push('/(tabs)/categories')} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: 12 }}
        renderItem={({ item }) => <ProductCard product={item} width={160} />}
      />
    </>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.lg, marginBottom: space.md },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', marginHorizontal: space.lg, marginTop: space.lg, height: 48, borderRadius: radius.md, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  banner: { marginHorizontal: space.lg, marginTop: space.lg, borderRadius: radius.xl, padding: space.lg, minHeight: 170, overflow: 'hidden', borderWidth: 1, borderColor: '#5A4618', flexDirection: 'row' },
  bannerPill: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  shopNow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, borderWidth: 1, borderColor: colors.gold, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  features: { flexDirection: 'row', marginHorizontal: space.lg, marginTop: space.lg, backgroundColor: colors.bg2, borderRadius: radius.lg, paddingVertical: space.md, borderWidth: 1, borderColor: colors.border },
  featIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  catTile: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' },
});
