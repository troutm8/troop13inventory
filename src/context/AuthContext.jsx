import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

const AuthContext = createContext();

const useFirebase = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(useFirebase);

  useEffect(() => {
    if (!useFirebase) {
      // In local/test mode, treat as always authenticated
      setUser({ displayName: 'Local User', email: 'local@test.com' });
      setLoading(false);
      return;
    }

    let auth;
    import('../firebase.js').then(({ auth: firebaseAuth }) => {
      auth = firebaseAuth;
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      // Store unsubscribe for cleanup
      cleanupRef = unsubscribe;
    });

    let cleanupRef = null;
    return () => {
      if (cleanupRef) cleanupRef();
    };
  }, []);

  async function signup(email, password, displayName) {
    const { auth } = await import('../firebase.js');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential.user;
  }

  async function login(email, password) {
    const { auth } = await import('../firebase.js');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async function logout() {
    const { auth } = await import('../firebase.js');
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
