"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVG icons */
import { useState } from "react";
import PressButton from "@/components/ui/PressButton";
import type { SfxKind } from "@/components/ui/SfxProvider";
import { ACTION_COOLDOWN_MS, ACTION_MIN_LEVEL } from "@/lib/game/constants";
import { getActionBlocker } from "@/lib/game/engine";
import type { PetAction, PetData } from "@/types/pet";

interface Props {
  pet: PetData;
  now: number;
  onAction: (action: PetAction) => void;
}

interface ActionDef {
  action: PetAction;
  label: string;
  icon: string;
  sound: SfxKind;
  /** Walk and toy calm a pup in heat, so they get highlighted then. */
  soothes?: boolean;
}

const ACTIONS: ActionDef[] = [
  { action: "feed", label: "Feed", icon: "hunger", sound: "feed" },
  { action: "bathe", label: "Bathe", icon: "hygiene", sound: "bathe" },
  { action: "pet", label: "Pet", icon: "happiness", sound: "pet" },
  { action: "walk", label: "Walk", icon: "walk", sound: "walk", soothes: true },
  { action: "toy", label: "Toy", icon: "toy", sound: "toy", soothes: true },
  { action: "sleep", label: "Sleep", icon: "sleep", sound: "sleep" },
];

export default function ActionBar({ pet, now, onAction }: Props) {
  const sleeping = pet.status === "SLEEPING";
  const inHeat = pet.status === "ESTRUS";

  return (
    <div className="bezel grid grid-cols-3 gap-1.5">
      {ACTIONS.map((def) => {
        const blocker = getActionBlocker(pet, def.action, now);
        // "refused" stays tappable so the pup can say no (and the button shakes).
        const disabled = blocker !== null && blocker.kind !== "refused";
        const locked = blocker?.kind === "locked";
        const waking = def.action === "sleep" && sleeping;
        const highlight = def.soothes && inHeat && !disabled;

        return (
          <PressButton
            key={def.action}
            title={blocker?.reason}
            aria-label={locked ? `${def.label}, unlocks at level ${ACTION_MIN_LEVEL[def.action]}` : undefined}
            disabled={disabled}
            refuse={blocker?.kind === "refused"}
            sound={waking ? "wake" : def.sound}
            burstColor={highlight ? "var(--on-accent)" : undefined}
            onClick={() => onAction(def.action)}
            className={`group flex flex-col items-center gap-1.5 rounded-[22px] px-1 pb-2.5 pt-3 transition-colors duration-300 disabled:cursor-not-allowed ${
              highlight ? "bg-accent text-on-accent" : "bezel-core text-ink"
            }`}
          >
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-[14px] bg-canvas ring-1 ring-line">
              <img
                src={`/sprites/icons/${locked ? "lock" : waking ? "wake" : def.icon}.svg`}
                alt=""
                width={30}
                height={30}
                className={`transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-enabled:group-active:scale-110 ${
                  disabled ? "opacity-40 grayscale" : ""
                }`}
              />
              {blocker?.kind === "cooldown" && (
                <CooldownSweep
                  key={pet.lastActionAt[def.action]}
                  startedAt={pet.lastActionAt[def.action] ?? now}
                  duration={ACTION_COOLDOWN_MS[def.action]}
                  now={now}
                />
              )}
            </span>
            <span className={`text-[15px] font-medium leading-none ${disabled ? "opacity-50" : ""}`}>
              {locked ? `LV ${ACTION_MIN_LEVEL[def.action]}` : waking ? "Wake" : def.label}
            </span>
          </PressButton>
        );
      })}
    </div>
  );
}

/**
 * A tinted plate that drains left-to-right over the cooldown. It is driven by a CSS
 * animation with a negative delay, so the once-a-second game tick doesn't restart it.
 */
function CooldownSweep({ startedAt, duration, now }: { startedAt: number; duration: number; now: number }) {
  const [elapsed] = useState(() => Math.max(0, now - startedAt));
  return (
    <span
      aria-hidden
      className="anim-cooldown absolute inset-0 bg-accent/25"
      style={{ animationDuration: `${duration}ms`, animationDelay: `-${elapsed}ms` }}
    />
  );
}
