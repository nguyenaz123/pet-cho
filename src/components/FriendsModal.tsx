"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import PetSprite from "@/components/pet/PetSprite";
import { STAGE_LABEL } from "@/lib/game/constants";
import { getLifeStage } from "@/lib/game/engine";
import type { FriendPet } from "@/lib/petRepository";

dayjs.extend(relativeTime);

interface Props {
  open: boolean;
  onClose: () => void;
}

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; pets: FriendPet[] };

export default function FriendsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} title="Friends" onClose={onClose}>
      {/* Mounted per opening, so the list is fetched fresh each time. */}
      <FriendsList />
    </Modal>
  );
}

async function fetchFriends(): Promise<FriendPet[]> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error(`Could not load friends (${res.status})`);
  return res.json();
}

function FriendsList() {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchFriends()
      .then((pets) => !cancelled && setList({ status: "ready", pets }))
      .catch((err: unknown) => !cancelled && setList({ status: "error", message: err instanceof Error ? err.message : String(err) }));
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = filter.trim().toLowerCase();
  const shown = list.status === "ready" ? list.pets.filter((p) => p.petName.toLowerCase().includes(needle)) : [];

  return (
    <>
      <input
        type="search"
        aria-label="Filter by name"
        placeholder="Filter by name"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 w-full rounded-full bg-canvas px-4 py-2.5 text-[16px] text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-accent"
      />

      {list.status === "loading" && <p className="py-6 text-center text-muted">Loading...</p>}
      {list.status === "error" && <p className="break-words py-6 text-center text-bad">{list.message}</p>}
      {list.status === "ready" && shown.length === 0 && (
        <p className="py-6 text-center text-muted">{list.pets.length ? "No one by that name" : "No other players yet"}</p>
      )}

      <ul className="space-y-2">
        {shown.map((pet) => (
          <li key={pet.ownerId}>
            <Link
              href={`/visit/${pet.ownerId}`}
              className="flex items-center gap-3 rounded-[18px] bg-canvas p-2 pr-4 ring-1 ring-line transition-transform active:scale-[0.98]"
            >
              <span className="pet-room grid size-14 shrink-0 place-items-end justify-center overflow-hidden rounded-[14px]">
                <PetSprite pose="idle" breed={pet.breed} equipped={pet.equippedItems} size={56} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[12px] leading-relaxed">{pet.petName}</span>
                <span className="block truncate text-[14px] text-muted">
                  LV {pet.level} · {STAGE_LABEL[getLifeStage(pet.level)]} · {dayjs(pet.lastUpdated).fromNow()}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
