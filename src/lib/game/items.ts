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
  { id: "beanie_yellow_pixel", name: "Beanie", slot: "hat", src: "/sprites/items/beanie_yellow_pixel.svg", minLevel: 2 },
  { id: "bow_pink_pixel", name: "Pink Bow", slot: "hat", src: "/sprites/items/bow_pink_pixel.svg", minLevel: 3 },
  { id: "flower_crown_pixel", name: "Flowers", slot: "hat", src: "/sprites/items/flower_crown_pixel.svg", minLevel: 5 },
  { id: "party_hat_pixel", name: "Party Hat", slot: "hat", src: "/sprites/items/party_hat_pixel.svg", minLevel: 7 },
  { id: "shades_pixel", name: "Shades", slot: "hat", src: "/sprites/items/shades_pixel.svg", minLevel: 9 },
  { id: "crown_gold_pixel", name: "Gold Crown", slot: "hat", src: "/sprites/items/crown_gold_pixel.svg", minLevel: 10 },
  { id: "headphones_pixel", name: "Headphones", slot: "hat", src: "/sprites/items/headphones_pixel.svg", minLevel: 14 },
  { id: "top_hat_pixel", name: "Top Hat", slot: "hat", src: "/sprites/items/top_hat_pixel.svg", minLevel: 18 },
  { id: "halo_pixel", name: "Halo", slot: "hat", src: "/sprites/items/halo_pixel.svg", minLevel: 25 },
  { id: "shirt_blue_pixel", name: "Blue Shirt", slot: "clothes", src: "/sprites/items/shirt_blue_pixel.svg", minLevel: 1 },
  { id: "bowtie_red_pixel", name: "Bowtie", slot: "clothes", src: "/sprites/items/bowtie_red_pixel.svg", minLevel: 2 },
  { id: "bandana_green_pixel", name: "Bandana", slot: "clothes", src: "/sprites/items/bandana_green_pixel.svg", minLevel: 4 },
  { id: "scarf_striped_pixel", name: "Scarf", slot: "clothes", src: "/sprites/items/scarf_striped_pixel.svg", minLevel: 6 },
  { id: "sweater_pink_pixel", name: "Sweater", slot: "clothes", src: "/sprites/items/sweater_pink_pixel.svg", minLevel: 8 },
  { id: "raincoat_yellow_pixel", name: "Raincoat", slot: "clothes", src: "/sprites/items/raincoat_yellow_pixel.svg", minLevel: 11 },
  { id: "cape_hero_pixel", name: "Hero Cape", slot: "clothes", src: "/sprites/items/cape_hero_pixel.svg", minLevel: 15 },
  { id: "tuxedo_pixel", name: "Tuxedo", slot: "clothes", src: "/sprites/items/tuxedo_pixel.svg", minLevel: 20 },
  { id: "royal_robe_pixel", name: "Royal Robe", slot: "clothes", src: "/sprites/items/royal_robe_pixel.svg", minLevel: 28 },
];

export const getWearable = (id: string | null) => WEARABLES.find((w) => w.id === id) ?? null;

/** Draw order, bottom to top. */
export const SLOT_ORDER: EquipSlot[] = ["clothes", "hat"];
