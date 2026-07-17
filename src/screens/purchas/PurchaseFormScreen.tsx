import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Supplier, Purchase} from '../../types';
import {listSuppliers} from '../../db/repositories/supplierRepo';
import {findProductByBarcode} from '../../db/repositories/productRepo';
import {
  createDraftPurchase,
  updateDraftPurchase,
  confirmPurchase,
  getPurchaseById,
  getPurchaseItems,
  PurchaseLineInput,
} from '../../db/repositories/purchaseRepo';
import {formatCurrency} from '../../domain/money';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseForm'>;

function PurchaseFormInner({navigation, route}: Props) {
  const {purchaseId} = route.params;
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [lines, setLines] = useState<PurchaseLineInput[]>([]);

  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [harga1, setHarga1] = useState('0');

  const isReadOnly = purchase?.status === 'confirmed';

  useEffect(() => {
    listSuppliers().then(setSuppliers);
    if (purchaseId) {
      (async () => {
        const p = await getPurchaseById(purchaseId);
        const items = await getPurchaseItems(purchaseId);
        setPurchase(p);
        setSupplierId(p?.supplierId ?? null);
        setLines(
          items.map(i => ({
            barcode: i.barcode,
            name: i.name,
            unit: 'pcs',
            qty: i.qty,
            unitCost: i.unitCost,
            harga1: i.harga1,
          })),
        );
      })();
    }
  }, [purchaseId]);

  const onBarcodeBlur = async () => {
    if (!barcode.trim()) {
      return;
    }
    const product = await findProductByBarcode(barcode.trim());
    if (product) {
      setName(product.name);
      setUnit(product.unit);
      setUnitCost(String(product.hpp));
      setHarga1(String(product.harga1));
    }
  };

  const addLine = () => {
    if (!barcode.trim() || !name.trim()) {
      Alert.alert('Lengkapi data', 'Barcode dan nama barang wajib diisi.');
      return;
    }
    const qtyNum = parseFloat(qty) || 0;
    const costNum = parseFloat(unitCost) || 0;
    const harga1Num = parseFloat(harga1) || costNum;
    if (qtyNum <= 0) {
      Alert.alert('Qty tidak valid', 'Qty harus lebih dari 0.');
      return;
    }
    setLines(prev => [
      ...prev,
      {
        barcode: barcode.trim(),
        name: name.trim(),
        unit,
        qty: qtyNum,
        unitCost: costNum,
        harga1: harga1Num,
      },
    ]);
    setBarcode('');
    setName('');
    setQty('1');
    setUnitCost('0');
    setHarga1('0');
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  const saveDraft = async () => {
    if (lines.length === 0) {
      Alert.alert('Belum ada item', 'Tambahkan minimal satu item pembelian.');
      return;
    }
    if (purchaseId) {
      const result = await updateDraftPurchase(purchaseId, supplierId, lines);
      if (!result.ok) {
        Alert.alert(
          'Tidak bisa diubah',
          'Purchase yang sudah dikonfirmasi tidak bisa diubah.',
        );
        return;
      }
    } else {
      const created = await createDraftPurchase(supplierId, lines);
      navigation.replace('PurchaseForm', {purchaseId: created.id});
      return;
    }
    Alert.alert('Tersimpan', 'Draft pembelian tersimpan.');
    navigation.goBack();
  };

  const doConfirm = async () => {
    if (!purchaseId) {
      Alert.alert('Simpan draft terlebih dahulu');
      return;
    }
    Alert.alert(
      'Konfirmasi Pembelian',
      'Stok akan bertambah dan tidak bisa diubah lagi. Lanjutkan?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Konfirmasi',
          onPress: async () => {
            const result = await confirmPurchase(purchaseId);
            if (!result.ok) {
              Alert.alert(
                'Gagal',
                result.reason === 'already_confirmed'
                  ? 'Purchase ini sudah dikonfirmasi sebelumnya.'
                  : 'Purchase tidak ditemukan.',
              );
              return;
            }
            Alert.alert(
              'Berhasil',
              'Pembelian dikonfirmasi, stok telah diperbarui.',
            );
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>Supplier</Text>
      <View style={styles.supplierRow}>
        {suppliers.map(s => (
          <TouchableOpacity
            key={s.id}
            disabled={isReadOnly}
            style={[
              styles.supplierChip,
              supplierId === s.id && styles.supplierChipActive,
            ]}
            onPress={() => setSupplierId(s.id)}>
            <Text
              style={
                supplierId === s.id
                  ? styles.supplierChipTextActive
                  : styles.supplierChipText
              }
              numberOfLines={1}
              ellipsizeMode="tail">
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isReadOnly && (
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Tambah Item</Text>
          <TextInput
            style={styles.input}
            placeholder="Barcode"
            placeholderTextColor={colors.textMuted}
            value={barcode}
            onChangeText={setBarcode}
            onBlur={onBarcodeBlur}
          />
          <TextInput
            style={styles.input}
            placeholder="Nama Barang"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Qty"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={qty}
              onChangeText={setQty}
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Harga Beli"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={unitCost}
              onChangeText={setUnitCost}
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Harga Jual (baru)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={harga1}
              onChangeText={setHarga1}
            />
          </View>
          <TouchableOpacity style={styles.addLineButton} onPress={addLine}>
            <Text style={styles.addLineButtonText}>+ Tambah ke daftar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>Daftar Item</Text>
      <FlatList
        data={lines}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
        ListEmptyComponent={<EmptyState message="Belum ada item" />}
        renderItem={({item, index}) => (
          <View style={styles.lineRow}>
            <View style={styles.lineMain}>
              <Text
                style={styles.lineName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text style={styles.lineMeta}>
                {item.qty} x {formatCurrency(item.unitCost)}
              </Text>
            </View>
            <View style={styles.lineRight}>
              <Text style={styles.lineTotal}>
                {formatCurrency(item.qty * item.unitCost)}
              </Text>
              {!isReadOnly && (
                <TouchableOpacity onPress={() => removeLine(index)}>
                  <Text style={styles.removeText}>Hapus</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {!isReadOnly && (
        <Button
          style={styles.saveButton}
          variant="secondary"
          label="Simpan Draft"
          onPress={saveDraft}
        />
      )}

      {purchase && purchase.status === 'draft' && (
        <Button
          style={styles.confirmButton}
          variant="success"
          label="Konfirmasi Pembelian"
          onPress={doConfirm}
        />
      )}
    </ScrollView>
  );
}

export default function PurchaseFormScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <PurchaseFormInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  supplierRow: {flexDirection: 'row', flexWrap: 'wrap'},
  supplierChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: 200,
  },
  supplierChipActive: {backgroundColor: colors.navy, borderColor: colors.navy},
  supplierChipText: {color: colors.textSecondary},
  supplierChipTextActive: {color: colors.textOnBrand},
  form: {},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  inputRow: {flexDirection: 'row', gap: spacing.sm},
  inputThird: {flex: 1, marginRight: spacing.sm},
  addLineButton: {
    backgroundColor: colors.cardMuted,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addLineButtonText: {color: colors.navy, fontWeight: '700'},
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  lineMain: {flex: 1, marginRight: spacing.sm},
  lineName: {...typography.bodyMedium},
  lineMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  lineRight: {alignItems: 'flex-end'},
  lineTotal: {fontWeight: '700', color: colors.textPrimary},
  removeText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  totalLabel: {fontWeight: '700', fontSize: 16, color: colors.textPrimary},
  totalValue: {fontWeight: '700', fontSize: 16, color: colors.textPrimary},
  saveButton: {marginTop: spacing.lg},
  confirmButton: {marginTop: spacing.md},
});
