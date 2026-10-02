"use client";

import { useEffect } from "react";
import { usePetStore } from "@/store/usePetStore";

const TICK_MS = 1_000;
const AUTOSAVE_MS = 15_000;

/**
 * Drives the simulation while the page is open: ticks every second, autosaves
 * periodically, and flushes a save when the tab is hidden or closed.
 * Ticks use wall-clock time, so throttled background tabs catch up correctly.
 */
export function useGameLoop(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const { tick, save } = usePetStore.getState();

    const tickId = setInterval(tick, TICK_MS);
    const saveId = setInterval(() => void save(), AUTOSAVE_MS);

    const onVisibility = () => {
      tick();
      if (document.visibilityState === "hidden") void save();
    };
    const onPageHide = () => {
      tick();
      void save();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(tickId);
      clearInterval(saveId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled]);
}
