import { router } from 'expo-router';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, GoldButton, TopBar } from '@/components/ui';
import { products } from '@/data/demo';
import { useShop } from '@/stores/shop';
import { colors, space } from '@/theme';

export default function Wishlist() {
  const ids = useShop((s) => s.wishlist);
  const { width } = useWindowDimensions();
  const colW = (Math.min(width, 520) - space.lg * 2 - 12) / 2;
  const list = products.filter((p) => ids.includes(p.id));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Saved Items" />
      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: space.lg, gap: 12 }}
        renderItem={({ item }) => <ProductCard product={item} width={colW} />}
        ListEmptyComponent={<EmptyState icon="heart-outline" title="No saved items" text="Tap the heart on any product to save it here." action={<GoldButton title="Browse" onPress={() => router.push('/(tabs)/categories')} />} />}
      />
    </View>
  );
}
