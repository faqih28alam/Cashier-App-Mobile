import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useAuth} from '../../state/AuthContext';
import {ModuleKey, canAccessModule} from '../../navigation/access';
import {colors, radius, spacing, typography} from '../../theme';

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
      <StatusBar backgroundColor={colors.navy} barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
            Halo, {currentUser?.name}
          </Text>
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
            activeOpacity={0.85}
            onPress={() => navigation.navigate(item.route as any)}>
            <Text
              style={styles.tileLabel}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.navy,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  headerText: {flex: 1, marginRight: spacing.md},
  greeting: {fontSize: 20, fontWeight: '700', color: colors.textOnNavy},
  role: {fontSize: 12, color: colors.textOnNavyMuted, marginTop: 2},
  logoutButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.red,
    borderRadius: radius.sm,
  },
  logoutText: {fontWeight: '700', color: colors.textOnBrand},
  grid: {padding: spacing.md},
  tile: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    ...typography.cardTitle,
    color: colors.navy,
    fontSize: 16,
    letterSpacing: 1,
  },
});
