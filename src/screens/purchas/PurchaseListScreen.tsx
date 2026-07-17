import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Purchase} from '../../types';
import {listPurchases} from '../../db/repositories/purchaseRepo';
import {formatCurrency} from '../../domain/money';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseList'>;

function PurchaseListInner({navigation}: Props) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useFocusEffect(
    useCallback(() => {
      listPurchases().then(setPurchases);
    }, []),
  );

  return (
    <View style={styles.container}>
      <Button
        style={styles.newButton}
        label="+ Purchase Baru"
        onPress={() => navigation.navigate('PurchaseForm', {})}
      />
      <FlatList
        data={purchases}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada data pembelian" />}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('PurchaseForm', {purchaseId: item.id})
            }>
            <View style={styles.rowMain}>
              <Text
                style={styles.rowCode}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.code}
              </Text>
              <Text
                style={styles.rowMeta}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.supplierName ?? 'Tanpa supplier'}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowTotal}>{formatCurrency(item.total)}</Text>
              <Badge
                label={item.status === 'confirmed' ? 'Terkonfirmasi' : 'Draft'}
                tone={item.status === 'confirmed' ? 'success' : 'warning'}
              />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function PurchaseListScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <PurchaseListInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: {flex: 1, marginRight: spacing.sm},
  rowCode: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
  rowRight: {alignItems: 'flex-end'},
  rowTotal: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
});
