import type { PetData } from "@/types/pet";

/** Browser-side save. keepalive lets the request finish even if the tab is closing. */
export async function putPet(pet: PetData): Promise<void> {
  const res = await fetch("/api/pet", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pet),
    keepalive: true,
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
}
