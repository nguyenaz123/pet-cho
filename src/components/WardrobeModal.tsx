"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVGs */
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import PressButton from "@/components/ui/PressButton";
import PetSprite from "@/components/pet/PetSprite";
import { WEARABLES } from "@/lib/game/items";
import type { EquipSlot, PetData } from "@/types/pet";

interface Props {
  open: boolean;
  pet: PetData;
  onEquip: (slot: EquipSlot, itemId: string | null) => void;
  onClose: () => void;
}

const SLOTS: { slot: EquipSlot; label: string }[] = [
  { slot: "hat", label: "Hats" },
  { slot: "clothes", label: "Clothes" },
];

export default function WardrobeModal({ open, pet, onEquip, onClose }: Props) {
  const outfitKey = `${pet.equippedItems.hat}-${pet.equippedItems.clothes}`;

  return (
    <Modal open={open} title="Wardrobe" onClose={onClose}>
      <div className="pet-room relative mb-5 flex h-36 items-end justify-center overflow-hidden rounded-[18px] pb-2">
        {/* a little hop every time the outfit changes */}
        <motion.div
          key={outfitKey}
          initial={{ y: 0, scale: 1 }}
          animate={{ y: [0, -14, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <PetSprite pose="idle" equipped={pet.equippedItems} size={128} />
        </motion.div>
      </div>

      {SLOTS.map(({ slot, label }) => (
        <section key={slot} className="mb-5">
          <h3 className="mb-2.5 text-[15px] font-semibold text-muted">{label}</h3>
          <div className="grid grid-cols-4 gap-2">
            <ItemButton active={pet.equippedItems[slot] === null} onClick={() => onEquip(slot, null)} label="None" />
            {WEARABLES.filter((w) => w.slot === slot).map((item) => {
              const locked = item.minLevel > pet.level;
              return (
                <ItemButton
                  key={item.id}
                  label={locked ? `LV ${item.minLevel}` : item.name}
                  active={pet.equippedItems[slot] === item.id}
                  locked={locked}
                  onClick={() => onEquip(slot, item.id)}
                >
                  {/* Items sit on the full 32x32 dog grid; crop to the rows they actually use. */}
                  <span className="relative block h-8 w-full overflow-hidden">
                    <img
                      src={item.src}
                      alt=""
                      width={96}
                      height={96}
                      className={`absolute left-1/2 max-w-none -translate-x-1/2 ${slot === "hat" ? "-top-0.5" : "-top-[50px]"} ${
                        locked ? "opacity-30 grayscale" : ""
                      }`}
                    />
                  </span>
                </ItemButton>
              );
            })}
          </div>
        </section>
      ))}

      <PressButton
        sound="close"
        onClick={onClose}
        burstColor="var(--on-accent)"
        className="mt-1 w-full rounded-full bg-accent py-3.5 text-[16px] font-semibold text-on-accent"
      >
        Done
      </PressButton>
    </Modal>
  );
}

function ItemButton({
  label,
  active,
  locked = false,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  locked?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <PressButton
      disabled={locked}
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[18px] p-1 text-[13px] font-medium leading-tight transition-colors duration-300 ${
        active ? "bg-accent/12 text-ink ring-2 ring-accent" : "bg-canvas ring-1 ring-line"
      } ${locked ? "cursor-not-allowed text-muted" : ""}`}
    >
      {children}
      <span className="max-w-full truncate px-0.5">{label}</span>
    </PressButton>
  );
}
