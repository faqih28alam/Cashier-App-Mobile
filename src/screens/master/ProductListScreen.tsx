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
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

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
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <Button
        style={styles.newButton}
        label="+ Produk Baru"
        onPress={() => navigation.navigate('ProductForm', {})}
      />
      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Tidak ada produk" />}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('ProductForm', {productId: item.id})
            }>
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  search: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  newButton: {marginBottom: spacing.md},
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
  rowRight: {alignItems: 'flex-end'},
  rowPrice: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
});
