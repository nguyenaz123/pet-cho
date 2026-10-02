"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion } from "framer-motion";
import { useState } from "react";
import { MAX_LEVEL, STAGE_LABEL, expToNext } from "@/lib/game/constants";
import { getLifeStage, msUntilNextEstrus } from "@/lib/game/engine";
import type { PetData } from "@/types/pet";

dayjs.extend(relativeTime);

interface Props {
  pet: PetData;
  onRename: (name: string) => void;
}

export default function PetHeader({ pet, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pet.petName);
  const stage = getLifeStage(pet.level);
  const need = expToNext(pet.level);
  const maxed = pet.level >= MAX_LEVEL;
  const progress = maxed ? 1 : Math.min(1, pet.exp / need);
  const heatIn = msUntilNextEstrus(pet, pet.lastUpdated);

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <LevelRing level={pet.level} progress={progress} label={maxed ? "Max level" : `${Math.floor(pet.exp)} of ${need} EXP`} />

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

function LevelRing({ level, progress, label }: { level: number; progress: number; label: string }) {
  return (
    <div className="relative size-14 shrink-0" role="img" aria-label={`Level ${level}, ${label}`}>
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
      <motion.div
        key={level}
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className="absolute inset-0 flex flex-col items-center justify-center leading-none"
      >
        <span className="text-[10px] font-semibold text-muted">LV</span>
        <span className="mt-0.5 font-display text-[12px]">{level}</span>
      </motion.div>
    </div>
  );
}
