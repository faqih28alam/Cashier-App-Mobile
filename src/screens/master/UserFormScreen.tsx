import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import RoleGuard from '../../components/common/RoleGuard';
import {useAuth} from '../../state/AuthContext';
import {Role} from '../../types';
import {
  createUser,
  deleteUser,
  findUserById,
  findUserByUsername,
  updateUser,
  updateUserPassword,
} from '../../db/repositories/userRepo';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';
import {colors, radius, spacing, typography} from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UserForm'>;

const ROLES: Role[] = ['kasir', 'admin', 'owner'];

function UserFormInner({navigation, route}: Props) {
  const {userId} = route.params;
  const {currentUser} = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('kasir');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!userId) {
      return;
    }
    Alert.alert(
      'Hapus Pengguna',
      `Yakin ingin menghapus "${name}"? Tindakan ini tidak bisa dibatalkan.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteUser(userId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(
                'Gagal menghapus',
                'Pengguna ini memiliki riwayat transaksi dan tidak bisa dihapus. ' +
                  'Gunakan tombol "Nonaktifkan" di atas untuk mencegahnya login.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
      <PasswordInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
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
        <View style={styles.activeToggle}>
          <Text style={styles.activeToggleText}>
            Status: {active ? 'Aktif' : 'Nonaktif'}
          </Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{false: colors.borderStrong, true: colors.success}}
            thumbColor={colors.card}
          />
        </View>
      )}

      <Button
        style={styles.saveButton}
        label={saving ? 'Menyimpan...' : 'Simpan'}
        loading={saving}
        onPress={save}
      />

      {userId != null && userId !== currentUser?.id && (
        <Button
          style={styles.deleteButton}
          variant="danger"
          label={deleting ? 'Menghapus...' : 'Hapus Pengguna'}
          loading={deleting}
          onPress={remove}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
  },
  activeToggleText: {
    fontWeight: '600',
    color: colors.navy,
  },
  saveButton: {marginTop: spacing.xl},
  deleteButton: {marginTop: spacing.md},
});
