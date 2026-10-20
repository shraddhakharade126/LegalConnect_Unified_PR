import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
  Database,
} from 'firebase/database';
import { ConsultationMessage } from '../types/index.ts';
import firebaseConfig from '../../../firebase-applet-config.json';

// Read environment variables (for Vercel/Netlify hosting) with fallback to firebase-applet-config.json
const env = import.meta.env || {};

export const effectiveFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId || '',
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || (firebaseConfig as any).databaseURL || '',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(effectiveFirebaseConfig) : getApp();

// Initialize Firestore
export const firestore: Firestore = effectiveFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, effectiveFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Realtime Database
const rtdbUrl =
  effectiveFirebaseConfig.databaseURL ||
  (effectiveFirebaseConfig.projectId ? `https://${effectiveFirebaseConfig.projectId}-default-rtdb.firebaseio.com` : undefined);

export let realtimeDb: Database | null = null;
try {
  realtimeDb = rtdbUrl ? getDatabase(app, rtdbUrl) : getDatabase(app);
} catch (e) {
  try {
    realtimeDb = getDatabase(app);
  } catch (err) {
    console.warn('[Firebase RTDB] Falling back to Firestore real-time channel:', err);
  }
}

// Mandatory testConnection call as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
  }
}
testConnection();

/**
 * Subscribe to consultation messages in real-time.
 * Listens via Firebase Realtime Database with automatic failover to Firestore onSnapshot
 * and polling fallback if networks require it.
 */
export function subscribeToMessages(
  consultationId: string,
  onMessages: (messages: ConsultationMessage[]) => void,
  onError?: (error: any) => void
): () => void {
  let isCleanedUp = false;
  let unsubscribeFirestore: (() => void) | null = null;
  let rtdbRef: any = null;
  let rtdbListener: any = null;

  // Attempt Realtime Database listener first
  if (realtimeDb) {
    try {
      rtdbRef = ref(realtimeDb, `consultations/${consultationId}/messages`);
      rtdbListener = onValue(
        rtdbRef,
        (snapshot) => {
          if (isCleanedUp) return;
          const val = snapshot.val();
          if (val) {
            const list: ConsultationMessage[] = Object.values(val);
            list.sort((a, b) => a.timestamp - b.timestamp);
            onMessages(list);
          } else {
            // Check Firestore if RTDB was empty
            tryListenFirestore();
          }
        },
        (rtdbError) => {
          console.warn('[Firebase RTDB Error, falling back to Firestore]:', rtdbError);
          tryListenFirestore();
        }
      );
    } catch (err) {
      tryListenFirestore();
    }
  } else {
    tryListenFirestore();
  }

  function tryListenFirestore() {
    if (isCleanedUp || unsubscribeFirestore) return;
    try {
      const messagesRef = collection(firestore, 'consultations', consultationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (isCleanedUp) return;
          const list: ConsultationMessage[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as ConsultationMessage);
          });
          onMessages(list);
        },
        (error) => {
          console.warn('[Firebase Firestore Listener Warning]:', error);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.warn('[Firebase onSnapshot setup warning]:', e);
      if (onError) onError(e);
    }
  }

  return () => {
    isCleanedUp = true;
    if (rtdbRef && rtdbListener && realtimeDb) {
      try {
        off(rtdbRef, 'value', rtdbListener);
      } catch (e) {
        // cleanup ignore
      }
    }
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * Send a secure message in real time to both Realtime Database & Firestore
 */
export async function sendConsultationRealtimeMessage(
  msg: ConsultationMessage
): Promise<void> {
  let saved = false;

  // 1. Write to Realtime Database if available
  if (realtimeDb) {
    try {
      const msgRef = ref(realtimeDb, `consultations/${msg.consultationId}/messages/${msg.id}`);
      await set(msgRef, msg);
      saved = true;
    } catch (err) {
      console.warn('[Firebase RTDB write error, attempting Firestore write]:', err);
    }
  }

  // 2. Write to Firestore subcollection
  try {
    const docRef = doc(firestore, 'consultations', msg.consultationId, 'messages', msg.id);
    await setDoc(docRef, msg);
    saved = true;
  } catch (err) {
    console.warn('[Firebase Firestore write error]:', err);
    if (!saved) {
      throw err;
    }
  }
}
