import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Web app's Firebase configuration from your Firebase Console
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyBYfM0rXQMphHjA66NAyhcOoavTI_8djH0",
  authDomain: firebaseConfigData.authDomain || "report-daily-1115a.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "report-daily-1115a",
  storageBucket: firebaseConfigData.storageBucket || "report-daily-1115a.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "444662409113",
  appId: firebaseConfigData.appId || "1:444662409113:web:ac65b042f7d07db4b79508",
  measurementId: firebaseConfigData.measurementId || "G-Z4HLDJ1CBE"
};

// Initialize Firebase App instance (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics (gracefully handles environments where analytics is not supported)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Graceful fallback if analytics cannot be loaded
  });
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Check if there was a redirect sign-in result
if (typeof window !== 'undefined') {
  getRedirectResult(auth).catch(() => {
    // Silently ignore redirect errors if not active
  });
}

// Initialize Firestore
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection on startup
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or connecting.');
    }
  }
}
testFirestoreConnection();

// Auth helpers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Normal user actions: popup closed before completion or request cancelled
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/user-cancelled'
    ) {
      // User dismissed the login popup - not an application fault
      return null;
    }
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/unauthorized-domain') {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.warn('Redirect sign-in fallback also encountered:', redirectErr);
      }
      return null;
    }
    console.warn('Google login issue:', error?.message || error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.warn('Anonymous sign-in note:', error);
    return null;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
