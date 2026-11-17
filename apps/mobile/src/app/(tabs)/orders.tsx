import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoeArt } from '@/components/Art';
import { Chip, EmptyState, ErrorState, GoldButton, Skeleton, fmtDateTime, s as ui } from '@/components/ui';
import { useCatalog, useMyOrders } from '@/hooks/queries';
import { useSession } from '@/stores/session';
import { statusLabel } from '@/stores/shop';
import { colors, formatINR, radius, space } from '@/theme';
import type { OrderStatus } from '@/types';

const TABS: { id: string; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'ongoing', label: 'Ongoing', match: (s) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(s) },
  { id: 'done', label: 'Completed', match: (s) => s === 'delivered' },
  { id: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
  { id: 'returned', label: 'Returned', match: (s) => s === 'returned' || s === 'refunded' },
];

export default function Orders() {
  const insets = useSafeAreaInsets();
  const signedIn = useSession((s) => !!s.session);
  const { data: orders = [], isLoading, error, refetch, isRefetching } = useMyOrders();
  const { productsById } = useCatalog();
  const [tab, setTab] = useState('all');
  const list = orders.filter((o) => TABS.find((t) => t.id === tab)!.match(o.status));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', paddingHorizontal: space.lg, marginBottom: space.md }}>My Orders</Text>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.lg, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <Chip key={t.id} label={t.label} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: space.lg, gap: 12 }}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        ListEmptyComponent={
          !signedIn ? (
            <EmptyState icon="person-circle-outline" title="Sign in to see your orders" action={<GoldButton title="Sign In" onPress={() => router.push('/login')} />} />
          ) : isLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton w="100%" h={84} />
              <Skeleton w="100%" h={84} />
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState icon="cube-outline" title="No orders here yet" text="Orders you place will show up here." action={<GoldButton title="Shop Now" onPress={() => router.push('/(tabs)')} />} />
          )
        }
        renderItem={({ item: o }) => {
          const p = productsById.get(o.items[0]?.productId);
          const colour = p?.colours.find((c) => o.items[0].variantId.includes(`-${c.id}-`));
          const tone = o.status === 'delivered' ? colors.success : o.status === 'cancelled' ? colors.danger : colors.gold;
          return (
            <Pressable onPress={() => router.push(`/order/${o.id}`)} style={[ui.card, { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 }]}>
              <View style={{ width: 72, height: 60, borderRadius: radius.md, backgroundColor: colors.cardLight, alignItems: 'center', justifyContent: 'center' }}>
                {p ? <ShoeArt product={p} colour={colour} width={68} /> : <Ionicons name="cube-outline" size={28} color="#777" />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>#{o.orderNumber}</Text>
                <Text style={{ color: colors.textDim, fontSize: 12 }}>
                  {o.items.reduce((n, i) => n + i.quantity, 0)} item(s) · {formatINR(o.total)} · {fmtDateTime(o.createdAt)}
                </Text>
                <View style={{ alignSelf: 'flex-start', backgroundColor: tone + '26', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: tone, fontSize: 12, fontWeight: '700' }}>{statusLabel[o.status]}</Text>
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
