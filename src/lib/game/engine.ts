/**
 * Pure game logic: no React, no Firebase. Every function takes a PetData and returns
 * a new one, so the same code drives the live game loop and the offline catch-up.
 */
import type { LifeStage, PetAction, PetData, PetStats, PetStatus, StatKey } from "@/types/pet";
import {
  ACTION_COOLDOWN_MS,
  ACTION_MIN_LEVEL,
  ADULT_LEVEL,
  CARE_EXP_PER_HOUR,
  DECAY_PER_HOUR,
  ESTRUS_CYCLE_MS,
  ESTRUS_DURATION_MS,
  ESTRUS_HAPPINESS_MULTIPLIER,
  MAX_LEVEL,
  MAX_STEPS,
  MIN_STEP_MS,
  PUBERTY_LEVEL,
  SICK_LEVEL_PENALTY_INTERVAL_MS,
  SLEEP_DECAY_FACTOR,
  SLEEP_ENERGY_REGEN_PER_HOUR,
  SOOTHE_DURATION_MS,
  STAT_MAX,
  STAT_MIN,
  THRIVING_THRESHOLD,
  TIME_SCALE,
  expLossPerHour,
  expToNext,
  passiveExpPerHour,
} from "./constants";
import { DEFAULT_BREED, getBreed } from "./breeds";
import { getWearable } from "./items";

export const STAT_KEYS: StatKey[] = ["hunger", "hygiene", "energy", "happiness"];

const clamp = (v: number) => Math.min(STAT_MAX, Math.max(STAT_MIN, v));
const clonePet = (pet: PetData): PetData => ({
  ...pet,
  stats: { ...pet.stats },
  equippedItems: { ...pet.equippedItems },
  lastActionAt: { ...pet.lastActionAt },
});

// ---------------------------------------------------------------------------
// Creation / normalisation
// ---------------------------------------------------------------------------

export function createDefaultPet(ownerId: string, now: number): PetData {
  return {
    ownerId,
    petName: "Woofy",
    breed: DEFAULT_BREED,
    level: 1,
    exp: 0,
    stats: { hunger: 100, hygiene: 100, energy: 100, happiness: 100 },
    status: "NORMAL",
    equippedItems: { hat: null, clothes: null },
    lastUpdated: now,
    createdAt: now,
    pubertyAt: null,
    estrusSoothedUntil: 0,
    lastActionAt: {},
    lastSickPenaltyAt: null,
  };
}

/** Fills in missing fields so older or hand-edited documents still load. */
export function normalizePet(raw: Partial<PetData>, ownerId: string, now: number): PetData {
  const base = createDefaultPet(ownerId, now);
  return {
    ...base,
    ...raw,
    stats: { ...base.stats, ...raw.stats },
    equippedItems: { ...base.equippedItems, ...raw.equippedItems },
    lastActionAt: { ...raw.lastActionAt },
    breed: getBreed(raw.breed)?.id ?? base.breed,
    pubertyAt: raw.pubertyAt ?? (raw.level && raw.level >= PUBERTY_LEVEL ? now : null),
  };
}

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

export function getLifeStage(level: number): LifeStage {
  if (level >= ADULT_LEVEL) return "ADULT";
  if (level >= PUBERTY_LEVEL) return "TEEN";
  return "PUPPY";
}

/** Lowest level the pet can fall to: once a stage is reached it is never lost. */
export function stageFloorLevel(level: number): number {
  const stage = getLifeStage(level);
  if (stage === "ADULT") return ADULT_LEVEL;
  if (stage === "TEEN") return PUBERTY_LEVEL;
  return 1;
}

/** All EXP earned so far: every completed bar plus progress in the current one. */
export function totalExp(level: number, exp: number): number {
  let total = exp;
  for (let l = 1; l < level; l++) total += expToNext(l);
  return total;
}

/** Heat repeats every ESTRUS_CYCLE_MS from puberty and lasts ESTRUS_DURATION_MS. */
export function isEstrusActive(pet: PetData, t: number): boolean {
  if (pet.level < PUBERTY_LEVEL || pet.pubertyAt == null || t < pet.pubertyAt) return false;
  return (t - pet.pubertyAt) % ESTRUS_CYCLE_MS < ESTRUS_DURATION_MS;
}

export const isSoothed = (pet: PetData, t: number) => t < pet.estrusSoothedUntil;

/** Real ms until the next heat starts (0 while in heat, null before puberty). */
export function msUntilNextEstrus(pet: PetData, t: number): number | null {
  if (pet.level < PUBERTY_LEVEL || pet.pubertyAt == null) return null;
  if (isEstrusActive(pet, t)) return 0;
  return ESTRUS_CYCLE_MS - ((t - pet.pubertyAt) % ESTRUS_CYCLE_MS);
}

