import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TextInput} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Product} from '../../types';
import {listProducts} from '../../db/repositories/productRepo';
import {formatCurrency} from '../../domain/money';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductReport'>;

/** LAPORAN > Data Barang: read-only listing of all products. */
function ProductReportInner(_: Props) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      listProducts({search: search || undefined}).then(setProducts);
    }, [search]),
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Cari nama/barcode"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Tidak ada produk</Text>}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                {item.barcode} · {item.categoryName ?? '-'} · Stok {item.stock}{' '}
                {item.unit}
              </Text>
            </View>
            <Text style={styles.rowPrice}>{formatCurrency(item.harga1)}</Text>
          </View>
        )}
      />
    </View>
  );
}

export default function ProductReportScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <ProductReportInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12},
  rowPrice: {fontWeight: '700'},
});
