import React from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import ListRow from '../../components/ui/ListRow';
import {colors, spacing} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterHome'>;

const ITEMS: {label: string; route: keyof RootStackParamList}[] = [
  {label: 'Produk', route: 'ProductList'},
  {label: 'Kategori', route: 'CategoryList'},
  {label: 'Supplier', route: 'SupplierList'},
  {label: 'Pengguna', route: 'UserList'},
];

function MasterHomeInner({navigation}: Props) {
  return (
    <View style={styles.page}>
      <FlatList
        data={ITEMS}
        keyExtractor={item => item.route}
        contentContainerStyle={styles.container}
        renderItem={({item}) => (
          <ListRow
            title={item.label}
            onPress={() => navigation.navigate(item.route as any)}
          />
        )}
      />
    </View>
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
  page: {flex: 1, backgroundColor: colors.background},
  container: {padding: spacing.md},
});
