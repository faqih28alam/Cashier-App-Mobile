import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Role} from '../../types';
import {useAuth} from '../../state/AuthContext';
import Button from '../ui/Button';
import {colors, spacing} from '../../theme';

/**
 * Defense-in-depth guard for screens restricted to certain roles. The Home
 * screen already only exposes tiles a role is allowed to open, but this
 * guard also blocks the screen itself in case of back/deep navigation,
 * per spec edge case: "A Kasir-role user attempts to access a restricted
 * module ... Access is blocked".
 */
export default function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const {currentUser} = useAuth();
  const navigation = useNavigation();
  const isAllowed = !!currentUser && allowed.includes(currentUser.role);

  useEffect(() => {
    if (!isAllowed) {
      const timer = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAllowed, navigation]);

  if (!isAllowed) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Akses ditolak untuk peran Anda.</Text>
        <Button
          label="Kembali"
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
