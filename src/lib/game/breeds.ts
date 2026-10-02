import type { BreedId } from "@/types/pet";

export interface Breed {
  id: BreedId;
  name: string;
  minLevel: number;
}

/** Every breed shares one silhouette, so all wearables fit all of them. */
export const BREEDS: Breed[] = [
  { id: "shiba", name: "Shiba", minLevel: 1 },
  { id: "husky", name: "Husky", minLevel: 1 },
  { id: "choco", name: "Choco Lab", minLevel: 3 },
  { id: "dalmatian", name: "Dalmatian", minLevel: 5 },
  { id: "pug", name: "Pug", minLevel: 8 },
  { id: "poodle", name: "Poodle", minLevel: 12 },
  { id: "golden", name: "Golden", minLevel: 18 },
];

export const DEFAULT_BREED: BreedId = "shiba";

export const getBreed = (id: string | null | undefined) => BREEDS.find((b) => b.id === id) ?? null;

export const breedSprite = (breed: BreedId, pose: string) => `/sprites/dog/${breed}/${pose}.svg`;
