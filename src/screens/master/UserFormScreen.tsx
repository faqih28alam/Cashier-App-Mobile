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
import Button from '../../components/ui/Button';
import {colors, radius, spacing, typography} from '../../theme';

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
              }
              numberOfLines={1}
              ellipsizeMode="tail">
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

      <Button style={styles.saveButton} label="Simpan" onPress={save} />
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
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  label: {...typography.label, marginBottom: spacing.xs, marginTop: spacing.md},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textDisabled,
  },
  roleRow: {flexDirection: 'row', gap: spacing.sm},
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  roleChipActive: {backgroundColor: colors.navy, borderColor: colors.navy},
  roleChipText: {color: colors.textSecondary, fontWeight: '600'},
  roleChipTextActive: {color: colors.textOnBrand, fontWeight: '700'},
  activeToggle: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
  },
  activeToggleText: {
    textAlign: 'center',
    fontWeight: '600',
    color: colors.navy,
  },
  saveButton: {marginTop: spacing.xl},
});
