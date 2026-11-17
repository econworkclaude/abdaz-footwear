import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/Art';
import { StatCard, StatusPill } from '@/components/admin';
import { DemoBanner, ErrorState, Skeleton, fmtDateTime, s as ui } from '@/components/ui';
import { useAdminDashboard, useAdminOrders, useCatalog } from '@/hooks/queries';
import { colors, formatINR, space } from '@/theme';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const d = useAdminDashboard();
  const o = useAdminOrders();
  const { catalog, productsById } = useCatalog();
  const low = (catalog?.variants ?? []).filter((v) => v.stock <= 2).sort((a, b) => a.stock - b.stock).slice(0, 6);
  const needsAction = (o.data ?? []).filter((x) => ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivery_failed'].includes(x.status));
  const refresh = () => {
    void d.refetch();
    void o.refetch();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={d.isRefetching} onRefresh={refresh} tintColor={colors.gold} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.lg, marginBottom: space.md }}>
        <LogoMark size={34} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Store Dashboard</Text>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
      </View>
      <DemoBanner text="DEMO MODE · sample orders on this phone. Connect Supabase to see real orders." />

      {d.error ? (
        <ErrorState error={d.error} onRetry={refresh} />
      ) : !d.data ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: space.lg }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} w="47%" h={90} />)}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: space.lg }}>
          <StatCard icon="today" label="Today's orders" value={String(d.data.todayOrders)} />
          <StatCard icon="cash" label="Today's sales" value={formatINR(d.data.todaySales)} tone={colors.success} />
          <StatCard icon="hourglass" label="To process" value={String(d.data.pending)} tone={colors.warning} />
          <StatCard icon="bicycle" label="Out for delivery" value={String(d.data.outForDelivery)} />
          <StatCard icon="checkmark-done" label="Delivered" value={String(d.data.completed)} tone={colors.success} />
          <StatCard icon="close-circle" label="Cancelled" value={String(d.data.cancelled)} tone={colors.danger} />
          <StatCard icon="trending-up" label="Revenue from delivered orders" value={formatINR(d.data.revenue)} tone={colors.goldLight} wide />
        </View>
      )}

      <Text style={[ui.section, { paddingHorizontal: space.lg, marginTop: space.xl, marginBottom: space.md }]}>Needs action ({needsAction.length})</Text>
      <View style={{ paddingHorizontal: space.lg, gap: 10 }}>
        {needsAction.length === 0 && <Text style={{ color: colors.textDim }}>All caught up. New orders will appear here.</Text>}
        {needsAction.slice(0, 6).map((x) => (
          <Pressable key={x.id} onPress={() => router.push(`/admin/order/${x.id}`)} style={[ui.card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>#{x.orderNumber} · {formatINR(x.total)}</Text>
              <Text style={{ color: colors.textDim, fontSize: 12 }}>{x.address.area} · {fmtDateTime(x.createdAt)}</Text>
              <StatusPill status={x.status} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </Pressable>
        ))}
      </View>

      <Text style={[ui.section, { paddingHorizontal: space.lg, marginTop: space.xl, marginBottom: space.md }]}>Low stock ({d.data?.lowStock ?? '…'})</Text>
      <View style={{ paddingHorizontal: space.lg, gap: 8 }}>
        {low.map((v) => {
          const p = productsById.get(v.productId);
          return (
            <Pressable key={v.id} onPress={() => router.push(`/admin/product/${v.productId}`)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                {p?.name} · {p?.colours.find((c) => c.id === v.colourId)?.name} · UK {v.size}
              </Text>
              <Text style={{ color: v.stock === 0 ? colors.danger : colors.warning, fontWeight: '800' }}>{v.stock === 0 ? 'Sold out' : `${v.stock} left`}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
