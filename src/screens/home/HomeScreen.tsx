import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useAuth} from '../../state/AuthContext';
import {ModuleKey, canAccessModule} from '../../navigation/access';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const MODULES: {
  key: ModuleKey;
  label: string;
  route: keyof RootStackParamList;
}[] = [
  {key: 'KASIR', label: 'KASIR', route: 'KasirSession'},
  {key: 'PURCHAS', label: 'PURCHAS', route: 'PurchaseList'},
  {key: 'KEUANGAN', label: 'KEUANGAN', route: 'Keuangan'},
  {key: 'LAPORAN', label: 'LAPORAN', route: 'ReportsHome'},
  {key: 'MASTER', label: 'MASTER', route: 'MasterHome'},
  {key: 'SETTING', label: 'SETTING', route: 'Setting'},
];

export default function HomeScreen({navigation}: Props) {
  const {currentUser, logout} = useAuth();
  const visibleModules = MODULES.filter(m =>
    currentUser ? canAccessModule(currentUser.role, m.key) : false,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {currentUser?.name}</Text>
          <Text style={styles.role}>{currentUser?.role.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleModules}
        keyExtractor={item => item.key}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.tile}
            onPress={() => navigation.navigate(item.route as any)}>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f7'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 32,
  },
  greeting: {fontSize: 20, fontWeight: '700'},
  role: {fontSize: 12, color: '#666', marginTop: 2},
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  logoutText: {fontWeight: '600', color: '#333'},
  grid: {paddingHorizontal: 12},
  tile: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1},
});
