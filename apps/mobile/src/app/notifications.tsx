import { ScrollView, Text, View } from 'react-native';
import { EmptyState, TopBar, fmtDateTime, s as ui } from '@/components/ui';
import { useMyOrders } from '@/hooks/queries';
import { statusLabel } from '@/stores/shop';
import { colors, space } from '@/theme';

/** In-app notifications built from real order status events. Push notifications need a provider (not set up yet). */
export default function Notifications() {
  const { data: orders = [] } = useMyOrders();
  const events = orders
    .flatMap((o) => o.history.map((h) => ({ key: o.id + h.status, title: `${statusLabel[h.status]} · #${o.orderNumber}`, at: h.at })))
    .sort((a, b) => b.at.localeCompare(a.at));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Notifications" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: 10 }}>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>Push notifications are not set up yet. Order updates appear here.</Text>
        {events.length === 0 && <EmptyState icon="notifications-outline" title="No notifications yet" />}
        {events.map((e) => (
          <View key={e.key} style={ui.card}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{e.title}</Text>
            <Text style={{ color: colors.textDim, fontSize: 12 }}>{fmtDateTime(e.at)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
