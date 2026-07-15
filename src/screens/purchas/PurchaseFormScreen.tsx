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
              }>
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
            value={barcode}
            onChangeText={setBarcode}
            onBlur={onBarcodeBlur}
          />
          <TextInput
            style={styles.input}
            placeholder="Nama Barang"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Qty"
              keyboardType="numeric"
              value={qty}
              onChangeText={setQty}
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Harga Beli"
              keyboardType="numeric"
              value={unitCost}
              onChangeText={setUnitCost}
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="Harga Jual (baru)"
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
        ListEmptyComponent={<Text style={styles.empty}>Belum ada item</Text>}
        renderItem={({item, index}) => (
          <View style={styles.lineRow}>
            <View>
              <Text style={styles.lineName}>{item.name}</Text>
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
        <TouchableOpacity style={styles.saveButton} onPress={saveDraft}>
          <Text style={styles.saveButtonText}>Simpan Draft</Text>
        </TouchableOpacity>
      )}

      {purchase && purchase.status === 'draft' && (
        <TouchableOpacity style={styles.confirmButton} onPress={doConfirm}>
          <Text style={styles.confirmButtonText}>Konfirmasi Pembelian</Text>
        </TouchableOpacity>
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
  container: {padding: 16, paddingBottom: 40},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  supplierRow: {flexDirection: 'row', flexWrap: 'wrap'},
  supplierChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  supplierChipActive: {backgroundColor: '#1d4ed8', borderColor: '#1d4ed8'},
  supplierChipText: {color: '#333'},
  supplierChipTextActive: {color: '#fff'},
  form: {},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  inputRow: {flexDirection: 'row', gap: 8},
  inputThird: {flex: 1, marginRight: 8},
  addLineButton: {
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addLineButtonText: {color: '#1d4ed8', fontWeight: '700'},
  empty: {color: '#999', textAlign: 'center', marginVertical: 12},
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  lineName: {fontWeight: '600'},
  lineMeta: {color: '#666', fontSize: 12, marginTop: 2},
  lineRight: {alignItems: 'flex-end'},
  lineTotal: {fontWeight: '700'},
  removeText: {color: '#b91c1c', fontSize: 12, marginTop: 4},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  totalLabel: {fontWeight: '700', fontSize: 16},
  totalValue: {fontWeight: '700', fontSize: 16},
  saveButton: {
    backgroundColor: '#eee',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {fontWeight: '700', color: '#333'},
  confirmButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonText: {fontWeight: '700', color: '#fff'},
});
