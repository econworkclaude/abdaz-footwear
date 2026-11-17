import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { NEXT_ACTION, StatusPill } from '@/components/admin';
import { toast } from '@/components/Toast';
import { ErrorState, GoldButton, OutlineButton, Row, Skeleton, StatusTimeline, TopBar, fmtDateTime, s as ui } from '@/components/ui';
import { invalidateOrders, useOrder } from '@/hooks/queries';
import { api } from '@/services/api';
import { TRANSITIONS } from '@/services/demoDb';
import { statusLabel } from '@/stores/shop';
import { colors, formatINR, space } from '@/theme';
import type { OrderStatus } from '@/types';

export default function AdminOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: o, isLoading, error, refetch } = useOrder(id);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!o)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Order" />
        {isLoading ? <Skeleton w="100%" h={300} style={{ margin: space.lg }} /> : <ErrorState error={error ?? new Error('Order not found')} onRetry={() => void refetch()} />}
      </View>
    );

  const move = async (to: OrderStatus) => {
    setBusy(to);
    try {
      const updated = await api.adminSetStatus(o.id, to);
      qc.setQueryData(['order', id], updated);
      void invalidateOrders();
      toast(`#${o.orderNumber}: ${statusLabel[to]}`);
      setConfirmCancel(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update', 'error');
    } finally {
      setBusy(null);
    }
  };
  const next = NEXT_ACTION[o.status];
  const allowed = TRANSITIONS[o.status];
  const phone = o.address.phone;
  const wa = () => Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(`Hi ${o.address.fullName}, this is ABDAZ FOOTWEAR about your order #${o.orderNumber}.`)}`).catch(() => toast('Could not open WhatsApp', 'error'));
  const maps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.address.house} ${o.address.street} ${o.address.area} ${o.address.city} ${o.address.pincode}`)}`).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={`#${o.orderNumber}`} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 60 }}>
        <View style={[ui.card, { gap: 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusPill status={o.status} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 22 }}>{formatINR(o.total)}</Text>
          </View>
          <Text style={{ color: colors.textDim }}>
            Placed {fmtDateTime(o.createdAt)} · {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'} ({o.paymentStatus})
          </Text>
          {o.paymentMethod === 'cod' && !['delivered', 'cancelled', 'refunded'].includes(o.status) && (
            <Text style={{ color: colors.warning, fontWeight: '700' }}>Collect {formatINR(o.total)} in cash on delivery</Text>
          )}
        </View>

        {next && allowed.includes(next.to) && <GoldButton title={next.label} icon={next.icon} loading={busy === next.to} disabled={!!busy} onPress={() => void move(next.to)} />}
        {allowed.includes('delivery_failed') && <OutlineButton title="Delivery failed" icon="alert-circle-outline" disabled={!!busy} onPress={() => void move('delivery_failed')} />}
        {allowed.includes('cancelled') &&
          (confirmCancel ? (
            <View style={[ui.card, { gap: 10, borderColor: colors.danger }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel #{o.orderNumber}? Stock will be returned and the customer is notified.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <OutlineButton title="Keep order" onPress={() => setConfirmCancel(false)} style={{ flex: 1 }} />
                <Pressable onPress={() => void move('cancelled')} style={{ flex: 1, height: 52, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Cancel order</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <OutlineButton title="Cancel order" icon="close-circle-outline" disabled={!!busy} onPress={() => setConfirmCancel(true)} />
          ))}

        <View style={[ui.card, { gap: 8 }]}>
          <Text style={ui.section}>Customer</Text>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{o.address.fullName}</Text>
          <Text selectable style={{ color: colors.textDim }}>
            +91 {phone}
            {o.customerPhone && o.customerPhone !== '+91' + phone ? ` · account ${o.customerPhone}` : ''}
          </Text>
          <Text selectable style={{ color: colors.textDim }}>
            {o.address.house}, {o.address.street}, {o.address.area}
            {o.address.landmark ? ` (near ${o.address.landmark})` : ''}, {o.address.city} - {o.address.pincode}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <OutlineButton title="Call" icon="call" onPress={() => Linking.openURL(`tel:+91${phone}`).catch(() => {})} style={{ flex: 1, height: 44 }} />
            <OutlineButton title="WhatsApp" icon="logo-whatsapp" onPress={wa} style={{ flex: 1, height: 44 }} />
            <OutlineButton title="Map" icon="navigate" onPress={maps} style={{ flex: 1, height: 44 }} />
          </View>
        </View>

        <View style={[ui.card, { gap: 8 }]}>
          <Text style={ui.section}>Pick list</Text>
          {o.items.map((it) => (
            <View key={it.variantId} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Ionicons name="footsteps" size={18} color={colors.gold} />
              <Text style={{ color: colors.text, flex: 1 }}>
                {it.productName}
                {'\n'}
                <Text style={{ color: colors.textDim }}>
                  {it.colourName} · UK {it.size} · qty {it.quantity}
                </Text>
              </Text>
              <Text style={{ color: colors.text }}>{formatINR(it.unitPrice * it.quantity)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <Row label="Subtotal" value={formatINR(o.subtotal)} />
          <Row label="Delivery fee" value={formatINR(o.deliveryFee)} />
          <Row label="Total" value={formatINR(o.total)} bold />
        </View>

        <View style={ui.card}>
          <Text style={[ui.section, { marginBottom: 12 }]}>Timeline</Text>
          <StatusTimeline order={o} />
        </View>
      </ScrollView>
    </View>
  );
}
