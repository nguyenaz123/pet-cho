import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
