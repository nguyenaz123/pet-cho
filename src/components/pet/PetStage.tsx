"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import PetSprite, { PartnerSprite, type PartnerPose, type SpritePose } from "./PetSprite";
import { PARTNER_LEVEL, PARTNER_NAME } from "@/lib/game/constants";
import { getLifeStage } from "@/lib/game/engine";
import type { Activity } from "@/store/usePetStore";
import type { LifeStage, PetData } from "@/types/pet";

const SIZE_BY_STAGE: Record<LifeStage, number> = { PUPPY: 128, TEEN: 160, ADULT: 192 };
const BARK_EVERY_MS = 2_200;
/** How far (in wander units, -1..1) the partner keeps from the pup: close enough to cuddle. */
const PARTNER_GAP = 1.1;

interface Props {
  pet: PetData;
  activity: Activity | null;
  onBark: () => void;
}

/** A target spot on the floor: x in -1..1 of the free floor width, plus travel time in seconds. */
interface Spot {
  x: number;
  dur: number;
}

function poseFor(pet: PetData, activity: Activity | null): SpritePose {
  if (pet.status === "SLEEPING") return "sleeping";
  if (activity === "eating") return "eating";
  if (pet.status === "SICK") return "sick";
  return "idle";
}

function partnerPoseFor(pet: PetData, activity: Activity | null): PartnerPose {
  if (pet.status === "SLEEPING") return "sleeping";
  if (activity === "petting" || activity === "playing" || activity === "walking") return "happy";
  return "idle";
}

const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));
const travelTime = (from: number, to: number) => 0.5 + Math.abs(to - from) * 1.3;

