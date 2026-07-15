import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {User} from '../../types';
import {listUsers} from '../../db/repositories/userRepo';

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
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('UserForm', {})}>
        <Text style={styles.newButtonText}>+ Pengguna Baru</Text>
      </TouchableOpacity>
      <FlatList
        data={users}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada pengguna</Text>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('UserForm', {userId: item.id})}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                @{item.username} · {item.role.toUpperCase()}{' '}
                {!item.active && '(nonaktif)'}
              </Text>
            </View>
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
  container: {flex: 1, backgroundColor: '#fff', padding: 12},
  newButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  newButtonText: {color: '#fff', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#999', marginTop: 24},
  row: {paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee'},
  rowName: {fontWeight: '600'},
  rowMeta: {color: '#666', fontSize: 12, marginTop: 2},
});
