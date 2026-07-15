import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../state/AuthContext';

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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Selamat Datang</Text>
        <Text style={styles.subtitle}>
          Buat akun Owner pertama untuk mulai menggunakan aplikasi.
        </Text>

        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Konfirmasi Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={submit}
          disabled={submitting}>
          <Text style={styles.buttonText}>
            {submitting ? 'Menyimpan...' : 'Buat Akun Owner'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {padding: 24, flexGrow: 1, justifyContent: 'center'},
  title: {fontSize: 24, fontWeight: '700', marginBottom: 4},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 24},
  label: {fontSize: 13, color: '#444', marginBottom: 4, marginTop: 12},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
