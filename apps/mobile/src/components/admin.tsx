import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { statusLabel } from '@/stores/shop';
import { colors, radius } from '@/theme';
import type { OrderStatus } from '@/types';

export const statusTone = (s: OrderStatus) =>
  s === 'delivered' ? colors.success : s === 'cancelled' || s === 'delivery_failed' ? colors.danger : s === 'placed' ? colors.warning : s === 'returned' || s === 'refunded' ? '#9B8CFF' : colors.gold;

export function StatusPill({ status }: { status: OrderStatus }) {
  const c = statusTone(status);
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: c + '26', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>{statusLabel[status]}</Text>
    </View>
  );
}

export function StatCard({ icon, label, value, tone = colors.gold, wide }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone?: string; wide?: boolean }) {
  return (
    <View style={{ flexBasis: wide ? '100%' : '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: tone + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={16} color={tone} />
        </View>
        <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '600', flex: 1 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

export const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  placed: { to: 'confirmed', label: 'Confirm order (stock checked)', icon: 'checkmark-done' },
  confirmed: { to: 'packed', label: 'Mark packed (quality checked)', icon: 'cube' },
  packed: { to: 'out_for_delivery', label: 'Send out for delivery', icon: 'bicycle' },
  out_for_delivery: { to: 'delivered', label: 'Mark delivered (cash collected)', icon: 'home' },
  delivery_failed: { to: 'out_for_delivery', label: 'Retry delivery', icon: 'refresh' },
  delivered: { to: 'returned', label: 'Record return', icon: 'return-down-back' },
  returned: { to: 'refunded', label: 'Mark refunded', icon: 'cash' },
};
