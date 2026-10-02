export type StatKey = "hunger" | "hygiene" | "energy" | "happiness";

export type PetStats = Record<StatKey, number>;

export type PetStatus = "NORMAL" | "ESTRUS" | "SLEEPING" | "SICK";

export type EquipSlot = "hat" | "clothes";

export type EquippedItems = Record<EquipSlot, string | null>;

export type PetAction = "feed" | "bathe" | "sleep" | "pet" | "walk" | "toy";

export type LifeStage = "PUPPY" | "TEEN" | "ADULT";

/** Firestore document: pets/{userId} */
export interface PetData {
  ownerId: string;
  petName: string;
  level: number;
  exp: number;
  stats: PetStats;
  status: PetStatus;
  equippedItems: EquippedItems;
  /** Epoch ms of the last time the simulation was advanced. */
  lastUpdated: number;

  // --- Fields added on top of the base schema ---
  createdAt: number;
  /** Epoch ms when the pet first reached puberty; anchors the estrus cycle. */
  pubertyAt: number | null;
  /** Walking / a new toy calms an estrus phase until this epoch ms. */
  estrusSoothedUntil: number;
  /** Epoch ms of each action's last use, for cooldowns that survive reloads. */
  lastActionAt: Partial<Record<PetAction, number>>;
}
