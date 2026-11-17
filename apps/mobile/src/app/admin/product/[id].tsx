
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { ShoeArt } from '@/components/Art';
import { toast } from '@/components/Toast';
import { Chip, Field, GoldButton, Notice, TopBar, s as ui } from '@/components/ui';
import { COLOUR_PRESETS, SIZES } from '@/data/demo';
import { queryClient, useCatalog } from '@/hooks/queries';
import { api } from '@/services/api';
import { colors, formatINR, radius, space } from '@/theme';
import type { CategorySlug, Product } from '@/types';

const STYLES: Product['style'][] = ['low', 'runner', 'formal', 'slide', 'sandal'];
const blank: Product = {
  id: '', name: '', sku: '', categorySlug: 'sneakers', style: 'low', sellingPrice: 0, mrp: 0, purchaseCost: 0, description: '', material: '', sole: '', fit: 'True to size', care: '',
  colours: [COLOUR_PRESETS[0]], isFeatured: false, isActive: true, createdAt: new Date().toISOString(),
};

export default function AdminProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { catalog, productsById } = useCatalog();
  const existing = productsById.get(id);
  const [p, setP] = useState<Product | null>(isNew ? blank : null);
  const [sizes, setSizes] = useState<number[]>(SIZES);
  const [stock, setStock] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && existing && !p) setP(existing);
  }, [existing, isNew, p]);
  const variants = (catalog?.variants ?? []).filter((v) => v.productId === id);
  useEffect(() => {
    setStock(Object.fromEntries(variants.map((v) => [v.id, String(v.stock)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  if (!p) return <View style={{ flex: 1, backgroundColor: colors.bg }}><TopBar title="Product" /></View>;
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP({ ...p, [k]: v });
  const num = (t: string) => Number(t.replace(/[^\d.]/g, '')) || 0;
  const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - (p.purchaseCost ?? 0)) / p.sellingPrice) * 100) : 0;

  const saveProduct = async () => {
    if (!p.name.trim() || !p.sku.trim()) return toast('Name and SKU are required', 'error');
    if (p.sellingPrice <= 0 || p.mrp < p.sellingPrice) return toast('Price must be above 0 and MRP at least the price', 'error');
    if (!p.colours.length) return toast('Pick at least one colour', 'error');
    setSaving(true);
    try {
      const saved = await api.adminSaveProduct({ ...p, name: p.name.trim(), sku: p.sku.trim().toUpperCase() }, sizes);
      await queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast(isNew ? 'Product added. Now set stock.' : 'Product saved');
      if (isNew) router.replace(`/admin/product/${saved.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async () => {
    const changed = variants.filter((v) => String(v.stock) !== stock[v.id]);
    if (!changed.length) return toast('No stock changes', 'info');
    setSaving(true);
    try {
      for (const v of changed) await api.adminSetStock(v.id, parseInt(stock[v.id] || '0', 10));
      await queryClient.invalidateQueries({ queryKey: ['catalog'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast(`Stock updated for ${changed.length} size${changed.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={isNew ? 'Add Product' : p.name} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.cardLight, borderRadius: radius.lg, alignItems: 'center', padding: 12 }}>
          <ShoeArt product={p} width={240} />
        </View>

        {!isNew && (
          <View style={[ui.card, { gap: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={ui.section}>Stock by colour & size</Text>
              <Text style={{ color: colors.textDim, fontSize: 12 }}>{variants.reduce((n, v) => n + v.stock, 0)} pairs</Text>
            </View>
            {p.colours.map((c) => (
              <View key={c.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c.upper, borderWidth: 2, borderColor: c.accent }} />
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{c.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {variants.filter((v) => v.colourId === c.id).sort((a, b) => a.size - b.size).map((v) => {
                    const n = parseInt(stock[v.id] || '0', 10);
                    return (
                      <View key={v.id} style={{ width: 58, alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: colors.textDim, fontSize: 11 }}>UK {v.size}</Text>
                        <TextInput
                          value={stock[v.id] ?? ''}
                          onChangeText={(t) => setStock({ ...stock, [v.id]: t.replace(/\D/g, '').slice(0, 4) })}
                          keyboardType="number-pad"
                          accessibilityLabel={`${c.name} UK ${v.size} stock`}
                          style={{ width: 58, height: 42, borderRadius: 10, borderWidth: 1, borderColor: n === 0 ? colors.danger : n <= 2 ? colors.warning : colors.border, color: colors.text, textAlign: 'center', fontWeight: '800', backgroundColor: colors.bg2 }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            <GoldButton title="Save stock" icon="save" loading={saving} onPress={saveStock} />
          </View>
        )}

        <View style={[ui.card, { gap: 4 }]}>
          <Text style={[ui.section, { marginBottom: 8 }]}>Details</Text>
          <Field label="Name" value={p.name} onChangeText={(t) => set('name', t)} />
          <Field label="SKU" value={p.sku} autoCapitalize="characters" onChangeText={(t) => set('sku', t)} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Selling price ₹" keyboardType="numeric" value={p.sellingPrice ? String(p.sellingPrice) : ''} onChangeText={(t) => set('sellingPrice', num(t))} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="MRP ₹" keyboardType="numeric" value={p.mrp ? String(p.mrp) : ''} onChangeText={(t) => set('mrp', num(t))} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Cost ₹" keyboardType="numeric" value={p.purchaseCost ? String(p.purchaseCost) : ''} onChangeText={(t) => set('purchaseCost', num(t))} />
            </View>
          </View>
          {p.sellingPrice > 0 && (
            <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 8 }}>
              Customer sees {formatINR(p.sellingPrice)}
              {p.mrp > p.sellingPrice ? ` (${Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100)}% off)` : ''} · your margin about {margin}%
            </Text>
          )}
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 6 }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {(catalog?.categories ?? []).map((c) => <Chip key={c.slug} label={c.name} active={p.categorySlug === c.slug} onPress={() => set('categorySlug', c.slug as CategorySlug)} />)}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 6 }}>Illustration shape</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {STYLES.map((st) => <Chip key={st} label={st} active={p.style === st} onPress={() => set('style', st)} />)}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 6 }}>Colours</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {COLOUR_PRESETS.map((c) => {
              const on = p.colours.some((x) => x.id === c.id);
              const locked = !isNew && on && existing?.colours.some((x) => x.id === c.id);
              return (
                <Pressable
                  key={c.id}
                  disabled={locked}
                  onPress={() => set('colours', on ? p.colours.filter((x) => x.id !== c.id) : [...p.colours, c])}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.gold : colors.border }}
                >
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.upper, borderWidth: 2, borderColor: c.accent }} />
                  <Text style={{ color: on ? colors.gold : colors.textDim, fontSize: 12, fontWeight: '600' }}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 6 }}>Sizes to stock (UK)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {[5, 6, 7, 8, 9, 10, 11].map((z) => <Chip key={z} label={`UK ${z}`} active={sizes.includes(z)} onPress={() => setSizes(sizes.includes(z) ? sizes.filter((x) => x !== z) : [...sizes, z].sort())} />)}
          </View>
          <Field label="Description" multiline value={p.description} onChangeText={(t) => set('description', t)} style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }} />
          <Field label="Material" value={p.material} onChangeText={(t) => set('material', t)} />
          <Field label="Sole" value={p.sole} onChangeText={(t) => set('sole', t)} />
          <Field label="Fit" value={p.fit} onChangeText={(t) => set('fit', t)} />
          <Field label="Care" value={p.care} onChangeText={(t) => set('care', t)} />
          <ToggleRow label="Show in the app" value={p.isActive !== false} onChange={(v) => set('isActive', v)} />
          <ToggleRow label="Featured / Trending" value={p.isFeatured} onChange={(v) => set('isFeatured', v)} />
        </View>
        <Notice tone="info" title="Product photos" text="Photo upload arrives with Supabase Storage. Until then the app shows the ABDAZ illustration in the chosen colours." />
        <GoldButton title={isNew ? 'Add product' : 'Save details'} icon={isNew ? 'add-circle' : 'save'} loading={saving} onPress={saveProduct} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.gold, false: colors.border }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}
