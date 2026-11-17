import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, formatINR, goldGradient, radius, space } from '@/theme';
import { ORDER_FLOW, statusLabel } from '@/stores/shop';
import type { Order } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

export function GoldButton({ title, onPress, icon, disabled, loading, style }: { title: string; onPress?: () => void; icon?: IconName; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: disabled ? 0.45 : 1 }, style]}
    >
      <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.goldBtn}>
        {loading ? <ActivityIndicator color={colors.textOnGold} /> : icon ? <Ionicons name={icon} size={18} color={colors.textOnGold} /> : null}
        <Text style={s.goldBtnText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ title, onPress, icon, style, disabled }: { title: string; onPress?: () => void; icon?: IconName; style?: ViewStyle; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.outlineBtn, { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: disabled ? 0.45 : 1 }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={colors.gold} />}
      <Text style={s.outlineBtnText}>{title}</Text>
    </Pressable>
  );
}

export function IconBtn({ name, onPress, color = colors.text, label, badge }: { name: IconName; onPress?: () => void; color?: string; label: string; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={10} style={s.iconBtn}>
      <Ionicons name={name} size={22} color={color} />
      {!!badge && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function TopBar({ title, right, back = true }: { title: string; right?: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
      {back ? <IconBtn name="arrow-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : <View style={{ width: 4 }} />}
      <Text style={s.topTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View>
    </View>
  );
}

export function DemoBanner({ text = 'DEMO MODE · sample products, no real payments or deliveries' }: { text?: string }) {
  return (
    <View style={s.demo} accessibilityRole="text">
      <Ionicons name="flask-outline" size={13} color={colors.goldLight} />
      <Text style={s.demoText}>{text}</Text>
    </View>
  );
}

export function Price({ price, mrp, size = 'md' }: { price: number; mrp?: number; size?: 'md' | 'lg' }) {
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: size === 'lg' ? 26 : 15 }}>{formatINR(price)}</Text>
      {off > 0 && <Text style={{ color: colors.textDim, textDecorationLine: 'line-through', fontSize: size === 'lg' ? 15 : 12 }}>{formatINR(mrp!)}</Text>}
      {off > 0 && size === 'lg' && (
        <View style={s.offPill}>
          <Text style={s.offText}>{off}% OFF</Text>
        </View>
      )}
      {off > 0 && size === 'md' && <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>{off}% off</Text>}
    </View>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor="#6B7280" style={[s.input, error ? { borderColor: colors.danger } : null]} accessibilityLabel={label} {...props} />
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

export function Chip({ label, active, onPress, disabled }: { label: string; active?: boolean; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      style={[s.chip, active && { backgroundColor: colors.gold, borderColor: colors.gold }, disabled && { opacity: 0.35 }]}
    >
      <Text style={[s.chipText, active && { color: colors.textOnGold }, disabled && { textDecorationLine: 'line-through' }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: space.xxl, gap: space.md }}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.gold} />
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
      {!!text && <Text style={{ color: colors.textDim, textAlign: 'center' }}>{text}</Text>}
      {action}
    </View>
  );
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ color: bold ? colors.text : colors.textDim, fontWeight: bold ? '800' : '400', fontSize: bold ? 16 : 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: bold ? '800' : '600', fontSize: bold ? 16 : 14 }}>{value}</Text>
    </View>
  );
}

export function StatusTimeline({ order }: { order: Order }) {
  const cancelled = order.status === 'cancelled';
  const idx = ORDER_FLOW.indexOf(order.status);
  return (
    <View style={{ gap: 0 }}>
      {ORDER_FLOW.map((st, i) => {
        const ev = order.history.find((h) => h.status === st);
        const done = !cancelled && i <= idx;
        const current = !cancelled && i === idx;
        return (
          <View key={st} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 24 }}>
              <View style={[s.dot, done && { backgroundColor: colors.success, borderColor: colors.success }, current && { transform: [{ scale: 1.15 }] }]}>
                {done && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              {i < ORDER_FLOW.length - 1 && <View style={[s.line, done && i < idx && { backgroundColor: colors.success }]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}>
              <Text style={{ color: done ? colors.text : colors.textDim, fontWeight: current ? '800' : '600' }}>{statusLabel[st]}</Text>
              <Text style={{ color: colors.textDim, fontSize: 12 }}>{ev ? fmtDateTime(ev.at) : 'Pending'}</Text>
            </View>
          </View>
        );
      })}
      {cancelled && (
        <View style={[s.notice, { borderColor: colors.danger }]}>
          <Ionicons name="close-circle" size={18} color={colors.danger} />
          <Text style={{ color: colors.text }}>Cancelled {fmtDateTime(order.history[order.history.length - 1].at)}</Text>
        </View>
      )}
    </View>
  );
}

export function Notice({ tone = 'success', icon, title, text }: { tone?: 'success' | 'danger' | 'info'; icon?: IconName; title: string; text?: string }) {
  const c = tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.gold;
  return (
    <View style={[s.notice, { borderColor: c, backgroundColor: c + '1F' }]}>
      <Ionicons name={icon ?? (tone === 'success' ? 'checkmark-circle' : tone === 'danger' ? 'alert-circle' : 'information-circle')} size={20} color={c} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
        {!!text && <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 2 }}>{text}</Text>}
      </View>
    </View>
  );
}

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

export const s = StyleSheet.create({
  goldBtn: { height: 52, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  goldBtnText: { color: colors.textOnGold, fontWeight: '800', fontSize: 16 },
  outlineBtn: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, backgroundColor: colors.bg2 },
  outlineBtnText: { color: colors.gold, fontWeight: '700', fontSize: 15 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg2 },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.textOnGold, fontSize: 10, fontWeight: '800' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, paddingBottom: 10, backgroundColor: colors.bg },
  topTitle: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '800' },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2210', borderColor: '#5A4618', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, marginHorizontal: space.lg, marginBottom: space.sm },
  demoText: { color: colors.goldLight, fontSize: 11, fontWeight: '600', flex: 1 },
  offPill: { backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  offText: { color: colors.textOnGold, fontWeight: '800', fontSize: 12 },
  fieldLabel: { color: colors.textDim, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, paddingHorizontal: 14, height: 48, fontSize: 15 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg2 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  lightCard: { backgroundColor: colors.cardLight, borderRadius: radius.lg, padding: space.md },
  section: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
