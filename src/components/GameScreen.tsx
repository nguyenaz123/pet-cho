"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVG icons */
import { MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import FriendsModal from "@/components/FriendsModal";
import OfflineReportModal from "@/components/OfflineReportModal";
import ProfileModal from "@/components/ProfileModal";
import ActionBar from "@/components/hud/ActionBar";
import PetHeader from "@/components/hud/PetHeader";
import StatBars from "@/components/hud/StatBars";
import PetStage from "@/components/pet/PetStage";
import PressButton from "@/components/ui/PressButton";
import { SfxProvider, useSfx } from "@/components/ui/SfxProvider";
import Toasts from "@/components/ui/Toasts";
import { COLUMN } from "@/components/ui/layout";
import { useGameLoop } from "@/hooks/useGameLoop";
import { isFirebaseConfigured } from "@/lib/firebase";
import { TIME_SCALE } from "@/lib/game/constants";
import { usePetStore } from "@/store/usePetStore";

export default function GameScreen() {
  return (
    <SfxProvider>
      <MotionConfig reducedMotion="user">
        <Game />
      </MotionConfig>
    </SfxProvider>
  );
}

/** Staggered entrance for the main blocks (hierarchy: pet first, then stats, then actions). */
const enter = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] as const },
});

function Game() {
  const phase = usePetStore((s) => s.phase);
  const error = usePetStore((s) => s.error);
  const pet = usePetStore((s) => s.pet);
  const activity = usePetStore((s) => s.activity);
  const toasts = usePetStore((s) => s.toasts);
  const floaters = usePetStore((s) => s.floaters);
  const offlineReport = usePetStore((s) => s.offlineReport);
  const { init, perform, equip, setBreed, rename, dismissOfflineReport, dismissToast, dismissFloater } = usePetStore.getState();

  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const { enabled: sfxEnabled, toggle: toggleSfx, play } = useSfx();
  const bark = useCallback(() => play("woof"), [play]);

  useEffect(() => {
    if (isFirebaseConfigured) void init();
  }, [init]);
  useGameLoop(phase === "ready");

  if (!isFirebaseConfigured) return <SetupNotice />;
  if (phase === "error") {
    return (
      <Notice title="Something went wrong">
        <p className="mb-5 break-words text-muted">{error}</p>
        <PressButton
          onClick={() => window.location.reload()}
          burstColor="var(--on-accent)"
          className="w-full rounded-full bg-accent py-3.5 font-semibold text-on-accent"
        >
          Try again
        </PressButton>
      </Notice>
    );
  }
  if (!pet) return <GameSkeleton />;

  const sleeping = pet.status === "SLEEPING";

  return (
    <main className={COLUMN}>
      <motion.header {...enter(0)} className="flex items-center gap-2 py-1">
        <PetHeader pet={pet} onRename={rename} />
        <IconButton
          label="Profile"
          icon="dress"
          disabled={sleeping}
          title={sleeping ? "Shh... sleeping!" : "Profile"}
          onClick={() => setProfileOpen(true)}
        />
        <IconButton label="Friends" icon="friends" onClick={() => setFriendsOpen(true)} />
        <IconButton
          label={sfxEnabled ? "Mute sound" : "Turn sound on"}
          icon={sfxEnabled ? "sound_on" : "sound_off"}
          pressed={sfxEnabled}
          onClick={toggleSfx}
        />
      </motion.header>

      <motion.section {...enter(1)} className="bezel" aria-label="Pet room">
        <PetStage pet={pet} activity={activity?.type ?? null} onBark={bark} />
      </motion.section>

      <motion.section {...enter(2)} aria-label="Stats">
        <StatBars stats={pet.stats} floaters={floaters} onFloaterDone={dismissFloater} />
      </motion.section>

      {TIME_SCALE !== 1 && <p className="text-center text-[13px] text-muted">Test speed x{TIME_SCALE}</p>}

      {/* Thumb zone: the action dock sticks to the bottom of the screen. */}
      <motion.nav
        {...enter(3)}
        aria-label="Actions"
        className="sticky bottom-0 z-10 -mx-4 mt-auto bg-gradient-to-t from-canvas from-75% to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4"
      >
        {/* pet.lastUpdated advances every tick, so it doubles as the UI clock for cooldowns. */}
        <ActionBar pet={pet} now={pet.lastUpdated} onAction={perform} />
      </motion.nav>

      <ProfileModal
        open={profileOpen}
        pet={pet}
        onEquip={equip}
        onBreed={setBreed}
        onClose={() => setProfileOpen(false)}
      />
      <FriendsModal open={friendsOpen} myUid={pet.ownerId} myPetName={pet.petName} onClose={() => setFriendsOpen(false)} />
      <OfflineReportModal report={offlineReport} onClose={dismissOfflineReport} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

export function IconButton({
  label,
  icon,
  onClick,
  disabled,
  pressed,
  title,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  title?: string;
}) {
  return (
    <PressButton
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line shadow-[0_6px_16px_-8px_rgb(var(--shadow-rgb)/0.35)] disabled:opacity-40"
    >
      <img src={`/sprites/icons/${icon}.svg`} alt="" width={20} height={20} />
    </PressButton>
  );
}

/** Same shape as the real screen, so nothing jumps when the pup loads. */
function GameSkeleton() {
  return (
    <main className={COLUMN} aria-busy="true" aria-label="Loading your pup">
      <div className="flex items-center gap-3 py-1">
        <div className="skeleton size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-28 rounded-full" />
          <div className="skeleton h-3 w-40 rounded-full" />
        </div>
        <div className="skeleton size-12 rounded-full" />
        <div className="skeleton size-12 rounded-full" />
        <div className="skeleton size-12 rounded-full" />
      </div>
      <div className="bezel">
        <div className="skeleton h-[clamp(270px,44dvh,400px)] rounded-[22px]" />
      </div>
      <div className="bezel grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-[74px] rounded-[22px]" />
        ))}
      </div>
      <div className="bezel mt-auto mb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-[94px] rounded-[22px]" />
        ))}
      </div>
    </main>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bezel w-full max-w-[440px]"
      >
        <div className="bezel-core px-6 py-7 text-[16px] leading-relaxed">
          <h1 className="mb-4 font-display text-[13px] leading-relaxed">{title}</h1>
          {children}
        </div>
      </motion.div>
    </main>
  );
}

function SetupNotice() {
  return (
    <Notice title="Setup needed">
      <p className="mb-4 text-muted">Firebase is not configured yet.</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Copy .env.local.example to .env.local</li>
        <li>Fill in your Firebase web app keys</li>
        <li>Enable Anonymous sign-in and Firestore</li>
        <li>Restart npm run dev</li>
      </ol>
    </Notice>
  );
}
