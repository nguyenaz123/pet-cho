"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion } from "framer-motion";
import { useState } from "react";
import { MAX_LEVEL, STAGE_LABEL, expToNext } from "@/lib/game/constants";
import { countEmptyStats, getLifeStage, msUntilNextEstrus } from "@/lib/game/engine";
import { PetAvatar } from "@/components/pet/PetSprite";
import type { PetData } from "@/types/pet";

dayjs.extend(relativeTime);

interface Props {
  pet: PetData;
  /** Omit for a read-only header (visiting someone else's pet). */
  onRename?: (name: string) => void;
}

export default function PetHeader({ pet, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet.petName);
  const stage = getLifeStage(pet.level);
  const need = expToNext(pet.level);
  const maxed = pet.level >= MAX_LEVEL;
  const progress = maxed ? 1 : Math.min(1, pet.exp / need);
  const heatIn = msUntilNextEstrus(pet, pet.lastUpdated);
  const emptyStats = countEmptyStats(pet.stats);

  const commit = () => {
    onRename?.(draft);
    setEditing(false);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <LevelRing pet={pet} progress={progress} label={maxed ? "Max level" : `${Math.floor(pet.exp)} of ${need} EXP`} />

      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commit();
            }}
          >
            <input
              autoFocus
              aria-label="Pet name"
              className="w-full rounded-[10px] bg-raised px-2 py-1 font-display text-[13px] text-ink outline-none ring-2 ring-accent"
              value={draft}
              maxLength={16}
              enterKeyHint="done"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
            />
          </form>
        ) : !onRename ? (
          <h1 className="truncate py-1 font-display text-[13px] leading-tight">{pet.petName}</h1>
        ) : (
          <button
            type="button"
            className="block max-w-full truncate py-1 text-left font-display text-[13px] leading-tight active:scale-[0.97]"
            title="Tap to rename"
            onClick={() => {
              setDraft(pet.petName);
              setEditing(true);
            }}
          >
            {pet.petName}
          </button>
        )}
        <p className="mt-1 truncate text-[14px] text-muted">
          {STAGE_LABEL[stage]} · {maxed ? "Max level" : `${Math.floor(pet.exp)}/${need} EXP`}
        </p>
        {emptyStats > 0 && (
          <p className="anim-soft-pulse truncate text-[13px] font-semibold text-bad">
            Losing EXP · {emptyStats} empty stat{emptyStats > 1 ? "s" : ""}
          </p>
        )}
        {heatIn !== null && (
          <p className="truncate text-[13px] text-muted">
            {heatIn === 0 ? "In heat right now" : `Next heat ${dayjs(pet.lastUpdated + heatIn).from(pet.lastUpdated)}`}
          </p>
        )}
      </div>
    </div>
  );
}

const R = 23;

/** The pup's face inside an EXP ring, with the level on a badge. */
export function LevelRing({ pet, progress, label }: { pet: PetData; progress: number; label: string }) {
  return (
    <div className="relative size-14 shrink-0" role="img" aria-label={`Level ${pet.level}, ${label}`}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={R} fill="var(--surface)" stroke="var(--line)" strokeWidth="5" />
        <motion.circle
          cx="28"
          cy="28"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.max(0.001, progress) }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </svg>
      <PetAvatar
        breed={pet.breed}
        equipped={pet.equippedItems}
        size={40}
        className="pet-room absolute left-2 top-2 rounded-full"
      />
      <motion.span
        key={pet.level}
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-1.5 py-0.5 font-display text-[8px] leading-none text-on-accent ring-2 ring-surface"
      >
        {pet.level}
      </motion.span>
    </div>
  );
}
