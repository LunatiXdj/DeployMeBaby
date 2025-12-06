'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useFirebase } from '@/client/hooks/useFirebase';
import { Skeleton } from '@/client/components/ui/skeleton';

export type UserRole = 'admin' | 'user';

export interface AuthUser extends FirebaseUser {
  role: UserRole;
}

interface AuthContextType {
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const firebase = useFirebase();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebase) return;

    console.log("AuthProvider: Subscribing to auth state changes.");

    const unsubscribe = onAuthStateChanged(firebase.auth, (user) => {
      console.log('AuthProvider: onAuthStateChanged callback fired.');
      if (user) {
        console.log(`AuthProvider: User is logged in with UID: ${user.uid}`);
        const role: UserRole = 'user';
        setAuthUser({ ...user, role });
      } else {
        console.log('AuthProvider: User is logged out.');
        setAuthUser(null);
      }
      console.log('AuthProvider: Setting loading to false.');
      setLoading(false);
    });

    return () => {
        console.log("AuthProvider: Unsubscribing from onAuthStateChanged.");
        unsubscribe();
    };
  }, [firebase]);

  const signIn = async (email: string, password: string) => {
    if (!firebase) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(firebase.auth, email, password);
  };

  const signOutFunc = async () => {
    if (!firebase) throw new Error("Firebase not initialized");
    await signOut(firebase.auth);
  };

  const value = { authUser, loading, signIn, signOut: signOutFunc };

  return (
    <AuthContext.Provider value={value}>
      {loading || !firebase ? (
        <div className="flex items-center justify-center h-screen">
          <div className="w-full max-w-md p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
