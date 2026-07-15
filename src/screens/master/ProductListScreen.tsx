import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Product} from '../../types';
import {listProducts} from '../../db/repositories/productRepo';
import {formatCurrency} from '../../domain/money';
import LowStockBadge from '../../components/common/LowStockBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

function ProductListInner({navigation}: Props) {
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
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('ProductForm', {})}>
        <Text style={styles.newButtonText}>+ Produk Baru</Text>
      </TouchableOpacity>
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Tidak ada produk</Text>}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('ProductForm', {productId: item.id})
            }>
            <View style={styles.rowMain}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                {item.barcode} · Stok {item.stock} {item.unit}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowPrice}>{formatCurrency(item.harga1)}</Text>
              {item.stock <= item.minStock && <LowStockBadge />}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function ProductListScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <ProductListInner {...props} />
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
    marginBottom: 8,
  },
  newButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  newButtonText: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowMain: {},
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
  rowRight: {alignItems: 'flex-end'},
  rowPrice: {fontWeight: '700'},
});
