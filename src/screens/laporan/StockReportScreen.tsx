import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Product} from '../../types';
import {listProducts} from '../../db/repositories/productRepo';
import LowStockBadge from '../../components/common/LowStockBadge';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

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
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Tidak ada produk" />}
        renderItem={({item}) => {
          const isLow = item.stock <= item.minStock;
          return (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text
                  style={styles.rowName}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item.name}
                </Text>
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  list: {flexGrow: 1},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: {flex: 1, marginRight: spacing.sm},
  rowName: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
});
