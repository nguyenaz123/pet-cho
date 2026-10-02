"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "pixel-pet:sfx";

export type SfxKind =
  | "tap"
  | "feed"
  | "bathe"
  | "sleep"
  | "wake"
  | "pet"
  | "walk"
  | "toy"
  | "nope"
  | "open"
  | "close"
  | "woof";

interface Note {
  freq: number;
  /** Glide to this frequency by the end of the note. */
  to?: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
}

/** Every sound is a handful of 8-bit oscillator notes. */
const SOUNDS: Record<SfxKind, Note[]> = {
  tap: [{ freq: 660, at: 0, dur: 0.04 }],
  feed: [
    { freq: 520, at: 0, dur: 0.05 },
    { freq: 700, at: 0.07, dur: 0.06 },
  ],
  bathe: [
    { freq: 900, to: 1300, at: 0, dur: 0.06, type: "triangle" },
    { freq: 700, to: 1100, at: 0.08, dur: 0.06, type: "triangle" },
    { freq: 1000, to: 1500, at: 0.16, dur: 0.06, type: "triangle" },
  ],
  sleep: [{ freq: 520, to: 260, at: 0, dur: 0.35, type: "triangle", vol: 0.08 }],
  wake: [
    { freq: 392, at: 0, dur: 0.07 },
    { freq: 523, at: 0.08, dur: 0.07 },
    { freq: 659, at: 0.16, dur: 0.1 },
  ],
  pet: [
    { freq: 784, at: 0, dur: 0.08, type: "triangle", vol: 0.09 },
    { freq: 988, at: 0.1, dur: 0.12, type: "triangle", vol: 0.09 },
  ],
  walk: [0, 0.09, 0.18, 0.27].map((at, i) => ({ freq: i % 2 ? 330 : 280, at, dur: 0.04 })),
  toy: [{ freq: 200, to: 820, at: 0, dur: 0.18 }],
  nope: [
    { freq: 150, at: 0, dur: 0.07 },
    { freq: 120, at: 0.09, dur: 0.1 },
  ],
  open: [
    { freq: 523, at: 0, dur: 0.05 },
    { freq: 784, at: 0.06, dur: 0.06 },
  ],
  close: [
    { freq: 784, at: 0, dur: 0.05 },
    { freq: 523, at: 0.06, dur: 0.06 },
  ],
  // Two square-wave blips gliding down.
  woof: [
    { freq: 420, to: 160, at: 0, dur: 0.14 },
    { freq: 420, to: 160, at: 0.18, dur: 0.14 },
  ],
};

const HAPTICS: Partial<Record<SfxKind, number | number[]>> = {
  tap: 8,
  nope: [18, 40, 18],
  woof: 0,
};

function playNotes(ctx: AudioContext, notes: Note[]) {
  const start = ctx.currentTime;
  for (const n of notes) {
    const t = start + n.at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type ?? "square";
    osc.frequency.setValueAtTime(n.freq, t);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t + n.dur);
    gain.gain.setValueAtTime(n.vol ?? 0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + n.dur + 0.01);
  }
}

interface SfxApi {
  enabled: boolean;
  toggle: () => void;
  /** Plays a sound (if SFX is on) and a short vibration (where the device supports it). */
  play: (kind: SfxKind) => void;
}

const SfxContext = createContext<SfxApi>({ enabled: false, toggle: () => {}, play: () => {} });

/** Sound-effects toggle (off by default, remembered per browser) shared by every button. */
export function SfxProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      // Reading localStorage must wait until after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(localStorage.getItem(STORAGE_KEY) === "on");
    } catch {
      /* storage unavailable: keep default */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const play = useCallback(
    (kind: SfxKind) => {
      const buzz = HAPTICS[kind] ?? 10;
      if (buzz) navigator.vibrate?.(buzz);
      if (!enabled) return;
      ctxRef.current ??= new AudioContext();
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
      playNotes(ctxRef.current, SOUNDS[kind]);
    },
    [enabled],
  );

  const api = useMemo(() => ({ enabled, toggle, play }), [enabled, toggle, play]);
  return <SfxContext.Provider value={api}>{children}</SfxContext.Provider>;
}

export const useSfx = () => useContext(SfxContext);
