"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs */
import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { LifeStage } from "@/types/pet";

interface DecorItem {
  name: string;
  /** Sprite size in art pixels (see scripts/generate-sprites.mjs). */
  w: number;
  h: number;
  /** Placement in % of the room. Wall items use `top`, furniture stands on the floor with `bottom`. */
  pos: CSSProperties;
  className?: string;
}

/** Each life stage gets its own room. Furniture hugs the walls so the pups can roam in front. */
const DECOR: Record<LifeStage, DecorItem[]> = {
  PUPPY: [
    { name: "puppy_bunting", w: 30, h: 4, pos: { right: "6%", top: "8%" } },
    { name: "puppy_basket", w: 14, h: 10, pos: { left: "5%", bottom: "29%" } },
    { name: "puppy_bed", w: 22, h: 8, pos: { right: "4%", bottom: "27%" } },
  ],
  TEEN: [
    { name: "teen_poster", w: 16, h: 14, pos: { right: "12%", top: "10%" } },
    { name: "teen_plant", w: 10, h: 13, pos: { left: "36%", bottom: "33%" } },
    { name: "teen_toybox", w: 16, h: 11, pos: { left: "4%", bottom: "28%" } },
    { name: "teen_bed", w: 34, h: 7, pos: { right: "3%", bottom: "26%" } },
  ],
  ADULT: [
    { name: "adult_photo", w: 16, h: 12, pos: { left: "50%", top: "9%", translate: "-50% 0" } },
    { name: "adult_plant", w: 12, h: 17, pos: { left: "31%", bottom: "33%" } },
    { name: "adult_lamp", w: 10, h: 26, pos: { right: "26%", bottom: "33%" }, className: "decor-lamp" },
    { name: "adult_shelf", w: 16, h: 22, pos: { right: "4%", bottom: "32%" } },
    { name: "adult_bed", w: 30, h: 10, pos: { left: "4%", bottom: "20%" } },
  ],
};

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.9 } };

/** Wall, floor, window, rug and furniture. Cross-fades to the new room when the pup grows up. */
export default function RoomDecor({ stage, scale }: { stage: LifeStage; scale: number }) {
  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div key={`bg-${stage}`} aria-hidden className="room-bg absolute inset-0" data-stage={stage} {...fade}>
          <div className="room-rug absolute bottom-[4%] left-1/2 h-[16%] w-[78%] -translate-x-1/2" />
        </motion.div>
      </AnimatePresence>

      <div aria-hidden className="room-window absolute left-[9%] top-[11%] aspect-[4/3] h-[24%] rounded-[6px]">
        <AnimatePresence initial={false}>
          {stage === "ADULT" && (
            <motion.div key="curtains" {...fade}>
              <span className="room-curtain left-[-16%]" />
              <span className="room-curtain right-[-16%]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        <motion.div key={`decor-${stage}`} aria-hidden className="pointer-events-none absolute inset-0" {...fade}>
          {DECOR[stage].map((item) => (
            <img
              key={item.name}
              src={`/sprites/room/${item.name}.svg`}
              alt=""
              width={item.w * scale}
              height={item.h * scale}
              className={`absolute [image-rendering:pixelated] ${item.className ?? ""}`}
              style={item.pos}
              draggable={false}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
