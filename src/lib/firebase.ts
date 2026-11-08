import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase app singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initialization
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

if (typeof window !== "undefined") {
  void testConnection();
}

// Authentication Helpers
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function loginWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function loginAsGuest() {
  if (typeof window !== "undefined") {
    localStorage.setItem("guest_mode", "true");
  }
  try {
    return await signInAnonymously(auth);
  } catch {
    const guestEmail = "guest_player@capitalfortune.local";
    const guestPass = "CapitalGuest123!";
    try {
      return await signInWithEmailAndPassword(auth, guestEmail, guestPass);
    } catch {
      try {
        return await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
      } catch {
        // Fallback to local guest mode
        return { uid: "guest_player", email: "guest@capitalfortune.local" } as unknown as User;
      }
    }
  }
}

export async function logOut() {
  return signOut(auth);
}

export async function getCurrentUser(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export { onAuthStateChanged, type User };

// Firebase Storage Asset Helpers
export async function uploadGraphicAsset(file: File, storagePath: string): Promise<string> {
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function getGraphicAssetUrl(storagePath: string): Promise<string> {
  const fileRef = ref(storage, storagePath);
  return getDownloadURL(fileRef);
}

export async function listGraphicAssets(
  folderPath: string,
): Promise<{ name: string; url: string }[]> {
  const folderRef = ref(storage, folderPath);
  const res = await listAll(folderRef);
  const items = await Promise.all(
    res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return { name: itemRef.name, url };
    }),
  );
  return items;
}
