"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVG icons */
import { AnimatePresence, motion } from "framer-motion";
import { LOW_STAT_THRESHOLD, THRIVING_THRESHOLD } from "@/lib/game/constants";
import { STAT_KEYS } from "@/lib/game/engine";
import type { Floater } from "@/store/usePetStore";
import type { PetStats, StatKey } from "@/types/pet";

const LABEL: Record<StatKey, string> = {
  hunger: "Food",
  hygiene: "Clean",
  energy: "Energy",
  happiness: "Joy",
};

function tone(v: number) {
  if (v < LOW_STAT_THRESHOLD) return { bar: "bg-bad", text: "text-bad" };
  if (v <= THRIVING_THRESHOLD) return { bar: "bg-warn", text: "text-ink" };
  return { bar: "bg-good", text: "text-ink" };
}

/** Ten pixel "cells" cut out of the fill, like an old HUD. */
const SEGMENTS = "repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), var(--surface) calc(10% - 2px) 10%)";

interface Props {
  stats: PetStats;
  floaters: Floater[];
  onFloaterDone: (id: number) => void;
}

export default function StatBars({ stats, floaters, onFloaterDone }: Props) {
  return (
    <div className="bezel grid grid-cols-2 gap-1.5">
      {STAT_KEYS.map((key) => {
        const value = Math.round(stats[key]);
        const t = tone(value);
        const low = value < LOW_STAT_THRESHOLD;
        return (
          <div key={key} className="bezel-core relative px-3.5 pb-3.5 pt-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[15px] font-medium">
                <img src={`/sprites/icons/${key}.svg`} alt="" width={20} height={20} />
                {LABEL[key]}
              </span>
              <span className={`font-display text-[11px] tabular-nums ${t.text} ${low ? "anim-soft-pulse" : ""}`}>{value}</span>
            </div>

            <div
              role="meter"
              aria-label={LABEL[key]}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              className="relative h-2.5 overflow-hidden rounded-[3px] bg-line"
            >
              <div
                className={`absolute inset-0 origin-left transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${t.bar}`}
                style={{ transform: `scaleX(${value / 100})` }}
              />
              <div aria-hidden className="absolute inset-0" style={{ background: SEGMENTS }} />
            </div>

            <AnimatePresence>
              {floaters
                .filter((f) => f.stat === key)
                .map((f) => (
                  <motion.span
                    key={f.id}
                    className={`pointer-events-none absolute right-3 top-9 font-display text-[12px] ${f.amount > 0 ? "text-good" : "text-bad"}`}
                    initial={{ y: 0, opacity: 0, scale: 0.6 }}
                    animate={{ y: -30, opacity: [0, 1, 1, 0], scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    onAnimationComplete={() => onFloaterDone(f.id)}
                  >
                    {f.amount > 0 ? `+${f.amount}` : f.amount}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