export const isThriving = (s: PetStats) => STAT_KEYS.every((k) => s[k] > THRIVING_THRESHOLD);
export const countEmptyStats = (s: PetStats) => STAT_KEYS.filter((k) => s[k] <= STAT_MIN).length;
/** Sick only when every stat has bottomed out. */
export const isSick = (s: PetStats) => countEmptyStats(s) === STAT_KEYS.length;

/** Takes off anything the pet is no longer high enough level to wear (after a level-down), breed included. */
function unequipLockedItems(pet: PetData) {
  if ((getBreed(pet.breed)?.minLevel ?? 1) > pet.level) pet.breed = DEFAULT_BREED;
  for (const slot of Object.keys(pet.equippedItems) as (keyof PetData["equippedItems"])[]) {
    const item = getWearable(pet.equippedItems[slot]);
    if (item && item.minLevel > pet.level) pet.equippedItems[slot] = null;
  }
}

/** Sleeping wins over everything; otherwise SICK > ESTRUS > NORMAL. */
export function deriveStatus(pet: PetData, t: number): PetStatus {
  if (pet.status === "SLEEPING") return "SLEEPING";
  if (isSick(pet.stats)) return "SICK";
  if (isEstrusActive(pet, t) && !isSoothed(pet, t)) return "ESTRUS";
  return "NORMAL";
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

function gainExp(pet: PetData, amount: number, t: number) {
  pet.exp += amount;
  while (pet.level < MAX_LEVEL && pet.exp >= expToNext(pet.level)) {
    pet.exp -= expToNext(pet.level);
    pet.level += 1;
    if (pet.level >= PUBERTY_LEVEL && pet.pubertyAt == null) pet.pubertyAt = t;
  }
  if (pet.level >= MAX_LEVEL) pet.exp = Math.min(pet.exp, expToNext(MAX_LEVEL));
}

/** EXP below zero drops a level and carries the debt into the previous bar, down to the stage floor. */
function loseExp(pet: PetData, amount: number) {
  const floor = stageFloorLevel(pet.level);
  pet.exp -= amount;
  while (pet.exp < 0) {
    if (pet.level <= floor) {
      pet.exp = 0;
      break;
    }
    pet.level -= 1;
    pet.exp += expToNext(pet.level);
  }
}

/** Sickness penalty: one level down, keeping the same progress through the bar. At the floor only the progress is lost. */
function loseLevel(pet: PetData) {
  if (pet.level <= stageFloorLevel(pet.level)) {
    pet.exp = 0;
    return;
  }
  const progress = pet.exp / expToNext(pet.level);
  pet.level -= 1;
  pet.exp = progress * expToNext(pet.level);
}

/** Advances `pet` (mutated in place) by `dt` real ms starting at time `t`. */
function step(pet: PetData, dt: number, t: number) {
  const hours = (dt * TIME_SCALE) / 3_600_000;
  const s = pet.stats;
  const sleeping = pet.status === "SLEEPING";

  if (sleeping) {
    s.hunger = clamp(s.hunger - DECAY_PER_HOUR.hunger * SLEEP_DECAY_FACTOR.hunger * hours);
    s.hygiene = clamp(s.hygiene - DECAY_PER_HOUR.hygiene * SLEEP_DECAY_FACTOR.hygiene * hours);
    s.happiness = clamp(s.happiness - DECAY_PER_HOUR.happiness * SLEEP_DECAY_FACTOR.happiness * hours);
    s.energy = clamp(s.energy + SLEEP_ENERGY_REGEN_PER_HOUR * hours);
    if (s.energy >= STAT_MAX) pet.status = "NORMAL"; // wakes up when fully rested
  } else {
    const inHeat = isEstrusActive(pet, t) && !isSoothed(pet, t);
    const happinessRate = DECAY_PER_HOUR.happiness * (inHeat ? ESTRUS_HAPPINESS_MULTIPLIER : 1);
    s.hunger = clamp(s.hunger - DECAY_PER_HOUR.hunger * hours);
    s.hygiene = clamp(s.hygiene - DECAY_PER_HOUR.hygiene * hours);
    s.energy = clamp(s.energy - DECAY_PER_HOUR.energy * hours);
    s.happiness = clamp(s.happiness - happinessRate * hours);
  }

  // EXP grows with time while no stat is empty (more when thriving); each empty stat
  // drains it instead, doubling per extra empty stat.
  const empty = countEmptyStats(s);
  if (empty === 0) {
    gainExp(pet, (passiveExpPerHour(pet.level) + (isThriving(s) ? CARE_EXP_PER_HOUR : 0)) * hours, t);
  } else {
    loseExp(pet, expLossPerHour(pet.level, empty) * hours);
  }

  // Sick: also lose a whole level right away, then again every interval it stays sick.
  // The clock survives a brief recovery, so feeding once doesn't re-trigger the penalty early.
  const end = t + dt;
  if (isSick(s) && (pet.lastSickPenaltyAt == null || end - pet.lastSickPenaltyAt >= SICK_LEVEL_PENALTY_INTERVAL_MS)) {
    loseLevel(pet);
    pet.lastSickPenaltyAt = end;
  }

  pet.status = deriveStatus(pet, end);
}

/**
 * Catches the pet up from `pet.lastUpdated` to `now`. Used both when the app opens
 * (offline time) and on every live tick (a second or so).
 *
 * Long gaps are split into at most MAX_STEPS steps so that threshold crossings
 * (stats dropping below 70 or hitting 0, waking up, heat starting) happen at about the right time.
 */
export function calculateOfflineDecay(pet: PetData, now: number = Date.now()): PetData {
  const next = clonePet(pet);
  const elapsed = now - pet.lastUpdated;
  if (elapsed <= 0) return next; // clock went backwards: don't rewind

  const stepMs = Math.max(MIN_STEP_MS, elapsed / MAX_STEPS);
  let t = pet.lastUpdated;
  while (t < now) {
    const dt = Math.min(stepMs, now - t);
    step(next, dt, t);
    t += dt;
  }
  unequipLockedItems(next);
  next.lastUpdated = now;
  return next;
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export type StatDelta = Partial<Record<StatKey, number>>;

export type ActionResult =
  | { ok: true; pet: PetData; delta: StatDelta; message?: string }
  | { ok: false; reason: string };

export interface ActionBlocker {
  /** locked/cooldown/asleep disable the button; "refused" lets the pup say no when clicked. */
  kind: "locked" | "cooldown" | "asleep" | "refused";
  reason: string;
}

/** Why an action can't be used right now, or null if it can. Also used to disable buttons. */
export function getActionBlocker(pet: PetData, action: PetAction, now: number): ActionBlocker | null {
  if (pet.level < ACTION_MIN_LEVEL[action]) {
    return { kind: "locked", reason: `Unlocks at LV ${ACTION_MIN_LEVEL[action]}` };
  }
  const last = pet.lastActionAt[action] ?? 0;
  if (now - last < ACTION_COOLDOWN_MS[action]) return { kind: "cooldown", reason: "Cooling down..." };
  if (pet.status === "SLEEPING" && action !== "sleep") return { kind: "asleep", reason: "Shh... sleeping!" };

  const refused = (reason: string): ActionBlocker => ({ kind: "refused", reason });
  switch (action) {
    case "feed":
      return pet.stats.hunger >= 95 ? refused("Already full!") : null;
    case "bathe":
      return pet.stats.hygiene >= 95 ? refused("Already clean!") : null;
    case "sleep":
      return pet.status !== "SLEEPING" && pet.stats.energy >= 90 ? refused("Not sleepy yet!") : null;
    case "walk":
      return pet.stats.energy < 15 ? refused("Too tired to walk") : null;
    default:
      return null;
  }
}

const EFFECTS: Record<Exclude<PetAction, "sleep">, StatDelta> = {
  feed: { hunger: 35, happiness: 3 },
  bathe: { hygiene: 45, happiness: -5, energy: -3 },
  pet: { happiness: 12 },
  walk: { happiness: 25, energy: -15, hygiene: -10, hunger: -5 },
  toy: { happiness: 20 },
};

export function applyAction(pet: PetData, action: PetAction, now: number = Date.now()): ActionResult {
  const current = calculateOfflineDecay(pet, now);
  const blocker = getActionBlocker(current, action, now);
  if (blocker) return { ok: false, reason: blocker.reason };

  const next = clonePet(current);
  next.lastActionAt[action] = now;
  let message: string | undefined;
  const delta: StatDelta = {};

  if (action === "sleep") {
    if (next.status === "SLEEPING") {
      next.status = "NORMAL";
      message = "Good morning!";
    } else {
      next.status = "SLEEPING";
      message = "Zzz...";
    }
  } else {
    for (const [key, amount] of Object.entries(EFFECTS[action]) as [StatKey, number][]) {
      const before = next.stats[key];
      next.stats[key] = clamp(before + amount);
      delta[key] = Math.round(next.stats[key] - before);
    }
    if (action === "walk" || action === "toy") {
      next.estrusSoothedUntil = now + SOOTHE_DURATION_MS;
      if (isEstrusActive(next, now)) message = "Calmed down... for now";
    }
  }

  next.status = deriveStatus(next, now);
  next.lastUpdated = now;
  return { ok: true, pet: next, delta, message };
}
