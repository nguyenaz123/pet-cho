import "server-only";
import { desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { getBreed } from "@/lib/game/breeds";
import { MAX_LEVEL } from "@/lib/game/constants";
import { createDefaultPet, normalizePet } from "@/lib/game/engine";
import type { PetData, PetStatus } from "@/types/pet";

const STATUSES: readonly PetStatus[] = ["NORMAL", "ESTRUS", "SLEEPING", "SICK"];
const MAX_NAME_LENGTH = 16;
const FRIENDS_LIMIT = 50;

/** Loads the user's pet, creating a fresh puppy on first sign-in. */
export async function loadOrCreatePet(ownerId: string): Promise<PetData> {
  const pet = await getPet(ownerId);
  if (pet) return pet;

  const fresh = createDefaultPet(ownerId, Date.now());
  await db.insert(pets).values(fresh).onConflictDoNothing();
  return fresh;
}

/** Anyone's pet, read-only; null if that user has no pet. */
export async function getPet(ownerId: string): Promise<PetData | null> {
  const [row] = await db.select().from(pets).where(eq(pets.ownerId, ownerId)).limit(1);
  return row ? normalizePet(row, ownerId, Date.now()) : null;
}

export async function savePet(pet: PetData): Promise<void> {
  await db.insert(pets).values(pet).onConflictDoUpdate({ target: pets.ownerId, set: pet });
}

/** What the friends list shows about someone else's pet (no stats, no timers). */
export type FriendPet = Pick<PetData, "ownerId" | "petName" | "breed" | "level" | "equippedItems" | "lastUpdated">;

/**
 * Everyone else's pets, most recently played first. Every account owns exactly one
 * pet, so unlike the old anonymous setup there are no duplicates to filter out.
 */
export async function listOtherPlayers(myUid: string): Promise<FriendPet[]> {
  return db
    .select({
      ownerId: pets.ownerId,
      petName: pets.petName,
      breed: pets.breed,
      level: pets.level,
      equippedItems: pets.equippedItems,
      lastUpdated: pets.lastUpdated,
    })
    .from(pets)
    .where(ne(pets.ownerId, myUid))
    .orderBy(desc(pets.lastUpdated))
    .limit(FRIENDS_LIMIT);
}

/**
 * Validates a pet sent by the browser before it is stored. ownerId always comes
 * from the session, never from the request body. Returns null when the payload is invalid.
 */
export function parsePet(input: unknown, ownerId: string): PetData | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Partial<PetData>;
  const { level, status, petName, breed } = raw;
  if (!Number.isInteger(level) || level! < 1 || level! > MAX_LEVEL) return null;
  if (!STATUSES.includes(status as PetStatus)) return null;
  if (typeof petName !== "string" || !petName.trim() || petName.length > MAX_NAME_LENGTH) return null;
  if (breed !== undefined && !getBreed(breed)) return null;

  const pet = normalizePet(raw, ownerId, Date.now());
  if (!Number.isFinite(pet.exp) || !Number.isFinite(pet.lastUpdated)) return null;
  // Epoch-ms columns are bigint; the simulation can produce fractional ms.
  const round = (ms: number | null) => (ms == null ? null : Math.round(ms));
  return {
    ...pet,
    ownerId,
    lastUpdated: Math.round(pet.lastUpdated),
    createdAt: Math.round(pet.createdAt),
    pubertyAt: round(pet.pubertyAt),
    estrusSoothedUntil: Math.round(pet.estrusSoothedUntil),
    lastSickPenaltyAt: round(pet.lastSickPenaltyAt),
  };
}
