"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MotionConfig, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IconButton, Notice } from "@/components/GameScreen";
import PetHeader from "@/components/hud/PetHeader";
import StatBars from "@/components/hud/StatBars";
import PetStage from "@/components/pet/PetStage";
import { SfxProvider, useSfx } from "@/components/ui/SfxProvider";
import { COLUMN } from "@/components/ui/layout";
import { isFirebaseConfigured } from "@/lib/firebase";
import { calculateOfflineDecay } from "@/lib/game/engine";
import { ensureAnonymousUser, watchPet } from "@/lib/petRepository";
import type { PetData } from "@/types/pet";

dayjs.extend(relativeTime);

const TICK_MS = 1_000;
const NO_FLOATERS: never[] = [];
const noop = () => {};

export default function VisitScreen({ uid }: { uid: string }) {
  return (
    <SfxProvider>
      <MotionConfig reducedMotion="user">
        <Visit uid={uid} />
      </MotionConfig>
    </SfxProvider>
  );
}

type Loaded = { status: "loading" } | { status: "error"; message: string } | { status: "missing" } | { status: "ready"; saved: PetData };

/**
 * Someone else's room, read-only. The stored document is only as fresh as the owner's
 * last save, so decay is replayed locally up to now for display. Nothing is ever written.
 */
function Visit({ uid }: { uid: string }) {
  const router = useRouter();
  const { play } = useSfx();
  const bark = useCallback(() => play("woof"), [play]);
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [pet, setPet] = useState<PetData | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    const fail = (err: unknown) => setLoaded({ status: "error", message: err instanceof Error ? err.message : String(err) });

    ensureAnonymousUser()
      .then(() => {
        if (cancelled) return;
        unsubscribe = watchPet(
          uid,
          (saved) => {
            setLoaded(saved ? { status: "ready", saved } : { status: "missing" });
            setPet(saved && calculateOfflineDecay(saved, Date.now()));
          },
          fail,
        );
      })
      .catch(fail);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid]);

  const ready = pet !== null;
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setPet((p) => p && calculateOfflineDecay(p, Date.now())), TICK_MS);
    return () => clearInterval(id);
  }, [ready]);

  const goHome = () => router.push("/");

  if (!isFirebaseConfigured || loaded.status === "error" || loaded.status === "missing") {
    return (
      <Notice title={loaded.status === "missing" ? "Pup not found" : "Something went wrong"}>
        {loaded.status === "error" && <p className="mb-5 break-words text-muted">{loaded.message}</p>}
        <button type="button" onClick={goHome} className="w-full rounded-full bg-accent py-3.5 font-semibold text-on-accent">
          Back to my pup
        </button>
      </Notice>
    );
  }
  if (loaded.status === "loading" || !pet) {
    return <main className={COLUMN} aria-busy="true" aria-label="Loading" />;
  }

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
        Just visiting · last played {dayjs(loaded.saved.lastUpdated).fromNow()}
      </p>
    </main>
  );
}
