import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Role} from '../../types';
import {useAuth} from '../../state/AuthContext';

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
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.buttonText}>Kembali</Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  text: {fontSize: 16, color: '#b91c1c', marginBottom: 16, textAlign: 'center'},
  button: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {color: '#fff', fontWeight: '600'},
});
