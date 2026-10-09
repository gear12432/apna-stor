import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { getUserProfile, createUserProfile } from '../services/firestoreService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (fullName: string, mobileNumber: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  authError: string | null;
  setAuthError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = async (user: FirebaseUser) => {
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        const defaultProfile: UserProfile = {
          uid: user.uid,
          fullName: user.displayName || 'Business Owner',
          mobileNumber: '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accountStatus: 'active'
        };
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (fullName: string, mobileNumber: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const profile: UserProfile = {
        uid,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accountStatus: 'active'
      };

      await createUserProfile(profile);
      setUserProfile(profile);
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMsg = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This Gmail is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid Gmail address';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password must be at least 6 characters';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Please check your internet connection';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const login = async (email: string, password: string): Promise<UserProfile | null> => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
        return profile;
      } else {
        const fallback: UserProfile = {
          uid,
          fullName: 'Business Owner',
          mobileNumber: '',
          email: email.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accountStatus: 'active'
        };
        setUserProfile(fallback);
        return fallback;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = 'Invalid Gmail or Password';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid Gmail or Password';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid Gmail address';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Please check your internet connection';
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMsg = 'Failed to send password reset link';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'This account does not exist';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid Gmail address';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Please check your internet connection';
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      signup,
      login,
      resetPassword,
      logout,
      refreshUserProfile,
      authError,
      setAuthError
    }}>
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
