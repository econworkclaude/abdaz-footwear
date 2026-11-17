import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '@/components/Toast';
import { Field, GoldButton, Notice, OutlineButton, s as ui } from '@/components/ui';
import { IS_LIVE } from '@/config';
import { queryClient, useCatalog } from '@/hooks/queries';
import { api } from '@/services/api';
import { demo } from '@/services/demoDb';
import { useSession } from '@/stores/session';
import { colors, space } from '@/theme';
import type { DeliveryZone, Settings } from '@/types';

export default function StoreSettings() {
  const insets = useSafeAreaInsets();
  const { catalog } = useCatalog();
  const session = useSession((s) => s.session);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (catalog) {
      setSettings(catalog.settings);
      setZones(catalog.zones);
    }
  }, [catalog]);

  const saveAll = async () => {
    if (!settings) return;
    if (settings.whatsappNumber && !/^91[6-9]\d{9}$/.test(settings.whatsappNumber)) return toast('WhatsApp number must be 91 followed by 10 digits', 'error');
    setBusy(true);
    try {
      await api.adminSaveSettings(settings);
      for (const z of zones) {
        const before = catalog?.zones.find((x) => x.id === z.id);
        if (JSON.stringify(before) !== JSON.stringify(z)) await api.adminSaveZone(z);
      }
      await queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast('Store settings saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };
  const setZone = (id: string, patch: Partial<DeliveryZone>) => setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, padding: space.lg, gap: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Store</Text>

      <View style={[ui.card, { gap: 12 }]}>
        <Text style={ui.section}>Delivery zones</Text>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>Turn a zone on only once you can really deliver there. Customers see the fee and time before ordering.</Text>
        {zones.map((z) => (
          <View key={z.id} style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{z.name}</Text>
                <Text style={{ color: colors.textDim, fontSize: 12 }}>{z.areas.join(', ')}</Text>
              </View>
              <Switch value={z.isActive} onValueChange={(v) => setZone(z.id, { isActive: v })} trackColor={{ true: colors.success, false: colors.border }} thumbColor="#fff" accessibilityLabel={`${z.name} active`} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field label="Fee ₹" keyboardType="numeric" value={String(z.deliveryFee)} onChangeText={(t) => setZone(z.id, { deliveryFee: Number(t.replace(/\D/g, '')) || 0 })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Up to (min)" keyboardType="numeric" value={String(z.etaMinutes)} onChangeText={(t) => setZone(z.id, { etaMinutes: Number(t.replace(/\D/g, '')) || 0 })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Min order ₹" keyboardType="numeric" value={String(z.minimumOrder)} onChangeText={(t) => setZone(z.id, { minimumOrder: Number(t.replace(/\D/g, '')) || 0 })} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {settings && (
        <View style={[ui.card, { gap: 6 }]}>
          <Text style={[ui.section, { marginBottom: 6 }]}>Payments & support</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Accept Cash on Delivery</Text>
            <Switch value={settings.codEnabled} onValueChange={(v) => setSettings({ ...settings, codEnabled: v })} trackColor={{ true: colors.gold, false: colors.border }} thumbColor="#fff" accessibilityLabel="Accept Cash on Delivery" />
          </View>
          <Field label="COD limit per order ₹" keyboardType="numeric" value={String(settings.codMaxOrder)} onChangeText={(t) => setSettings({ ...settings, codMaxOrder: Number(t.replace(/\D/g, '')) || 0 })} />
          <Field label="WhatsApp business number (91XXXXXXXXXX)" keyboardType="number-pad" value={settings.whatsappNumber} onChangeText={(t) => setSettings({ ...settings, whatsappNumber: t.replace(/\D/g, '') })} />
          <Field label="Support phone shown to customers" keyboardType="phone-pad" value={settings.supportPhone} onChangeText={(t) => setSettings({ ...settings, supportPhone: t })} />
          <Field label="Size exchange window (days)" keyboardType="numeric" value={String(settings.exchangeWindowDays)} onChangeText={(t) => setSettings({ ...settings, exchangeWindowDays: Number(t.replace(/\D/g, '')) || 0 })} />
          <Text style={{ color: colors.textDim, fontSize: 12 }}>UPI: {settings.upiConfigured ? 'connected' : 'not set up yet (needs a payment gateway account)'}</Text>
        </View>
      )}
      <GoldButton title="Save store settings" icon="save" loading={busy} onPress={saveAll} />

      <View style={[ui.card, { gap: 8 }]}>
        <Text style={ui.section}>Account</Text>
        <Text style={{ color: colors.textDim }}>{session?.email ?? session?.name}</Text>
        {!IS_LIVE && <Notice tone="info" title="Demo mode" text="This admin app is not connected to the store database yet, so it shows sample orders." />}
        {!IS_LIVE && (
          <Pressable onPress={() => { demo.reset(); void queryClient.invalidateQueries(); toast('Demo data reset', 'info'); }} style={{ paddingVertical: 6 }}>
            <Text style={{ color: colors.textDim }}>
              <Ionicons name="refresh" size={12} /> Reset demo data
            </Text>
          </Pressable>
        )}
        <OutlineButton title="Log out" icon="log-out-outline" onPress={() => void useSession.getState().signOut().then(() => router.replace('/admin/login'))} />
      </View>
    </ScrollView>
  );
}
