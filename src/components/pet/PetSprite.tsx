/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs; next/image adds nothing here */
import { breedSprite } from "@/lib/game/breeds";
import { getWearable, SLOT_ORDER } from "@/lib/game/items";
import type { BreedId, EquippedItems } from "@/types/pet";

export type SpritePose = "idle" | "eating" | "sleeping" | "sick";
export type PartnerPose = "idle" | "happy" | "sleeping";

interface Props {
  pose: SpritePose;
  breed: BreedId;
  equipped: EquippedItems;
  /** Rendered width/height in px (sprites are 32x32, so use multiples of 32). */
  size: number;
  className?: string;
}

/**
 * The dog plus clothing layers. Every layer is a transparent 32x32 image on the same
 * grid, stacked with absolute positioning, so items line up in every pose.
 */
export default function PetSprite({ pose, breed, equipped, size, className = "" }: Props) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <img
        src={breedSprite(breed, pose)}
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

/** Square crop of the idle sprite (columns 4-27, rows 0-23): head, hat and collar. */
const AVATAR_CROP = { x: 4, w: 24 };

/** The pup's face, used as the player's avatar. Hats show, clothes are cropped out anyway. */
export function PetAvatar({
  breed,
  equipped,
  size,
  className = "",
}: {
  breed: BreedId;
  equipped: EquippedItems;
  size: number;
  className?: string;
}) {
  const full = (size * 32) / AVATAR_CROP.w;
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <span className="absolute top-0" style={{ left: (-AVATAR_CROP.x * full) / 32 }}>
        <PetSprite pose="idle" breed={breed} equipped={equipped} size={full} />
      </span>
    </span>
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
