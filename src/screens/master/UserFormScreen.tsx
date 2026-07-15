import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {Role} from '../../types';
import {
  createUser,
  findUserById,
  findUserByUsername,
  updateUser,
  updateUserPassword,
} from '../../db/repositories/userRepo';

type Props = NativeStackScreenProps<RootStackParamList, 'UserForm'>;

const ROLES: Role[] = ['kasir', 'admin', 'owner'];

function UserFormInner({navigation, route}: Props) {
  const {userId} = route.params;
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('kasir');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (userId) {
      findUserById(userId).then(u => {
        if (!u) {
          return;
        }
        setUsername(u.username);
        setName(u.name);
        setRole(u.role);
        setActive(u.active);
      });
    }
  }, [userId]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nama wajib diisi');
      return;
    }
    try {
      if (userId) {
        await updateUser(userId, {name: name.trim(), role, active});
        if (password.trim()) {
          if (password.length < 4) {
            Alert.alert('Password terlalu pendek', 'Minimal 4 karakter.');
            return;
          }
          await updateUserPassword(userId, password);
        }
      } else {
        if (!username.trim() || !password) {
          Alert.alert('Lengkapi data', 'Username dan password wajib diisi.');
          return;
        }
        const existing = await findUserByUsername(username.trim());
        if (existing) {
          Alert.alert('Username sudah digunakan');
          return;
        }
        if (password.length < 4) {
          Alert.alert('Password terlalu pendek', 'Minimal 4 karakter.');
          return;
        }
        await createUser({
          username: username.trim(),
          password,
          name: name.trim(),
          role,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Gagal menyimpan', e?.message ?? 'Terjadi kesalahan.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nama Lengkap</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={[styles.input, !!userId && styles.inputDisabled]}
        value={username}
        onChangeText={setUsername}
        editable={!userId}
        autoCapitalize="none"
      />

      <Text style={styles.label}>
        {userId ? 'Ubah Password (opsional)' : 'Password'}
      </Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Peran</Text>
      <View style={styles.roleRow}>
        {ROLES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, role === r && styles.roleChipActive]}
            onPress={() => setRole(r)}>
            <Text
              style={
                role === r ? styles.roleChipTextActive : styles.roleChipText
              }>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {userId != null && (
        <TouchableOpacity
          style={styles.activeToggle}
          onPress={() => setActive(!active)}>
          <Text style={styles.activeToggleText}>
            Status:{' '}
            {active
              ? 'Aktif (tap untuk nonaktifkan)'
              : 'Nonaktif (tap untuk aktifkan)'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={save}>
        <Text style={styles.saveButtonText}>Simpan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function UserFormScreen(props: Props) {
  return (
    <RoleGuard allowed={['admin', 'owner']}>
      <UserFormInner {...props} />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, paddingBottom: 40},
  label: {fontSize: 13, color: '#444', marginBottom: 4, marginTop: 12},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputDisabled: {backgroundColor: '#f2f2f2', color: '#888'},
  roleRow: {flexDirection: 'row', gap: 8},
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  roleChipActive: {backgroundColor: '#1d4ed8', borderColor: '#1d4ed8'},
  roleChipText: {color: '#333', fontWeight: '600'},
  roleChipTextActive: {color: '#fff', fontWeight: '700'},
  activeToggle: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
  },
  activeToggleText: {textAlign: 'center', fontWeight: '600', color: '#333'},
  saveButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {color: '#fff', fontWeight: '700', fontSize: 16},
});
