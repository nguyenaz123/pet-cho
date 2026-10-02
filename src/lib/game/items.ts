import type { EquipSlot } from "@/types/pet";

export interface Wearable {
  id: string;
  name: string;
  slot: EquipSlot;
  /** Transparent 32x32 sprite drawn on the same grid as the dog. */
  src: string;
  minLevel: number;
}

export const WEARABLES: Wearable[] = [
  { id: "cap_red_pixel", name: "Red Cap", slot: "hat", src: "/sprites/items/cap_red_pixel.svg", minLevel: 1 },
  { id: "bow_pink_pixel", name: "Pink Bow", slot: "hat", src: "/sprites/items/bow_pink_pixel.svg", minLevel: 3 },
  { id: "crown_gold_pixel", name: "Gold Crown", slot: "hat", src: "/sprites/items/crown_gold_pixel.svg", minLevel: 10 },
  { id: "shirt_blue_pixel", name: "Blue Shirt", slot: "clothes", src: "/sprites/items/shirt_blue_pixel.svg", minLevel: 1 },
  { id: "bandana_green_pixel", name: "Bandana", slot: "clothes", src: "/sprites/items/bandana_green_pixel.svg", minLevel: 4 },
];

export const getWearable = (id: string | null) => WEARABLES.find((w) => w.id === id) ?? null;

/** Draw order, bottom to top. */
export const SLOT_ORDER: EquipSlot[] = ["clothes", "hat"];
