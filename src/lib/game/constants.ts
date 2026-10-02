import type { LifeStage, PetAction, StatKey } from "@/types/pet";

/**
 * Game time runs TIME_SCALE times faster than real time.
 * 1 = real time (production). The default of 100 drains a full stat bar in ~10 real
 * minutes, which is handy for testing. Override with NEXT_PUBLIC_TIME_SCALE.
 */
export const TIME_SCALE = Number(process.env.NEXT_PUBLIC_TIME_SCALE) || 100;

const HOUR = 60 * 60 * 1000;
/** Converts a duration in game hours to real milliseconds. */
export const gameHours = (h: number) => (h * HOUR) / TIME_SCALE;

export const STAT_MAX = 100;
export const STAT_MIN = 0;

/** Stat drop per game hour while awake. */
export const DECAY_PER_HOUR: Record<StatKey, number> = {
  hunger: 6, // empty in ~16h
  hygiene: 4, // ~25h
  energy: 5, // ~20h
  happiness: 5, // ~20h
};

/** Multiplier on DECAY_PER_HOUR while sleeping (energy regenerates instead). */
export const SLEEP_DECAY_FACTOR: Record<Exclude<StatKey, "energy">, number> = {
  hunger: 0.5,
  hygiene: 0.5,
  happiness: 0.25,
};
export const SLEEP_ENERGY_REGEN_PER_HOUR = 20;

/** All stats above this: the pet thrives and earns bonus EXP. */
export const THRIVING_THRESHOLD = 70;
/** Stat bars turn red below this. Visual warning only. */
export const LOW_STAT_THRESHOLD = 20;

export const MAX_LEVEL = 30;
/** EXP needed to go from `level` to `level + 1`. Grows quadratically. */
export const expToNext = (level: number) => 50 + level * 25 + 2 * level * level;

/** EXP earned per game hour just by being alive (no stat at 0); shrinks as the pet levels up. */
export const PASSIVE_EXP_BASE = 24;
export const PASSIVE_EXP_FALLOFF = 0.1;
export const passiveExpPerHour = (level: number) => PASSIVE_EXP_BASE / (1 + PASSIVE_EXP_FALLOFF * (level - 1));

/** Bonus EXP per game hour while thriving, on top of the passive gain. */
export const CARE_EXP_PER_HOUR = 10;

/**
 * EXP lost per game hour while `emptyStats` stats sit at 0, scaled by the current level's
 * bar so the penalty stays as painful at high levels: 5% of the bar for one empty stat,
 * doubling for each extra one (10%, 20%, 40%).
 */
export const EXP_LOSS_RATIO_PER_HOUR = 0.05;
export const expLossPerHour = (level: number, emptyStats: number) =>
  emptyStats === 0 ? 0 : EXP_LOSS_RATIO_PER_HOUR * 2 ** (emptyStats - 1) * expToNext(level);

/** Sick (every stat at 0) costs a whole level, at most once per this interval. */
export const SICK_LEVEL_PENALTY_INTERVAL_MS = gameHours(24);

export const PUBERTY_LEVEL = 6;
export const ADULT_LEVEL = 16;

export const STAGE_LABEL: Record<LifeStage, string> = {
  PUPPY: "Puppy",
  TEEN: "Teen",
  ADULT: "Adult",
};

/** Estrus (heat) repeats every 3 game days and lasts 12 game hours. */
export const ESTRUS_CYCLE_MS = gameHours(72);
export const ESTRUS_DURATION_MS = gameHours(12);
/** While in heat (and not soothed) happiness drains this much faster. */
export const ESTRUS_HAPPINESS_MULTIPLIER = 2;
/** How long a walk / new toy keeps a pet in heat calm. */
export const SOOTHE_DURATION_MS = gameHours(4);

/** Real-time cooldowns, so they feel the same at any TIME_SCALE. */
export const ACTION_COOLDOWN_MS: Record<PetAction, number> = {
  feed: 3_000,
  bathe: 5_000,
  sleep: 1_000,
  pet: 4_000,
  walk: 20_000,
  toy: 30_000,
};

/** Minimum level for each action. */
export const ACTION_MIN_LEVEL: Record<PetAction, number> = {
  feed: 1,
  bathe: 1,
  sleep: 1,
  pet: 1,
  walk: 1,
  toy: PUBERTY_LEVEL,
};

/** At puberty a sweetheart moves in and shares the room. */
export const PARTNER_LEVEL = PUBERTY_LEVEL;
export const PARTNER_NAME = "Mochi";

/** Simulation granularity for calculateOfflineDecay. */
export const MIN_STEP_MS = 1_000;
export const MAX_STEPS = 2_000;
