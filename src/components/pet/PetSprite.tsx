/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs; next/image adds nothing here */
import { getWearable, SLOT_ORDER } from "@/lib/game/items";
import type { EquippedItems } from "@/types/pet";

export type SpritePose = "idle" | "eating" | "sleeping" | "sick";
export type PartnerPose = "idle" | "happy" | "sleeping";

const POSE_SRC: Record<SpritePose, string> = {
  idle: "/sprites/dog/idle.svg",
  eating: "/sprites/dog/eating.svg",
  sleeping: "/sprites/dog/sleeping.svg",
  sick: "/sprites/dog/sick.svg",
};

interface Props {
  pose: SpritePose;
  equipped: EquippedItems;
  /** Rendered width/height in px (sprites are 32x32, so use multiples of 32). */
  size: number;
  className?: string;
}

/**
 * The dog plus clothing layers. Every layer is a transparent 32x32 image on the same
 * grid, stacked with absolute positioning, so items line up in every pose.
 */
export default function PetSprite({ pose, equipped, size, className = "" }: Props) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <img
        src={POSE_SRC[pose]}
        alt={`Puppy (${pose})`}
        width={size}
        height={size}
        className={`absolute inset-0 h-full w-full ${pose === "sick" ? "sprite-sick" : ""}`}
        draggable={false}
      />
      {SLOT_ORDER.map((slot) => {
        const item = getWearable(equipped[slot]);
        if (!item) return null;
        return (
          <img
            key={slot}
            src={item.src}
            alt={item.name}
            width={size}
            height={size}
            className="pointer-events-none absolute inset-0 h-full w-full"
            draggable={false}
          />
        );
      })}
    </div>
  );
}

/** The sweetheart who moves in at LV 6. She wears her own bow, so no wardrobe layers. */
export function PartnerSprite({ pose, size, name }: { pose: PartnerPose; size: number; name: string }) {
  return (
    <img
      src={`/sprites/partner/${pose}.svg`}
      alt={`${name} (${pose})`}
      width={size}
      height={size}
      className="block"
      draggable={false}
    />
  );
}
