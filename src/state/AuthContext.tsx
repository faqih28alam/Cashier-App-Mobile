import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {User} from '../types';
import {
  countUsers,
  createUser,
  findUserByUsername,
} from '../db/repositories/userRepo';
import {verifyPassword} from '../domain/auth';

interface AuthState {
  loading: boolean;
  /** True when the users table is empty and an owner account still needs to be created. */
  needsBootstrap: boolean;
  currentUser: User | null;
  login(
    username: string,
    password: string,
  ): Promise<{ok: boolean; error?: string}>;
  logout(): void;
  bootstrapOwner(input: {
    username: string;
    password: string;
    name: string;
  }): Promise<void>;
  refreshBootstrapCheck(): Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshBootstrapCheck = useCallback(async () => {
    const count = await countUsers();
    setNeedsBootstrap(count === 0);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshBootstrapCheck();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshBootstrapCheck]);

  const login = useCallback<AuthState['login']>(async (username, password) => {
    const user = await findUserByUsername(username.trim());
    if (!user || !user.active) {
      return {ok: false, error: 'Username atau password salah'};
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return {ok: false, error: 'Username atau password salah'};
    }
    setCurrentUser(user);
    return {ok: true};
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  const bootstrapOwner = useCallback<AuthState['bootstrapOwner']>(
    async input => {
      await createUser({
        username: input.username.trim(),
        password: input.password,
        name: input.name.trim(),
        role: 'owner',
      });
      await refreshBootstrapCheck();
    },
    [refreshBootstrapCheck],
  );

  const value = useMemo<AuthState>(
    () => ({
      loading,
      needsBootstrap,
      currentUser,
      login,
      logout,
      bootstrapOwner,
      refreshBootstrapCheck,
    }),
    [
      loading,
      needsBootstrap,
      currentUser,
      login,
      logout,
      bootstrapOwner,
      refreshBootstrapCheck,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
