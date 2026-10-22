import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
  setCachedAccessToken,
  getCachedAccessToken,
} from '../services/firebase';
import {
  getActiveVaultSession,
  setActiveVaultSession,
  registerVaultOperative,
  verifyVaultOperative,
  saveVaultOperative,
} from '../utils/securityVault';
import { UserProfileData, HudThemeType } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  authError: string | null;
  accessToken: string | null;
  signInWithGoogle: () => Promise<string | null>;
  requestGmailAuth: () => Promise<string | null>;
  registerWithEmail: (
    name: string,
    email: string,
    pass: string,
    preferredVoiceId?: string,
    hudTheme?: HudThemeType
  ) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  updatePreferredCallsign: (callsign: string) => Promise<void>;
  updateUserVoicePreferences: (voiceId: string, theme?: HudThemeType) => Promise<void>;
  updateUserCustomAccent: (accentColor: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    testFirestoreConnection();

    // Check if an operative session is already active in local vault
    const existingVaultSession = getActiveVaultSession();
    if (existingVaultSession) {
      setUserProfile(existingVaultSession);
      setCurrentUser({
        uid: existingVaultSession.uid,
        email: existingVaultSession.email,
        displayName: existingVaultSession.displayName,
      } as unknown as User);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        startTransition(() => {
          setCurrentUser(user);
        });

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfileData;
            setUserProfile(data);

            try {
              await updateDoc(userDocRef, {
                lastLogin: new Date().toISOString(),
              });
            } catch (upErr) {
              console.warn('Could not update lastLogin on profile:', upErr);
            }
          } else {
            const newProfile: UserProfileData = {
              uid: user.uid,
              email: user.email || 'user@workspace.internal',
              displayName: user.displayName || 'Executive User',
              photoURL: user.photoURL || '',
              securityClearance: 'OPERATOR',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              preferredCallsign: user.displayName?.split(' ')[0] || 'Sir',
              preferredVoiceId: 'puck',
              hudTheme: 'cyan',
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (setErr) {
              console.warn('Could not write initial profile to firestore:', setErr);
            }
            setUserProfile(newProfile);
          }
        } catch (err: unknown) {
          console.warn('Firestore initial profile load status:', err);
          // Gracefully initialize local user profile so operative is immediately operational
          const fallbackProfile: UserProfileData = {
            uid: user.uid,
            email: user.email || 'user@workspace.internal',
            displayName: user.displayName || 'Executive User',
            photoURL: user.photoURL || '',
            securityClearance: 'OPERATOR',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferredCallsign: user.displayName?.split(' ')[0] || 'Sir',
            preferredVoiceId: 'puck',
            hudTheme: 'cyan',
          };
          setUserProfile((prev) => prev || fallbackProfile);

          // If it's a permission-denied or unexpected error, log using handleFirestoreError for diagnostics
          if (err instanceof Error && !err.message.includes('offline')) {
            try {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            } catch (handled) {
              console.error('Handled firestore error:', handled);
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Clear cached access token when user signs out or is unauthenticated
        setCachedAccessToken(null);
        setAccessToken(null);

        // If not logged into Firebase Google Auth, check if vault session is active
        const vaultSession = getActiveVaultSession();
        if (vaultSession) {
          setUserProfile(vaultSession);
          setCurrentUser({
            uid: vaultSession.uid,
            email: vaultSession.email,
            displayName: vaultSession.displayName,
          } as unknown as User);
        } else {
          setUserProfile(null);
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Secure Register with Name, Email, Password, and Personal Voice Persona
  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    preferredVoiceId: string = 'puck',
    hudTheme: HudThemeType = 'cyan'
  ) => {
    setAuthError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setAuthError('Please provide your Operative Name/Callsign.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please provide a valid authorized email address.');
      return;
    }
    if (!pass || pass.length < 6) {
      setAuthError('Security protocols require password to be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: cleanName,
      });

      const userDocRef = doc(db, 'users', user.uid);
      const newProfile: UserProfileData = {
        uid: user.uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: '',
        securityClearance: 'OPERATOR',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferredCallsign: cleanName.split(' ')[0] || cleanName,
        preferredVoiceId,
        hudTheme,
      };

      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
      setCurrentUser(user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        try {
          const vaultOp = await registerVaultOperative(
            cleanName,
            cleanEmail,
            pass,
            preferredVoiceId,
            hudTheme
          );
          setUserProfile(vaultOp);
          setCurrentUser({
            uid: vaultOp.uid,
            email: vaultOp.email,
            displayName: vaultOp.displayName,
          } as unknown as User);
          setAuthError(null);
          return;
        } catch (vaultErr: any) {
          setAuthError(vaultErr.message || 'Registration failed.');
          throw vaultErr;
        }
      }

      console.error('Registration failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered in the database. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password is too weak. Please use uppercase, numbers, or symbols.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Invalid email format provided.');
      } else {
        setAuthError(err.message || 'Registration failed to authenticate with database.');
      }
      throw err;
    }
  };

  // 2. Secure Login with Email & Password
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    if (!pass) {
      setAuthError('Please enter your security access password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfileData;
        setUserProfile(data);
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString(),
        });
      } else {
        const fallbackProfile: UserProfileData = {
          uid: user.uid,
          email: cleanEmail,
          displayName: user.displayName || cleanEmail.split('@')[0],
          photoURL: '',
          securityClearance: 'OPERATOR',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferredCallsign: user.displayName || cleanEmail.split('@')[0],
          preferredVoiceId: 'puck',
          hudTheme: 'cyan',
        };
        await setDoc(userDocRef, fallbackProfile);
        setUserProfile(fallbackProfile);
      }
      setCurrentUser(user);
    } catch (err: any) {
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        try {
          const vaultOp = await verifyVaultOperative(cleanEmail, pass);
          setUserProfile(vaultOp);
          setCurrentUser({
            uid: vaultOp.uid,
            email: vaultOp.email,
            displayName: vaultOp.displayName,
          } as unknown as User);
          setAuthError(null);
          return;
        } catch (vaultErr: any) {
          if (err.code === 'auth/operation-not-allowed' && vaultErr.message.includes('No operative account found')) {
            setAuthError('No registered profile found with this email. Please click "NEW REGISTRATION" to register first.');
          } else {
            setAuthError(vaultErr.message || 'Access denied: Invalid email or password.');
          }
          throw vaultErr;
        }
      }

      console.error('Login failed:', err);
      if (err.code === 'auth/too-many-requests') {
        setAuthError('Access temporarily locked due to multiple failed attempts. Please wait 60s.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      }
      throw err;
    }
  };

  // 3. Google Sign-In with OAuth credential extraction
  const signInWithGoogle = async (): Promise<string | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Extract OAuth credential access token for Gmail API calls
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setCachedAccessToken(token);
        setAccessToken(token);
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfileData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Tharun Operative',
          photoURL: user.photoURL || '',
          securityClearance: 'OPERATOR',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferredCallsign: user.displayName?.split(' ')[0] || 'Sir Tharun',
          preferredVoiceId: 'puck',
          hudTheme: 'cyan',
        };

        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
      return token;
    } catch (err: any) {
      console.error('Authentication Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Authentication window closed before authorization completed.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in request superseded.');
      } else {
        setAuthError(err.message || 'Security credential verification failed.');
      }
      return null;
    }
  };

  // Re-request or refresh Google Workspace / Gmail OAuth Access Token
  const requestGmailAuth = async (): Promise<string | null> => {
    const existing = getCachedAccessToken();
    if (existing) return existing;
    return await signInWithGoogle();
  };

  const signOut = async () => {
    try {
      setActiveVaultSession(null);
      setCachedAccessToken(null);
      setAccessToken(null);
      await fbSignOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setAuthError(err.message || 'Failed to terminate security session.');
    }
  };

  const updatePreferredCallsign = async (callsign: string) => {
    if (!currentUser) return;
    const sanitized = callsign.trim().slice(0, 50);

    const vaultSession = getActiveVaultSession();
    if (vaultSession && vaultSession.uid === currentUser.uid) {
      vaultSession.preferredCallsign = sanitized;
      saveVaultOperative(vaultSession);
      setActiveVaultSession(vaultSession);
      setUserProfile((prev) => (prev ? { ...prev, preferredCallsign: sanitized } : null));
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        preferredCallsign: sanitized,
      });
      setUserProfile((prev) => (prev ? { ...prev, preferredCallsign: sanitized } : null));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const updateUserVoicePreferences = async (voiceId: string, theme?: HudThemeType) => {
    if (!currentUser) return;

    const vaultSession = getActiveVaultSession();
    if (vaultSession && vaultSession.uid === currentUser.uid) {
      vaultSession.preferredVoiceId = voiceId;
      if (theme) vaultSession.hudTheme = theme;
      saveVaultOperative(vaultSession);
      setActiveVaultSession(vaultSession);
      setUserProfile((prev) => (prev ? { ...prev, preferredVoiceId: voiceId, hudTheme: theme || prev.hudTheme } : null));
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updates: Partial<UserProfileData> = {
        preferredVoiceId: voiceId,
      };
      if (theme) updates.hudTheme = theme;

      await updateDoc(userDocRef, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const updateUserCustomAccent = async (accentColor: string | null) => {
    if (!currentUser) return;

    const vaultSession = getActiveVaultSession();
    if (vaultSession && vaultSession.uid === currentUser.uid) {
      if (accentColor) {
        vaultSession.customAccentColor = accentColor;
      } else {
        delete vaultSession.customAccentColor;
      }
      saveVaultOperative(vaultSession);
      setActiveVaultSession(vaultSession);
      setUserProfile((prev) => (prev ? { ...prev, customAccentColor: accentColor || undefined } : null));
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updates: Partial<UserProfileData> = {
        customAccentColor: accentColor || '',
      };
      await updateDoc(userDocRef, updates);
      setUserProfile((prev) => (prev ? { ...prev, customAccentColor: accentColor || undefined } : null));
    } catch (err: unknown) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        accessToken,
        signInWithGoogle,
        requestGmailAuth,
        registerWithEmail,
        loginWithEmail,
        signOut,
        clearAuthError: () => setAuthError(null),
        updatePreferredCallsign,
        updateUserVoicePreferences,
        updateUserCustomAccent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
