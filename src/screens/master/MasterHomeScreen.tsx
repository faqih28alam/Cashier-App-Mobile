import React from 'react';
import {Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterHome'>;

const ITEMS: {label: string; route: keyof RootStackParamList}[] = [
  {label: 'Produk', route: 'ProductList'},
  {label: 'Kategori', route: 'CategoryList'},
  {label: 'Supplier', route: 'SupplierList'},
  {label: 'Pengguna', route: 'UserList'},
];

function MasterHomeInner({navigation}: Props) {
  return (
    <FlatList
      data={ITEMS}
      keyExtractor={item => item.route}
      contentContainerStyle={styles.container}
      renderItem={({item}) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate(item.route as any)}>
          <Text style={styles.rowText}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

export default function MasterHomeScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <MasterHomeInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {padding: 12},
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    marginBottom: 10,
  },
  rowText: {fontSize: 16, fontWeight: '600'},
});
