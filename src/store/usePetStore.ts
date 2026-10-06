"use client";

import { create } from "zustand";
import { STAT_KEYS, applyAction, calculateOfflineDecay, getLifeStage, type StatDelta } from "@/lib/game/engine";
import { PARTNER_LEVEL, PARTNER_NAME, STAGE_LABEL } from "@/lib/game/constants";
import { getBreed } from "@/lib/game/breeds";
import { getWearable } from "@/lib/game/items";
import { putPet } from "@/lib/petApi";
import type { BreedId, EquipSlot, PetAction, PetData, StatKey } from "@/types/pet";

const STAT_LABEL: Record<StatKey, string> = { hunger: "Food", hygiene: "Clean", energy: "Energy", happiness: "Joy" };

export type Activity = "eating" | "bathing" | "petting" | "walking" | "playing";
const ACTIVITY_FOR: Partial<Record<PetAction, Activity>> = {
  feed: "eating",
  bathe: "bathing",
  pet: "petting",
  walk: "walking",
  toy: "playing",
};
const ACTIVITY_MS = 2_500;

/** Gaps longer than this show the "while you were away" report. */
const OFFLINE_REPORT_MIN_MS = 60_000;
const SAVE_DEBOUNCE_MS = 1_500;

export interface Toast {
  id: number;
  text: string;
  tone: "info" | "good" | "bad";
}
export interface Floater {
  id: number;
  stat: StatKey;
  amount: number;
}
export interface OfflineReport {
  elapsedMs: number;
  before: PetData;
  after: PetData;
}

interface PetState {
  phase: "idle" | "ready";
  pet: PetData | null;
  activity: { type: Activity; until: number } | null;
  toasts: Toast[];
  floaters: Floater[];
  offlineReport: OfflineReport | null;
  dirty: boolean;

  /** Starts the game with the pet the server loaded, catching up on time spent away. */
  init: (stored: PetData) => void;
  /** Advances the simulation to Date.now(). Called by the game loop every second. */
  tick: () => void;
  perform: (action: PetAction) => void;
  equip: (slot: EquipSlot, itemId: string | null) => void;
  setBreed: (breed: BreedId) => void;
  rename: (name: string) => void;
  save: () => Promise<void>;
  dismissOfflineReport: () => void;
  dismissToast: (id: number) => void;
  dismissFloater: (id: number) => void;
}

let nextId = 1;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving: Promise<void> | null = null;

/** Turns a before/after pair into notifications (level changes, sickness, heat...). */
function describeChanges(prev: PetData, next: PetData): Omit<Toast, "id">[] {
  const out: Omit<Toast, "id">[] = [];
  if (next.level > prev.level) out.push({ text: `LEVEL UP! LV ${next.level}`, tone: "good" });
  if (next.level < prev.level) out.push({ text: `Level down... LV ${next.level}`, tone: "bad" });

  const prevStage = getLifeStage(prev.level);
  const nextStage = getLifeStage(next.level);
  if (prevStage !== nextStage) {
    const grewUp = next.level > prev.level;
    out.push({ text: `Now a ${STAGE_LABEL[nextStage]}!${grewUp ? " New room unlocked" : ""}`, tone: "info" });
  }
  if (prev.level < PARTNER_LEVEL && next.level >= PARTNER_LEVEL) {
    out.push({ text: `${PARTNER_NAME} moved in. ${next.petName} has a sweetheart!`, tone: "good" });
  }
  if (prev.level >= PARTNER_LEVEL && next.level < PARTNER_LEVEL) {
    out.push({ text: `${PARTNER_NAME} went home for now...`, tone: "bad" });
  }
  for (const slot of Object.keys(next.equippedItems) as EquipSlot[]) {
    const removed = getWearable(prev.equippedItems[slot]);
    if (removed && next.equippedItems[slot] === null && next.level < prev.level) {
      out.push({ text: `${removed.name} came off (needs LV ${removed.minLevel})`, tone: "bad" });
    }
  }
  const lostBreed = getBreed(prev.breed);
  if (lostBreed && next.breed !== prev.breed && next.level < prev.level) {
    out.push({ text: `Back to ${getBreed(next.breed)?.name} (${lostBreed.name} needs LV ${lostBreed.minLevel})`, tone: "bad" });
  }
  for (const key of STAT_KEYS) {
    if (prev.stats[key] > 0 && next.stats[key] <= 0) {
      out.push({ text: `${STAT_LABEL[key]} is empty! Losing EXP...`, tone: "bad" });
    }
  }

  if (prev.status !== next.status) {
    if (next.status === "SICK") out.push({ text: "Your pup is sick! Take care of it!", tone: "bad" });
    if (prev.status === "SICK") out.push({ text: "Feeling better!", tone: "good" });
    if (next.status === "ESTRUS") out.push({ text: "In heat! Go for a walk or get a toy.", tone: "info" });
    if (prev.status === "SLEEPING" && next.status !== "SLEEPING") out.push({ text: "Woke up refreshed!", tone: "info" });
  }
  return out;
}

