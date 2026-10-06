"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MotionConfig, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconButton } from "@/components/GameScreen";
import PetHeader from "@/components/hud/PetHeader";
import StatBars from "@/components/hud/StatBars";
import PetStage from "@/components/pet/PetStage";
import Notice from "@/components/ui/Notice";
import { SfxProvider, useSfx } from "@/components/ui/SfxProvider";
import { COLUMN } from "@/components/ui/layout";
import { calculateOfflineDecay } from "@/lib/game/engine";
import type { PetData } from "@/types/pet";

dayjs.extend(relativeTime);

const TICK_MS = 1_000;
/** How often to re-read the owner's latest save from the server while visiting. */
const REFRESH_MS = 10_000;
const NO_FLOATERS: never[] = [];
const noop = () => {};

export default function VisitScreen({ saved }: { saved: PetData }) {
  return (
    <SfxProvider>
      <MotionConfig reducedMotion="user">
        <Visit saved={saved} />
      </MotionConfig>
    </SfxProvider>
  );
}

export function PupNotFound() {
  return (
    <Notice title="Pup not found">
      <Link href="/" className="block w-full rounded-full bg-accent py-3.5 text-center font-semibold text-on-accent">
        Back to my pup
      </Link>
    </Notice>
  );
}

/**
 * Someone else's room, read-only. The stored row is only as fresh as the owner's
 * last save, so decay is replayed locally up to now for display. Nothing is ever written.
 */
function Visit({ saved }: { saved: PetData }) {
  const router = useRouter();
  const { play } = useSfx();
  const bark = useCallback(() => play("woof"), [play]);
  const [now, setNow] = useState(() => Date.now());
  // Replayed from the latest save every tick, so a refreshed `saved` is picked up as is.
  const pet = useMemo(() => calculateOfflineDecay(saved, Math.max(now, saved.lastUpdated)), [saved, now]);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), TICK_MS);
    // Re-runs the server page, which re-reads the pet: a cheap stand-in for a live subscription.
    const refreshId = setInterval(() => router.refresh(), REFRESH_MS);
    return () => {
      clearInterval(tickId);
      clearInterval(refreshId);
    };
  }, [router]);

  const goHome = () => router.push("/");

  return (
    <main className={`${COLUMN} pb-[max(0.75rem,env(safe-area-inset-bottom))]`}>
      <header className="flex items-center gap-2 py-1">
        <IconButton label="Back to my pup" icon="back" onClick={goHome} />
        <PetHeader pet={pet} />
      </header>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bezel"
        aria-label={`${pet.petName}'s room`}
      >
        <PetStage pet={pet} activity={null} onBark={bark} />
      </motion.section>

      <section aria-label="Stats">
        <StatBars stats={pet.stats} floaters={NO_FLOATERS} onFloaterDone={noop} />
      </section>

      <p className="text-center text-[14px] text-muted">
        Just visiting · last played {dayjs(saved.lastUpdated).fromNow()}
      </p>
    </main>
  );
}
