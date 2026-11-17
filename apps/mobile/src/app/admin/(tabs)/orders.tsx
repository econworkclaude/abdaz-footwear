import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusPill } from '@/components/admin';
import { Chip, EmptyState, ErrorState, Skeleton, fmtDateTime, s as ui } from '@/components/ui';
import { useAdminOrders } from '@/hooks/queries';
import { colors, formatINR, radius, space } from '@/theme';
import type { OrderStatus } from '@/types';

const FILTERS: { id: string; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: 'new', label: 'New', match: (s) => s === 'placed' },
  { id: 'active', label: 'In progress', match: (s) => ['confirmed', 'packed', 'out_for_delivery', 'delivery_failed'].includes(s) },
  { id: 'done', label: 'Delivered', match: (s) => s === 'delivered' },
  { id: 'closed', label: 'Cancelled / Returned', match: (s) => ['cancelled', 'returned', 'refunded'].includes(s) },
  { id: 'all', label: 'All', match: () => true },
];

export default function AdminOrders() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading, error, refetch, isRefetching } = useAdminOrders();
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  const filter = FILTERS.find((x) => x.id === f)!;
  const list = data.filter((o) => filter.match(o.status) && (!q || `${o.orderNumber} ${o.address.fullName} ${o.address.phone} ${o.address.area}`.toLowerCase().includes(q.toLowerCase())));
  const count = (id: string) => data.filter((o) => FILTERS.find((x) => x.id === id)!.match(o.status)).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', paddingHorizontal: space.lg }}>Orders</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.lg, marginTop: space.md, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44 }}>
        <Ionicons name="search" size={16} color={colors.textDim} />
        <TextInput value={q} onChangeText={setQ} placeholder="Order no, name, phone or area" placeholderTextColor="#6B7280" style={{ flex: 1, color: colors.text, height: 44 }} accessibilityLabel="Search orders" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: space.lg, marginTop: space.md }}>
        {FILTERS.map((x) => (
          <Chip key={x.id} label={`${x.label} ${count(x.id)}`} active={f === x.id} onPress={() => setF(x.id)} />
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ padding: space.lg, gap: 10 }}
        ListEmptyComponent={isLoading ? <Skeleton w="100%" h={90} /> : error ? <ErrorState error={error} onRetry={() => void refetch()} /> : <EmptyState icon="receipt-outline" title="No orders here" />}
        renderItem={({ item: o }) => (
          <Pressable onPress={() => router.push(`/admin/order/${o.id}`)} style={[ui.card, { gap: 6, padding: 14, borderColor: o.status === 'placed' ? colors.warning : colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>#{o.orderNumber}</Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{formatINR(o.total)}</Text>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 13 }}>
              {o.address.fullName} · {o.address.area} · {o.items.reduce((n, i) => n + i.quantity, 0)} pair(s) · {o.paymentMethod.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusPill status={o.status} />
              <Text style={{ color: colors.textDim, fontSize: 12 }}>{fmtDateTime(o.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
