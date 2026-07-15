import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Product} from '../../types';
import {listProducts} from '../../db/repositories/productRepo';
import LowStockBadge from '../../components/common/LowStockBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'StockReport'>;

/** LAPORAN > Laporan Stok: all products with a low-stock flag (stock <= min_stock). */
function StockReportInner(_: Props) {
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      listProducts().then(setProducts);
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Tidak ada produk</Text>}
        renderItem={({item}) => {
          const isLow = item.stock <= item.minStock;
          return (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  Stok: {item.stock} {item.unit} (Min: {item.minStock})
                </Text>
              </View>
              {isLow && <LowStockBadge />}
            </View>
          );
        }}
      />
    </View>
  );
}

export default function StockReportScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <StockReportInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowMain: {},
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
});
