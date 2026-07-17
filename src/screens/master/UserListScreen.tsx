import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {User} from '../../types';
import {listUsers} from '../../db/repositories/userRepo';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UserList'>;

function UserListInner({navigation}: Props) {
  const [users, setUsers] = useState<User[]>([]);

  useFocusEffect(
    useCallback(() => {
      listUsers().then(setUsers);
    }, []),
  );

  return (
    <View style={styles.container}>
      <Button
        style={styles.newButton}
        label="+ Pengguna Baru"
        onPress={() => navigation.navigate('UserForm', {})}
      />
      <FlatList
        data={users}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Belum ada pengguna" />}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('UserForm', {userId: item.id})}>
            <Text style={styles.rowName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1} ellipsizeMode="tail">
              @{item.username} · {item.role.toUpperCase()}{' '}
              {!item.active && '(nonaktif)'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function UserListScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <UserListInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.md},
  newButton: {marginBottom: spacing.md},
  list: {flexGrow: 1},
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowName: {...typography.bodyMedium},
  rowMeta: {color: colors.textMuted, fontSize: 12, marginTop: 2},
});
