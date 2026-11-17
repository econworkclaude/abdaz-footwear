import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { EmptyState, OutlineButton, Row, StatusTimeline, TopBar, fmtDateTime, s as ui } from '@/components/ui';
import { settings } from '@/data/demo';
import { statusLabel, useShop } from '@/stores/shop';
import { colors, formatINR, radius, space } from '@/theme';

/** Order details + status-only tracking. No map or rider GPS until a real integration exists. */
export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useShop((s) => s.orders.find((o) => o.id === id));
  const advance = useShop((s) => s.demoAdvanceOrder);
  const cancel = useShop((s) => s.cancelOrder);
  const [msg, setMsg] = useState('');

  if (!order)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Track Order" />
        <EmptyState icon="cube-outline" title="Order not found" />
      </View>
    );

  const canCancel = ['placed', 'confirmed'].includes(order.status);
  const finished = ['delivered', 'cancelled'].includes(order.status);
  const support = () => {
    const text = encodeURIComponent(`Hi ABDAZ FOOTWEAR, I need help with my order #${order.orderNumber}.`);
    if (settings.whatsappNumber) Linking.openURL(`https://wa.me/${settings.whatsappNumber}?text=${text}`);
    else router.push('/support');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Track Order" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 60 }}>
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
              <Text style={{ color: colors.textDim, fontSize: 13 }}>Estimated delivery: up to {order.etaMinutes} min after confirmation</Text>
            </View>
          )}
        </View>

        <View style={[ui.card, { gap: 6 }]}>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>Live map tracking will appear here once a maps provider and rider app are connected. Until then, tracking shows status updates only.</Text>
        </View>

        {!finished && (
          <View style={{ gap: 6 }}>
            <OutlineButton title="DEMO: move to next status" icon="play-forward" onPress={() => advance(order.id)} />
            <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center' }}>In the real app the shop updates this from the admin dashboard.</Text>
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
        {canCancel && (
          <OutlineButton
            title="Cancel Order"
            icon="close-circle-outline"
            onPress={() => {
              const r = cancel(order.id);
              setMsg(r.message);
            }}
          />
        )}
        {!!msg && <Text style={{ color: colors.textDim, textAlign: 'center' }}>{msg}</Text>}
      </ScrollView>
    </View>
  );
}
