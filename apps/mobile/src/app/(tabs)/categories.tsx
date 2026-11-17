import type React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { Chip, EmptyState, s as ui } from '@/components/ui';
import { categories, products, SIZES } from '@/data/demo';
import { getVariantsById, useShop } from '@/stores/shop';
import { colors, radius, space } from '@/theme';
import type { CategorySlug } from '@/types';
import { norm } from '@/services/rules';

type Sort = 'featured' | 'new' | 'low' | 'high';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'low', label: 'Price: Low–High' },
  { id: 'high', label: 'Price: High–Low' },
];
const PRICE = [
  { id: 'all', label: 'Any price', min: 0, max: Infinity },
  { id: 'u500', label: 'Under ₹500', min: 0, max: 499 },
  { id: '500-800', label: '₹500–₹800', min: 500, max: 800 },
  { id: 'o800', label: 'Above ₹800', min: 801, max: Infinity },
];

export default function Categories() {
  const params = useLocalSearchParams<{ cat?: CategorySlug; focus?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sold = useShop((s) => s.sold);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategorySlug | 'all'>(params.cat ?? 'all');
  const [sort, setSort] = useState<Sort>('featured');
  const [price, setPrice] = useState('all');
  const [size, setSize] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (params.cat) setCat(params.cat);
  }, [params.cat]);
  useEffect(() => {
    if (params.focus) setTimeout(() => input.current?.focus(), 300);
  }, [params.focus]);

  const vmap = useMemo(() => getVariantsById(sold), [sold]);
  const stockFor = (pid: string, sz: number | null) => [...vmap.values()].some((v) => v.productId === pid && v.stock > 0 && (sz == null || v.size === sz));

  const list = useMemo(() => {
    const pr = PRICE.find((p) => p.id === price)!;
    const query = norm(q);
    let r = products.filter(
      (p) =>
        (cat === 'all' || p.categorySlug === cat) &&
        p.sellingPrice >= pr.min &&
        p.sellingPrice <= pr.max &&
        (!query || norm(p.name + ' ' + p.categorySlug + ' ' + p.colours.map((c) => c.name).join(' ')).includes(query)) &&
        (!size || stockFor(p.id, size)) &&
        (!inStockOnly || stockFor(p.id, null)),
    );
    r = [...r].sort((a, b) =>
      sort === 'low' ? a.sellingPrice - b.sellingPrice : sort === 'high' ? b.sellingPrice - a.sellingPrice : sort === 'new' ? b.createdAt.localeCompare(a.createdAt) : Number(b.isFeatured) - Number(a.isFeatured),
    );
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, sort, price, size, inStockOnly, vmap]);

  const colW = (Math.min(width, 520) - space.lg * 2 - 12) / 2;
  const activeFilters = Number(price !== 'all') + Number(!!size) + Number(inStockOnly);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', paddingHorizontal: space.lg, marginBottom: space.md }}>Categories</Text>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.lg }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46 }}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput
            ref={input}
            value={q}
            onChangeText={setQ}
            placeholder="Search sneakers, casuals, sports shoes..."
            placeholderTextColor="#6B7280"
            style={{ flex: 1, color: colors.text, fontSize: 14, height: 46 }}
            accessibilityLabel="Search products"
            returnKeyType="search"
          />
          {!!q && (
            <Pressable onPress={() => setQ('')} accessibilityLabel="Clear search" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => setShowFilters(!showFilters)} style={[ui.iconBtn, { width: 46, height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: showFilters || activeFilters ? colors.gold : colors.border }]} accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={20} color={activeFilters ? colors.gold : colors.text} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: space.md }} contentContainerStyle={{ paddingHorizontal: space.lg, gap: 8 }}>
        <Chip label="All" active={cat === 'all'} onPress={() => setCat('all')} />
        {categories.map((c) => (
          <Chip key={c.slug} label={c.name} active={cat === c.slug} onPress={() => setCat(c.slug)} />
        ))}
      </ScrollView>

      {showFilters && (
        <View style={{ marginHorizontal: space.lg, marginTop: space.md, padding: space.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '700' }}>SORT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SORTS.map((x) => <Chip key={x.id} label={x.label} active={sort === x.id} onPress={() => setSort(x.id)} />)}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '700' }}>PRICE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRICE.map((x) => <Chip key={x.id} label={x.label} active={price === x.id} onPress={() => setPrice(x.id)} />)}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '700' }}>SIZE (UK, in stock)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SIZES.map((z) => <Chip key={z} label={`UK ${z}`} active={size === z} onPress={() => setSize(size === z ? null : z)} />)}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="In stock only" active={inStockOnly} onPress={() => setInStockOnly(!inStockOnly)} />
            <Chip label="Reset" onPress={() => { setPrice('all'); setSize(null); setInStockOnly(false); setSort('featured'); }} />
          </View>
        </View>
      )}

      <FlatList
        data={list}
        key={colW}
        numColumns={2}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: space.lg, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={<Text style={{ color: colors.textDim, fontSize: 12 }}>{list.length} styles</Text>}
        renderItem={({ item }) => <ProductCard product={item} width={colW} inStock={stockFor(item.id, null)} />}
        ListEmptyComponent={<EmptyState icon="search" title="No matching footwear" text="Try a different search or clear some filters." />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
