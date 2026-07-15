import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Purchase} from '../../types';
import {listPurchases} from '../../db/repositories/purchaseRepo';
import {formatCurrency} from '../../domain/money';

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
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('PurchaseForm', {})}>
        <Text style={styles.newButtonText}>+ Purchase Baru</Text>
      </TouchableOpacity>
      <FlatList
        data={purchases}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada data pembelian</Text>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('PurchaseForm', {purchaseId: item.id})
            }>
            <View style={styles.rowMain}>
              <Text style={styles.rowCode}>{item.code}</Text>
              <Text style={styles.rowMeta}>
                {item.supplierName ?? 'Tanpa supplier'}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowTotal}>{formatCurrency(item.total)}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === 'confirmed'
                    ? styles.statusConfirmed
                    : styles.statusDraft,
                ]}>
                {item.status === 'confirmed' ? 'Terkonfirmasi' : 'Draft'}
              </Text>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  newButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  newButtonText: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowMain: {},
  rowCode: {fontWeight: '700'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
  rowRight: {alignItems: 'flex-end'},
  rowTotal: {fontWeight: '700'},
  statusBadge: {
    marginTop: 4,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusDraft: {backgroundColor: '#fef3c7', color: '#92400e'},
  statusConfirmed: {backgroundColor: '#dcfce7', color: '#166534'},
});
