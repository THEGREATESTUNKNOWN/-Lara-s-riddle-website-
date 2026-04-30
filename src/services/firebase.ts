import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  highScores: {
    riddle: number;
    puzzle: number;
  };
  preferences: {
    theme: string;
    volume: number;
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function createUserProfile(profile: UserProfile) {
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

export async function updateHighScore(uid: string, type: 'riddle' | 'puzzle', score: number) {
  try {
    const userDocRef = doc(db, 'users', uid);
    const profile = await getUserProfile(uid);
    if (!profile) return;

    if (score > (profile.highScores[type] || 0)) {
      const updatedHighScores = { ...profile.highScores, [type]: score };
      await setDoc(userDocRef, { highScores: updatedHighScores, updatedAt: serverTimestamp() }, { merge: true });
      
      // Also add to global leaderboard
      await addDoc(collection(db, 'scores'), {
        userId: uid,
        username: profile.username,
        score,
        type,
        timestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid} or scores`);
  }
}

export async function getLeaderboard(type: 'riddle' | 'puzzle', limitCount: number = 10) {
  try {
    const scoresRef = collection(db, 'scores');
    const q = query(
      scoresRef,
      where('type', '==', type),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'scores');
    return [];
  }
}
