/**
 * Cashier App Mobile — root component.
 * @format
 */

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {getDatabase} from './src/db/database';
import {AuthProvider} from './src/state/AuthContext';
import {SettingsProvider} from './src/state/SettingsContext';
import RootNavigator from './src/navigation/RootNavigator';
import {colors, spacing} from './src/theme';

function App(): React.JSX.Element {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch(e => setDbError(e?.message ?? 'Gagal membuka database lokal'));
  }, []);

  if (dbError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Gagal memuat aplikasi: {dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <RootNavigator />
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {color: colors.danger, textAlign: 'center'},
});

export default App;
