import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await firebaseSignOut(auth);
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const currentUser = auth.currentUser;
      const headers = new Headers(init.headers);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(input, { ...init, headers });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signInWithGoogle,
        signOut,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
