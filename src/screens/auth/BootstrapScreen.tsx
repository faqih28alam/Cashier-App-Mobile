import React, {useState} from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import {useAuth} from '../../state/AuthContext';
import Button from '../../components/ui/Button';
import {colors, radius, spacing, typography} from '../../theme';

/**
 * Shown once, on a completely fresh install where the users table is empty.
 * Creates the first Owner account so login (spec requirement 10) has
 * something to authenticate against.
 */
export default function BootstrapScreen() {
  const {bootstrapOwner} = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password || !name.trim()) {
      Alert.alert('Lengkapi data', 'Semua field wajib diisi.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Password terlalu pendek', 'Minimal 4 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password tidak cocok', 'Konfirmasi password tidak sama.');
      return;
    }
    setSubmitting(true);
    try {
      await bootstrapOwner({username, password, name});
    } catch (e: any) {
      Alert.alert('Gagal membuat akun', e?.message ?? 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar backgroundColor={colors.navy} barStyle="light-content" />
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.brand} numberOfLines={1} ellipsizeMode="tail">
            KASIR APP
          </Text>
          <View style={styles.card}>
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>
              Buat akun Owner pertama untuk mulai menggunakan aplikasi.
            </Text>

            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              style={styles.button}
              label={submitting ? 'Menyimpan...' : 'Buat Akun Owner'}
              onPress={submit}
              loading={submitting}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  page: {flex: 1, backgroundColor: colors.navy},
  container: {padding: spacing.xl, flexGrow: 1, justifyContent: 'center'},
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.red,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {...typography.screenTitle},
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  label: {...typography.label, marginBottom: spacing.xs, marginTop: spacing.md},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 16,
    color: colors.textPrimary,
  },
  button: {marginTop: spacing.lg},
});
