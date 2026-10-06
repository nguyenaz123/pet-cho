"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs */
import { motion } from "framer-motion";
import { useState } from "react";
import AccountSection, { type AccountUser } from "@/components/AccountSection";
import Modal from "@/components/ui/Modal";
import PressButton from "@/components/ui/PressButton";
import PetSprite, { PetAvatar } from "@/components/pet/PetSprite";
import { BREEDS, getBreed } from "@/lib/game/breeds";
import { STAGE_LABEL } from "@/lib/game/constants";
import { getLifeStage } from "@/lib/game/engine";
import { WEARABLES } from "@/lib/game/items";
import type { BreedId, EquipSlot, PetData } from "@/types/pet";

interface Props {
  open: boolean;
  pet: PetData;
  user: AccountUser;
  /** No dressing up mid-nap; the account section stays usable. */
  sleeping: boolean;
  onEquip: (slot: EquipSlot, itemId: string | null) => void;
  onBreed: (breed: BreedId) => void;
  onClose: () => void;
}

type Tab = "breed" | EquipSlot;

const TABS: { tab: Tab; label: string }[] = [
  { tab: "breed", label: "Breed" },
  { tab: "hat", label: "Hats" },
  { tab: "clothes", label: "Clothes" },
];

const THUMB = 52;

export default function ProfileModal({ open, pet, user, sleeping, onEquip, onBreed, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("breed");
  const outfitKey = `${pet.breed}-${pet.equippedItems.hat}-${pet.equippedItems.clothes}`;

  const unlocked = (tab: Tab) => {
    const pool = tab === "breed" ? BREEDS : WEARABLES.filter((w) => w.slot === tab);
    return `${pool.filter((x) => x.minLevel <= pet.level).length}/${pool.length}`;
  };

  return (
    <Modal open={open} title="Profile" onClose={onClose}>
      <div className="pet-room relative mb-3 flex h-36 items-end justify-center overflow-hidden rounded-[18px] pb-2">
        {/* a little hop every time the look changes */}
        <motion.div
          key={outfitKey}
          initial={{ y: 0, scale: 1 }}
          animate={{ y: [0, -14, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <PetSprite pose="idle" breed={pet.breed} equipped={pet.equippedItems} size={128} />
        </motion.div>
      </div>

      <div className="mb-4 text-center">
        <p className="truncate font-display text-[12px] leading-relaxed">{pet.petName}</p>
        <p className="text-[14px] text-muted">
          LV {pet.level} · {STAGE_LABEL[getLifeStage(pet.level)]} · {getBreed(pet.breed)?.name}
        </p>
      </div>

      <div role="tablist" aria-label="Customise" className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-canvas p-1 ring-1 ring-line">
        {TABS.map(({ tab: t, label }) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 text-[14px] font-semibold transition-colors duration-300 ${
              tab === t ? "bg-accent text-on-accent" : "text-muted"
            }`}
          >
            {label} <span className="font-normal opacity-75">{unlocked(t)}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mb-5 grid grid-cols-4 gap-2">
        {sleeping ? (
          <p className="col-span-4 py-6 text-center text-muted">Shh... sleeping! Dress up after the nap.</p>
        ) : tab === "breed"
          ? BREEDS.map((breed) => {
              const locked = breed.minLevel > pet.level;
              return (
                <ItemButton
                  key={breed.id}
                  label={breed.name}
                  minLevel={locked ? breed.minLevel : null}
                  active={pet.breed === breed.id}
                  onClick={() => onBreed(breed.id)}
                >
                  <PetAvatar breed={breed.id} equipped={pet.equippedItems} size={THUMB} className="rounded-full" />
                </ItemButton>
              );
            })
          : [null, ...WEARABLES.filter((w) => w.slot === tab)].map((item) => {
              const locked = !!item && item.minLevel > pet.level;
              const preview = { ...pet.equippedItems, [tab]: item?.id ?? null };
              return (
                <ItemButton
                  key={item?.id ?? "none"}
                  label={item?.name ?? "None"}
                  minLevel={locked ? item.minLevel : null}
                  active={pet.equippedItems[tab] === (item?.id ?? null)}
                  onClick={() => onEquip(tab, item?.id ?? null)}
                >
                  {tab === "hat" ? (
                    <PetAvatar breed={pet.breed} equipped={preview} size={THUMB} className="rounded-full" />
                  ) : (
                    <PetSprite pose="idle" breed={pet.breed} equipped={preview} size={THUMB} />
                  )}
                </ItemButton>
              );
            })}
      </div>

      <AccountSection user={user} />

      <PressButton
        sound="close"
        onClick={onClose}
        burstColor="var(--on-accent)"
        className="mt-4 w-full rounded-full bg-accent py-3.5 text-[16px] font-semibold text-on-accent"
      >
        Done
      </PressButton>
    </Modal>
  );
}

function ItemButton({
  label,
  active,
  minLevel,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  /** Set while the item is still locked. */
  minLevel: number | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const locked = minLevel !== null;
  return (
    <PressButton
      disabled={locked}
      onClick={onClick}
      title={locked ? `${label} · unlocks at LV ${minLevel}` : label}
      aria-pressed={active}
      className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[18px] p-1 text-[13px] font-medium leading-tight transition-colors duration-300 ${
        active ? "bg-accent/12 text-ink ring-2 ring-accent" : "bg-canvas ring-1 ring-line"
      } ${locked ? "cursor-not-allowed text-muted" : ""}`}
    >
      <span className={locked ? "opacity-35 grayscale" : ""}>{children}</span>
      <span className="max-w-full truncate px-0.5">{locked ? `LV ${minLevel}` : label}</span>
      {locked && <img src="/sprites/icons/lock.svg" alt="" width={14} height={14} className="absolute right-1.5 top-1.5" />}
    </PressButton>
  );
}
