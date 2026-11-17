import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { ErrorState, GoldButton, Skeleton, s as ui } from '@/components/ui';
import { useCatalog } from '@/hooks/queries';
import { colors, formatINR, radius, space } from '@/theme';

export default function AdminProducts() {
  const insets = useSafeAreaInsets();
  const { catalog, isLoading, error, refetch, isRefetching } = useCatalog();
  const [q, setQ] = useState('');
  const products = (catalog?.products ?? []).filter((p) => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  const stockOf = (pid: string) => (catalog?.variants ?? []).filter((v) => v.productId === pid).reduce((n, v) => n + v.stock, 0);
  const soldOut = (pid: string) => (catalog?.variants ?? []).filter((v) => v.productId === pid && v.stock === 0).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', flex: 1 }}>Products</Text>
        <GoldButton title="Add" icon="add" onPress={() => router.push('/admin/product/new')} style={{ width: 110 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.lg, marginTop: space.md, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44 }}>
        <Ionicons name="search" size={16} color={colors.textDim} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search name or SKU" placeholderTextColor="#6B7280" style={{ flex: 1, color: colors.text, height: 44 }} accessibilityLabel="Search products" />
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ padding: space.lg, gap: 10 }}
        ListEmptyComponent={isLoading ? <Skeleton w="100%" h={90} /> : error ? <ErrorState error={error} onRetry={() => void refetch()} /> : undefined}
        renderItem={({ item: p }) => {
          const total = stockOf(p.id);
          const so = soldOut(p.id);
          return (
            <Pressable onPress={() => router.push(`/admin/product/${p.id}`)} style={[ui.card, { flexDirection: 'row', gap: 12, padding: 10, alignItems: 'center', opacity: p.isActive === false ? 0.55 : 1 }]}>
              <View style={{ width: 76, height: 62, borderRadius: radius.md, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' }}>
                <ShoeArt product={p} width={72} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: colors.textDim, fontSize: 12 }}>{p.sku} · {formatINR(p.sellingPrice)} (MRP {formatINR(p.mrp)})</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ color: total <= 5 ? colors.warning : colors.success, fontSize: 12, fontWeight: '700' }}>{total} pairs</Text>
                  {so > 0 && <Text style={{ color: colors.danger, fontSize: 12 }}>· {so} sizes sold out</Text>}
                  {p.isActive === false && <Text style={{ color: colors.textDim, fontSize: 12 }}>· Hidden</Text>}
                  {p.isFeatured && <Text style={{ color: colors.gold, fontSize: 12 }}>· Featured</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