export default function PetStage({ pet, activity, onBark }: Props) {
  const reduceMotion = useReducedMotion();
  const roomRef = useRef<HTMLDivElement>(null);
  const [roomW, setRoomW] = useState(360);

  const stage = getLifeStage(pet.level);
  const size = SIZE_BY_STAGE[stage];
  const partnerSize = size - 32;
  const withPartner = pet.level >= PARTNER_LEVEL;
  const sleeping = pet.status === "SLEEPING";
  const sick = pet.status === "SICK";
  const inHeat = pet.status === "ESTRUS";
  const walking = activity === "walking";

  const [spot, setSpot] = useState<Spot>({ x: 0, dur: 0 });
  const [partnerSpot, setPartnerSpot] = useState<Spot>({ x: -PARTNER_GAP, dur: 0 });
  const [moving, setMoving] = useState({ pup: false, partner: false });
  const [barking, setBarking] = useState(false);

  // Free floor on each side of centre, in px, so sprites never leave the room.
  const range = Math.max(0, (roomW - size) / 2 - 10);
  const partnerRange = Math.max(0, (roomW - partnerSize) / 2 - 10);

  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setRoomW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wander around the room whenever the pup is awake, well and not busy.
  // Restless in heat: shorter pauses between trips.
  const canWander = !sleeping && !sick && !activity && !reduceMotion;
  useEffect(() => {
    if (!canWander) return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const pause = inHeat ? 900 + Math.random() * 1_100 : 2_400 + Math.random() * 3_200;
      timer = setTimeout(() => {
        const x = Math.random() * 2 - 1;
        setSpot((prev) => ({ x, dur: travelTime(prev.x, x) }));
        setMoving((m) => ({ ...m, pup: true }));
        if (withPartner) {
          // She trots to whichever side of him has more room.
          const px = clampUnit(x > 0 ? x - PARTNER_GAP : x + PARTNER_GAP);
          setPartnerSpot((prev) => ({ x: px, dur: travelTime(prev.x, px) + 0.3 }));
          setMoving((m) => ({ ...m, partner: true }));
        }
        next();
      }, pause);
    };
    next();
    return () => clearTimeout(timer);
  }, [canWander, inHeat, withPartner]);

  // In heat, the pup barks non-stop.
  useEffect(() => {
    if (!inHeat) return;
    let hide: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setBarking(true);
      onBark();
      hide = setTimeout(() => setBarking(false), 1_000);
    }, BARK_EVERY_MS);
    return () => {
      clearInterval(id);
      clearTimeout(hide);
      setBarking(false);
    };
  }, [inHeat, onBark]);

  const pupX = spot.x * range;
  const partnerX = partnerSpot.x * partnerRange;

  const bodyClass = (isMoving: boolean) =>
    sleeping
      ? "anim-bob-slow"
      : walking || isMoving
        ? "anim-waddle"
        : inHeat
          ? "anim-shake"
          : activity
            ? "anim-bob-fast"
            : "anim-bob";

  return (
    <div
      ref={roomRef}
      className={`pet-room relative h-[clamp(270px,44dvh,400px)] overflow-hidden rounded-[22px] ${sleeping ? "is-night" : ""}`}
    >
      <div aria-hidden className="room-window absolute left-[9%] top-[11%] aspect-[4/3] h-[24%] rounded-[6px]" />
      {/* rug */}
      <div aria-hidden className="absolute bottom-[4%] left-1/2 h-[16%] w-[78%] -translate-x-1/2 rounded-[50%] bg-white/15" />

      <AnimatePresence>
        {(sick || inHeat || sleeping) && (
          <motion.span
            key={pet.status}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute left-3 top-3 z-[2] rounded-full px-3 py-1 text-[14px] font-medium ${
              sick ? "bg-bad text-white" : inHeat ? "bg-accent text-on-accent" : "bg-[#13214a] text-white"
            }`}
          >
            {sick ? "Sick" : inHeat ? "In heat" : "Sleeping"}
          </motion.span>
        )}
      </AnimatePresence>

      {withPartner && (
        <motion.div
          className="absolute bottom-[11%] left-1/2"
          style={{ marginLeft: -partnerSize / 2 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={
            walking
              ? { opacity: 1, scale: 1, x: [partnerX, -partnerRange, partnerRange * 0.8, -PARTNER_GAP * 0.5 * partnerRange] }
              : { opacity: 1, scale: 1, x: partnerX }
          }
          transition={
            walking
              ? { duration: 2.4, ease: [0.37, 0, 0.63, 1], delay: 0.15 }
              : { x: { duration: partnerSpot.dur, ease: [0.37, 0, 0.63, 1] }, default: { type: "spring", stiffness: 260, damping: 20 } }
          }
          onAnimationComplete={() => setMoving((m) => (m.partner ? { ...m, partner: false } : m))}
        >
          <Shadow width={partnerSize} />
          <div className={`relative ${bodyClass(moving.partner)}`}>
            <PartnerSprite pose={partnerPoseFor(pet, activity)} size={partnerSize} name={PARTNER_NAME} />
          </div>
          {!sleeping && !sick && (
            <img
              aria-hidden
              src="/sprites/icons/happiness.svg"
              alt=""
              width={20}
              height={20}
              className="anim-heart-puff absolute -right-1 top-[18%]"
            />
          )}
        </motion.div>
      )}

      <motion.div
        className="absolute bottom-[5%] left-1/2"
        style={{ marginLeft: -size / 2 }}
        animate={walking ? { x: [pupX, -range, range, 0] } : { x: pupX }}
        transition={walking ? { duration: 2.4, ease: [0.37, 0, 0.63, 1] } : { duration: spot.dur, ease: [0.37, 0, 0.63, 1] }}
        onAnimationComplete={() => setMoving((m) => (m.pup ? { ...m, pup: false } : m))}
      >
        <Shadow width={size} />
        <div className={`relative ${bodyClass(moving.pup)}`}>
          <PetSprite pose={poseFor(pet, activity)} equipped={pet.equippedItems} size={size} />
        </div>

        <AnimatePresence>
          {sleeping && <Zzz key="zzz" />}
          {activity === "bathing" && <Bubbles key="bubbles" />}
          {activity === "petting" && <Hearts key="hearts" />}
          {activity === "playing" && <Ball key="ball" />}
          {barking && (
            // Centred over the head so it never runs off either wall.
            <div key="bark" className="absolute -top-11 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="origin-bottom whitespace-nowrap rounded-[14px] bg-raised px-3 py-2 font-display text-[10px] text-ink shadow-[0_8px_20px_-8px_rgb(var(--shadow-rgb)/0.4)]"
              >
                WOOF! WOOF!
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Shadow({ width }: { width: number }) {
  return (
    <div
      aria-hidden
      className="absolute bottom-[3%] left-1/2 h-[10%] -translate-x-1/2 rounded-[50%] bg-[#3b2414]/25"
      style={{ width: width * 0.62 }}
    />
  );
}

function Zzz() {
  return (
    <motion.div
      className="absolute -top-2 right-2 font-display text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {["z", "Z", "Z"].map((z, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ fontSize: 10 + i * 4 }}
          animate={{ y: [0, -44], x: [0, 12 + i * 6], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {z}
        </motion.span>
      ))}
    </motion.div>
  );
}

function Bubbles() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 9 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full border-2 border-white bg-sky-200/60"
          style={{ left: `${8 + ((i * 37) % 82)}%`, bottom: "22%", width: 8 + (i % 3) * 4, height: 8 + (i % 3) * 4 }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: -130, opacity: [0, 1, 0], scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, delay: i * 0.14, repeat: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function Hearts() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.img
          key={i}
          src="/sprites/icons/happiness.svg"
          alt=""
          width={20}
          height={20}
          className="absolute"
          style={{ left: `${14 + i * 17}%`, top: "12%" }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: -70, opacity: [0, 1, 0], scale: [0.4, 1.2, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, delay: i * 0.16, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function Ball() {
  return (
    <motion.img
      src="/sprites/icons/toy.svg"
      alt=""
      width={30}
      height={30}
      className="absolute -right-10 bottom-0"
      initial={{ x: 70, opacity: 0 }}
      animate={{ x: [70, 0, 24, 0], y: [0, -56, 0, -20, 0], rotate: [0, 180, 300, 360], opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
