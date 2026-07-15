import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Settings} from '../types';
import {getSettings, updateSettings} from '../db/repositories/settingsRepo';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  refresh(): Promise<void>;
  save(input: Omit<Settings, 'id'>): Promise<void>;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const save = useCallback(async (input: Omit<Settings, 'id'>) => {
    const s = await updateSettings(input);
    setSettings(s);
  }, []);

  const value = useMemo(
    () => ({settings, loading, refresh, save}),
    [settings, loading, refresh, save],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
