import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signOut,
  getIdToken,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await getIdToken(firebaseUser);
        let userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          picture: firebaseUser.photoURL,
          profileCompleted: true,
        };

        try {
          const res = await api.verifyAuth(idToken);
          if (res?.user) {
            userData = {
              ...userData,
              name: res.user.name || userData.name,
              firstName: res.user.firstName,
              lastName: res.user.lastName,
              profileCompleted: res.user.profileCompleted ?? true,
            };
          }
        } catch (err) {
          console.warn('Sync verifyAuth:', err.message);
        }

        setUser(userData);
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = async ({ firstName, lastName, displayName }) => {
    if (!token) return;
    const res = await api.updateProfile(token, { firstName, lastName, displayName });
    if (res?.user) {
      setUser((prev) => ({
        ...prev,
        name: res.user.name,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        profileCompleted: true,
      }));
    }
    return res.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
