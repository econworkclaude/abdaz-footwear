import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Chip, Field, GoldButton, Notice, OutlineButton, TopBar, s as ui } from '@/components/ui';
import { zones } from '@/data/demo';
import { findZoneForAddress, validateAddress } from '@/services/rules';
import { useShop } from '@/stores/shop';
import { colors, space } from '@/theme';
import type { Address, AddressType } from '@/types';

const AREA_PINS: Record<string, string> = { Hasthinapuram: '600064', Chromepet: '600044', Chitlapakkam: '600064', 'Tambaram Sanatorium': '600047' };

const blank = (phone?: string | null): Address => ({
  id: '', fullName: '', phone: phone?.replace('+91', '') ?? '', house: '', street: '', area: '', landmark: '', city: 'Chennai', state: 'Tamil Nadu', pincode: '', type: 'Home', isDefault: false,
});

/** Saved addresses list, plus add/edit form. Location permission is optional; manual entry always works. */
export default function AddressScreen() {
  const { mode } = useLocalSearchParams<{ mode?: 'select' }>();
  const { addresses, selectedAddressId, selectAddress, saveAddress, deleteAddress, phone } = useShop();
  const [editing, setEditing] = useState<Address | null>(addresses.length ? null : blank(phone));
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [zoneMsg, setZoneMsg] = useState('');

  if (editing) {
    const set = (k: keyof Address, v: string | boolean) => setEditing({ ...editing, [k]: v });
    const check = findZoneForAddress(zones, editing.area, editing.pincode);
    const save = () => {
      const e = validateAddress(editing);
      setErrors(e);
      if (Object.keys(e).length) return;
      const z = findZoneForAddress(zones, editing.area, editing.pincode);
      saveAddress({ ...editing, id: editing.id || `addr-${Date.now()}`, phone: editing.phone.trim(), pincode: editing.pincode.trim() });
      setZoneMsg(z.serviceable ? '' : z.reason);
      setEditing(null);
      if (mode === 'select' && z.serviceable) router.back();
    };
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar title={editing.id ? 'Edit Address' : 'Add Delivery Address'} />
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={[ui.section, { fontSize: 14, marginBottom: 8 }]}>Choose your area</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {Object.keys(AREA_PINS).map((a) => (
              <Chip key={a} label={a} active={editing.area === a} onPress={() => setEditing({ ...editing, area: a, pincode: editing.pincode || AREA_PINS[a] })} />
            ))}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 12 }}>Express delivery currently covers the four pilot areas above. You can type a different area below to check.</Text>
          <Field label="Area / Locality" value={editing.area} onChangeText={(t) => set('area', t)} error={errors.area} placeholder="e.g. Hasthinapuram" />
          {editing.area.trim().length > 2 && (
            <View style={{ marginBottom: 12 }}>
              {check.serviceable ? (
                <Notice title="Delivery available in your area" text={`Estimated time: up to ${check.zone!.etaMinutes} min · Fee ₹${check.zone!.deliveryFee}`} />
              ) : (
                <Notice tone="danger" title="Not serviceable yet" text={check.reason} />
              )}
            </View>
          )}
          <Field label="Full Name" value={editing.fullName} onChangeText={(t) => set('fullName', t)} error={errors.fullName} autoComplete="name" />
          <Field label="Mobile Number" value={editing.phone} onChangeText={(t) => set('phone', t.replace(/\D/g, ''))} error={errors.phone} keyboardType="number-pad" maxLength={10} />
          <Field label="House / Flat Number" value={editing.house} onChangeText={(t) => set('house', t)} error={errors.house} />
          <Field label="Street" value={editing.street} onChangeText={(t) => set('street', t)} error={errors.street} />
          <Field label="Landmark (optional)" value={editing.landmark} onChangeText={(t) => set('landmark', t)} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={editing.city} onChangeText={(t) => set('city', t)} error={errors.city} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Pincode" value={editing.pincode} onChangeText={(t) => set('pincode', t.replace(/\D/g, ''))} error={errors.pincode} keyboardType="number-pad" maxLength={6} />
            </View>
          </View>
          <Field label="State" value={editing.state} onChangeText={(t) => set('state', t)} error={errors.state} />
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 8 }}>Address type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['Home', 'Work', 'Other'] as AddressType[]).map((t) => (
              <Chip key={t} label={t} active={editing.type === t} onPress={() => set('type', t)} />
            ))}
            <Chip label="Default" active={editing.isDefault} onPress={() => set('isDefault', !editing.isDefault)} />
          </View>
          <GoldButton title="Save Address" onPress={save} />
          {addresses.length > 0 && <OutlineButton title="Cancel" onPress={() => setEditing(null)} style={{ marginTop: 10 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={mode === 'select' ? 'Select Address' : 'Saved Addresses'} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: 12, paddingBottom: 60 }}>
        {!!zoneMsg && <Notice tone="danger" title="Address saved, but not serviceable" text={zoneMsg} />}
        {addresses.map((a) => {
          const z = findZoneForAddress(zones, a.area, a.pincode);
          const sel = a.id === selectedAddressId;
          return (
            <Pressable
              key={a.id}
              onPress={() => {
                selectAddress(a.id);
                if (mode === 'select' && z.serviceable) router.back();
              }}
              style={[ui.card, { borderColor: sel ? colors.gold : colors.border, gap: 6 }]}
              accessibilityState={{ selected: sel }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={sel ? colors.gold : colors.textDim} />
                <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>
                  {a.fullName} · {a.type}
                  {a.isDefault ? ' · Default' : ''}
                </Text>
                <Pressable onPress={() => setEditing(a)} hitSlop={8} accessibilityLabel="Edit address">
                  <Ionicons name="create-outline" size={18} color={colors.gold} />
                </Pressable>
                <Pressable onPress={() => deleteAddress(a.id)} hitSlop={8} accessibilityLabel="Delete address">
                  <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                </Pressable>
              </View>
              <Text style={{ color: colors.textDim }}>
                {a.house}, {a.street}, {a.area}
                {a.landmark ? `, near ${a.landmark}` : ''}, {a.city} - {a.pincode}
              </Text>
              <Text style={{ color: colors.textDim }}>+91 {a.phone}</Text>
              <Text style={{ color: z.serviceable ? colors.success : colors.danger, fontSize: 12, fontWeight: '700' }}>{z.serviceable ? `✓ Express delivery available · up to ${z.zone!.etaMinutes} min` : z.reason}</Text>
            </Pressable>
          );
        })}
        <OutlineButton title="Add New Address" icon="add" onPress={() => setEditing(blank(phone))} />
      </ScrollView>
    </View>
  );
}