export const usePetStore = create<PetState>()((set, get) => {
  const pushToasts = (items: Omit<Toast, "id">[]) => {
    if (!items.length) return;
    set((s) => ({ toasts: [...s.toasts, ...items.map((t) => ({ ...t, id: nextId++ }))].slice(-4) }));
  };

  const scheduleSave = () => {
    set({ dirty: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().save(), SAVE_DEBOUNCE_MS);
  };

  return {
    phase: "idle",
    pet: null,
    activity: null,
    toasts: [],
    floaters: [],
    offlineReport: null,
    dirty: false,

    init: (stored) => {
      if (get().phase === "ready") return;
      const now = Date.now();
      const caughtUp = calculateOfflineDecay(stored, now);
      const elapsedMs = now - stored.lastUpdated;

      set({
        phase: "ready",
        pet: caughtUp,
        offlineReport: elapsedMs >= OFFLINE_REPORT_MIN_MS ? { elapsedMs, before: stored, after: caughtUp } : null,
      });
      if (elapsedMs > 0) scheduleSave();
    },

    tick: () => {
      const { pet, activity } = get();
      if (!pet) return;
      const now = Date.now();
      const next = calculateOfflineDecay(pet, now);
      set({ pet: next, dirty: true, activity: activity && activity.until > now ? activity : null });
      pushToasts(describeChanges(pet, next));
    },

    perform: (action) => {
      const { pet } = get();
      if (!pet) return;
      const now = Date.now();
      const result = applyAction(pet, action, now);
      if (!result.ok) {
        pushToasts([{ text: result.reason, tone: "info" }]);
        return;
      }

      const activityType = ACTIVITY_FOR[action];
      set((s) => ({
        pet: result.pet,
        activity: activityType ? { type: activityType, until: now + ACTIVITY_MS } : null,
        floaters: [...s.floaters, ...deltaToFloaters(result.delta)],
      }));
      pushToasts([
        ...(result.message ? [{ text: result.message, tone: "info" as const }] : []),
        ...describeChanges(pet, result.pet),
      ]);
      scheduleSave();
    },

    equip: (slot, itemId) => {
      const { pet } = get();
      if (!pet) return;
      const item = getWearable(itemId);
      if (item && (item.slot !== slot || item.minLevel > pet.level)) return;
      set({ pet: { ...pet, equippedItems: { ...pet.equippedItems, [slot]: itemId } } });
      scheduleSave();
    },

    setBreed: (breed) => {
      const { pet } = get();
      const info = getBreed(breed);
      if (!pet || !info || info.minLevel > pet.level || pet.breed === breed) return;
      set({ pet: { ...pet, breed } });
      scheduleSave();
    },

    rename: (name) => {
      const { pet } = get();
      const petName = name.trim().slice(0, 16);
      if (!pet || !petName) return;
      set({ pet: { ...pet, petName } });
      scheduleSave();
    },

    save: async () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      // Serialise writes so an older snapshot never lands after a newer one.
      while (saving) await saving;
      const { pet, dirty } = get();
      if (!pet || !dirty) return;
      set({ dirty: false });
      saving = putPet(pet)
        .catch((err) => {
          console.error("Save failed", err);
          set({ dirty: true });
        })
        .finally(() => {
          saving = null;
        });
      await saving;
    },

    dismissOfflineReport: () => set({ offlineReport: null }),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    dismissFloater: (id) => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })),
  };
});

function deltaToFloaters(delta: StatDelta): Floater[] {
  return (Object.entries(delta) as [StatKey, number][])
    .filter(([, amount]) => amount !== 0)
    .map(([stat, amount]) => ({ id: nextId++, stat, amount }));
}
