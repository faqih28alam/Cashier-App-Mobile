import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {canAccessModule} from '../../navigation/access';
import {useAuth} from '../../state/AuthContext';
import ListRow from '../../components/ui/ListRow';
import Button from '../../components/ui/Button';
import {colors, spacing, typography} from '../../theme';

export default function MoreScreen() {
  const {currentUser, logout} = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.page}>
      <View style={styles.profile}>
        <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
          Halo, {currentUser?.name}
        </Text>
        <Text style={styles.role}>{currentUser?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.list}>
        {currentUser && canAccessModule(currentUser.role, 'MASTER') && (
          <ListRow
            title="Master"
            onPress={() => navigation.navigate('MasterHome')}
          />
        )}
        {currentUser && canAccessModule(currentUser.role, 'SETTING') && (
          <ListRow
            title="Setting"
            onPress={() => navigation.navigate('Setting')}
          />
        )}
      </View>

      <Button variant="danger" label="Keluar" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  profile: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  greeting: {...typography.screenTitle, color: colors.textOnNavy},
  role: {fontSize: 12, color: colors.textOnNavyMuted, marginTop: 2},
  list: {flex: 1},
});
