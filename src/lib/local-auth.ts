import { readLocalRecord, writeLocalRecords } from "@/lib/local-store";

export type LocalUser = {
  uid: string;
  email: null;
  emailVerified: false;
  isAnonymous: true;
  displayName: string;
};
type LocalIdentity = { uid: string; createdAt: number };

export const auth: { currentUser: LocalUser | null } = { currentUser: null };

function createDeviceId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

/** A stable installation identity namespaces the save inside local SQLite. */
export async function getCurrentUser(): Promise<LocalUser> {
  const existing = await readLocalRecord<LocalIdentity>("device", "identity");
  const identity = existing ?? { uid: createDeviceId(), createdAt: Date.now() };
  if (!existing) {
    await writeLocalRecords([{ collection: "device", id: "identity", value: identity }]);
  }
  const user: LocalUser = {
    uid: identity.uid, email: null, emailVerified: false, isAnonymous: true, displayName: "Local Player",
  };
  auth.currentUser = user;
  return user;
}
export async function loginAsGuest() { return getCurrentUser(); }
export async function logOut() {
  // Keep the local identity stable so the same on-device save resumes.
  return;
}
export function onAuthStateChanged(_auth: typeof auth, callback: (user: LocalUser | null) => void) {
  let active = true;
  void getCurrentUser().then((user) => { if (active) callback(user); });
  return () => { active = false; };
}
