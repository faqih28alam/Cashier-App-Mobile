import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Category} from '../../types';
import {listCategories} from '../../db/repositories/categoryRepo';
import {
  createProduct,
  findProductById,
  setProductActive,
  updateProduct,
} from '../../db/repositories/productRepo';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

function ProductFormInner({navigation, route}: Props) {
  const {productId} = route.params;
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [hpp, setHpp] = useState('0');
  const [harga1, setHarga1] = useState('0');
  const [harga2, setHarga2] = useState('');
  const [harga2MinQty, setHarga2MinQty] = useState('');
  const [harga3, setHarga3] = useState('');
  const [harga3MinQty, setHarga3MinQty] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('0');
  const [active, setActive] = useState(true);

  useEffect(() => {
    listCategories().then(setCategories);
    if (productId) {
      findProductById(productId).then(p => {
        if (!p) {
          return;
        }
        setCategoryId(p.categoryId);
        setBarcode(p.barcode);
        setName(p.name);
        setUnit(p.unit);
        setHpp(String(p.hpp));
        setHarga1(String(p.harga1));
        setHarga2(p.harga2 != null ? String(p.harga2) : '');
        setHarga2MinQty(p.harga2MinQty != null ? String(p.harga2MinQty) : '');
        setHarga3(p.harga3 != null ? String(p.harga3) : '');
        setHarga3MinQty(p.harga3MinQty != null ? String(p.harga3MinQty) : '');
        setStock(String(p.stock));
        setMinStock(String(p.minStock));
        setActive(p.active);
      });
    }
  }, [productId]);

  const parseOptional = (text: string): number | null => {
    if (!text.trim()) {
      return null;
    }
    const n = parseFloat(text);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    if (!barcode.trim() || !name.trim()) {
      Alert.alert('Lengkapi data', 'Barcode dan nama wajib diisi.');
      return;
    }
    const input = {
      barcode: barcode.trim(),
      name: name.trim(),
      categoryId,
      unit: unit.trim() || 'pcs',
      hpp: parseFloat(hpp) || 0,
      harga1: parseFloat(harga1) || 0,
      harga2: parseOptional(harga2),
      harga2MinQty: parseOptional(harga2MinQty),
      harga3: parseOptional(harga3),
      harga3MinQty: parseOptional(harga3MinQty),
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
    };
    try {
      if (productId) {
        await updateProduct(productId, input);
      } else {
        await createProduct(input);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(
        'Gagal menyimpan',
        e?.message ?? 'Barcode mungkin sudah digunakan.',
      );
    }
  };

  const toggleActive = async () => {
    if (!productId) {
      return;
    }
    await setProductActive(productId, !active);
    setActive(!active);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Barcode</Text>
      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
      />

      <Text style={styles.label}>Nama Barang</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Kategori</Text>
      <View style={styles.chipRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}>
            <Text
              style={
                categoryId === c.id ? styles.chipTextActive : styles.chipText
              }>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Satuan</Text>
      <TextInput style={styles.input} value={unit} onChangeText={setUnit} />

      <Text style={styles.label}>HPP (Harga Pokok)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={hpp}
        onChangeText={setHpp}
      />

      <Text style={styles.sectionLabel}>Harga Bertingkat</Text>

      <Text style={styles.label}>Harga 1 (dasar)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={harga1}
        onChangeText={setHarga1}
      />

      <Text style={styles.label}>Harga 2</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={harga2}
        onChangeText={setHarga2}
      />
      <Text style={styles.label}>Min. QTY untuk Harga 2</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={harga2MinQty}
        onChangeText={setHarga2MinQty}
      />

      <Text style={styles.label}>Harga 3</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={harga3}
        onChangeText={setHarga3}
      />
      <Text style={styles.label}>Min. QTY untuk Harga 3</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={harga3MinQty}
        onChangeText={setHarga3MinQty}
      />

      <Text style={styles.sectionLabel}>Stok</Text>
      <Text style={styles.label}>Stok Saat Ini</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={stock}
        onChangeText={setStock}
      />
      <Text style={styles.label}>Stok Minimum</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={minStock}
        onChangeText={setMinStock}
      />

      <TouchableOpacity style={styles.saveButton} onPress={save}>
        <Text style={styles.saveButtonText}>Simpan</Text>
      </TouchableOpacity>

      {productId != null && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleActive}>
          <Text style={styles.toggleButtonText}>
            {active ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

export default function ProductFormScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <ProductFormInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, paddingBottom: 40},
  label: {fontSize: 13, color: '#444', marginBottom: 4, marginTop: 10},
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipRow: {flexDirection: 'row', flexWrap: 'wrap'},
  chip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {backgroundColor: '#1d4ed8', borderColor: '#1d4ed8'},
  chipText: {color: '#333'},
  chipTextActive: {color: '#fff'},
  saveButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {color: '#fff', fontWeight: '700', fontSize: 16},
  toggleButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  toggleButtonText: {color: '#b91c1c', fontWeight: '700'},
});
