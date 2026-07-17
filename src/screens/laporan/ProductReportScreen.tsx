import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TextInput} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Product} from '../../types';
import {listProducts} from '../../db/repositories/productRepo';
import {formatCurrency} from '../../domain/money';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

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
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Tidak ada produk" />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.name}
              </Text>
              <Text
                style={styles.rowMeta}
                numberOfLines={1}
                ellipsizeMode="tail">
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  search: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
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
  rowPrice: {fontWeight: '700', color: colors.textPrimary},
});
