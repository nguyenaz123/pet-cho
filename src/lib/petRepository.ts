import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { createDefaultPet, normalizePet } from "@/lib/game/engine";
import type { PetData } from "@/types/pet";

/** Signs in anonymously (reusing the persisted session if there is one). */
export async function ensureAnonymousUser(): Promise<string> {
  const { auth } = getFirebase();
  await auth.authStateReady();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  return user.uid;
}

const petRef = (uid: string) => doc(getFirebase().db, "pets", uid);

/** Loads pets/{uid}, creating a fresh puppy on first launch. */
export async function loadOrCreatePet(uid: string): Promise<PetData> {
  const now = Date.now();
  const snap = await getDoc(petRef(uid));
  if (snap.exists()) return normalizePet(snap.data() as Partial<PetData>, uid, now);

  const pet = createDefaultPet(uid, now);
  await setDoc(petRef(uid), pet);
  return pet;
}

export async function savePet(pet: PetData): Promise<void> {
  await setDoc(petRef(pet.ownerId), pet);
}

const nameKey = (name: string) => name.trim().toLowerCase();
/** Brand-new pups are all called this, so it can't tell players apart. */
const DEFAULT_KEY = nameKey(createDefaultPet("", 0).petName);

/**
 * Everyone else's pets, most recently played first. One player can own several
 * documents (anonymous sign-in makes a new uid per browser), so pets sharing a
 * name are treated as one player and only the newest is kept. Pups still wearing
 * the default name are hidden: they're mostly abandoned sessions, and the name
 * says nothing about who owns them.
 */
export async function listOtherPlayers(myUid: string, myPetName: string): Promise<PetData[]> {
  const now = Date.now();
  const snap = await getDocs(query(collection(getFirebase().db, "pets"), orderBy("lastUpdated", "desc")));
  const myKey = nameKey(myPetName);
  const seen = new Set<string>();
  const out: PetData[] = [];
  for (const d of snap.docs) {
    if (d.id === myUid) continue;
    const pet = normalizePet(d.data() as Partial<PetData>, d.id, now);
    const key = nameKey(pet.petName);
    if (key === DEFAULT_KEY || key === myKey || seen.has(key)) continue;
    seen.add(key);
    out.push(pet);
  }
  return out;
}

/** Live read-only view of someone's pet; calls back with null if it doesn't exist. */
export function watchPet(uid: string, onChange: (pet: PetData | null) => void, onError: (err: Error) => void) {
  return onSnapshot(
    petRef(uid),
    (snap) => onChange(snap.exists() ? normalizePet(snap.data() as Partial<PetData>, uid, Date.now()) : null),
    onError,
  );
}
