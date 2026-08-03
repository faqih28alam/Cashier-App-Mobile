import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import {useAuth} from '../../state/AuthContext';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';
import {colors, radius, spacing, typography} from '../../theme';

export default function LoginScreen() {
  const {login} = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Lengkapi data', 'Username dan password wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.ok) {
        Alert.alert(
          'Login gagal',
          result.error ?? 'Username atau password salah',
        );
      }
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
        <Text style={styles.brand} numberOfLines={1} ellipsizeMode="tail">
          KASIR APP
        </Text>
        <View style={styles.card}>
          <Text style={styles.title}>Cashier App</Text>
          <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <PasswordInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />

          <Button
            style={styles.button}
            label={submitting ? 'Memeriksa...' : 'Masuk'}
            onPress={submit}
            loading={submitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  page: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.red,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {...typography.screenTitle, textAlign: 'center'},
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
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
  button: {marginTop: spacing.xl},
});
