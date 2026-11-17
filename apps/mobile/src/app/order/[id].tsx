import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { toast } from '@/components/Toast';
import { ErrorState, OutlineButton, Row, Skeleton, StatusTimeline, TopBar, fmtDateTime, s as ui } from '@/components/ui';
import { IS_LIVE } from '@/config';
import { invalidateOrders, useCatalog, useOrder } from '@/hooks/queries';
import { api } from '@/services/api';
import { TRANSITIONS } from '@/services/demoDb';
import { statusLabel } from '@/stores/shop';
import { colors, formatINR, radius, space } from '@/theme';

/** Order details + status-only tracking. No map or rider GPS until a real integration exists. */
export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error, refetch, isRefetching } = useOrder(id);
  const { catalog } = useCatalog();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  if (isLoading || error || !order)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Track Order" />
        {isLoading ? (
          <View style={{ padding: space.lg, gap: 12 }}>
            <Skeleton w="100%" h={80} />
            <Skeleton w="100%" h={300} />
          </View>
        ) : (
          <ErrorState error={error ?? new Error('Order not found.')} onRetry={() => void refetch()} />
        )}
      </View>
    );

  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const finished = ['delivered', 'cancelled', 'refunded'].includes(order.status);
  const wa = catalog?.settings.whatsappNumber;
  const support = () => {
    const text = encodeURIComponent(`Hi ABDAZ FOOTWEAR, I need help with my order #${order.orderNumber}.`);
    if (wa) Linking.openURL(`https://wa.me/${wa}?text=${text}`).catch(() => toast('Could not open WhatsApp', 'error'));
    else router.push('/support');
  };
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      const o = await fn();
      qc.setQueryData(['order', id], o);
      void invalidateOrders();
      toast(ok);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };
  const nextDemo = TRANSITIONS[order.status].find((s) => s !== 'cancelled' && s !== 'delivery_failed');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Track Order" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.gold} />}>
        <View style={[ui.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cube" size={24} color={colors.textOnGold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Order #{order.orderNumber}</Text>
            <Text style={{ color: colors.textDim, fontSize: 12 }}>Placed {fmtDateTime(order.createdAt)}</Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{formatINR(order.total)}</Text>
        </View>

        <View style={ui.card}>
          <Text style={[ui.section, { marginBottom: 14 }]}>{statusLabel[order.status]}</Text>
          <StatusTimeline order={order} />
          {!finished && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="time-outline" size={16} color={colors.gold} />
              <Text style={{ color: colors.textDim, fontSize: 13, flex: 1 }}>Estimated delivery: up to {order.etaMinutes} min after confirmation</Text>
            </View>
          )}
        </View>

        <View style={[ui.card, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
          <Ionicons name="map-outline" size={20} color={colors.textDim} />
          <Text style={{ color: colors.textDim, fontSize: 12, flex: 1 }}>Live map tracking will appear once a maps provider and rider app are connected. Until then you'll see each status update here.</Text>
        </View>

        {!IS_LIVE && nextDemo && (
          <View style={{ gap: 6 }}>
            <OutlineButton title="DEMO: move to next status" icon="play-forward" disabled={busy} onPress={() => void run(() => api.adminSetStatus(order.id, nextDemo), statusLabel[nextDemo])} />
            <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center' }}>In the real app the store updates this from the ABDAZ Admin app.</Text>
          </View>
        )}

        <View style={[ui.card, { gap: 8 }]}>
          <Text style={ui.section}>Items</Text>
          {order.items.map((it) => (
            <View key={it.variantId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ color: colors.text, flex: 1 }}>
                {it.productName} · {it.colourName} · UK {it.size} × {it.quantity}
              </Text>
              <Text style={{ color: colors.text }}>{formatINR(it.unitPrice * it.quantity)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          <Row label="Delivery fee" value={formatINR(order.deliveryFee)} />
          <Row label="Total" value={formatINR(order.total)} bold />
          <Row label="Payment" value={`${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'} · ${order.paymentStatus}`} />
        </View>

        <View style={[ui.card, { gap: 4 }]}>
          <Text style={ui.section}>Delivery address</Text>
          <Text style={{ color: colors.textDim }}>
            {order.address.fullName}, {order.address.house}, {order.address.street}, {order.address.area}, {order.address.city} - {order.address.pincode}
          </Text>
        </View>

        <OutlineButton title="Contact Support" icon="logo-whatsapp" onPress={support} />
        {canCancel && <OutlineButton title="Cancel Order" icon="close-circle-outline" disabled={busy} onPress={() => void run(() => api.cancelMyOrder(order.id), 'Order cancelled')} />}
      </ScrollView>
    </View>
  );
}
