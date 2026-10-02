"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useState, type PointerEvent, type ReactNode } from "react";
import { useSfx, type SfxKind } from "./SfxProvider";

interface Burst {
  id: number;
  x: number;
  y: number;
  /** Per-particle [dx, dy] end offsets, rolled when the burst is created. */
  shards: [number, number][];
}

interface Props extends Omit<HTMLMotionProps<"button">, "onClick" | "children"> {
  children?: ReactNode;
  onClick?: () => void;
  /** Sound + haptic on press; null for silent buttons. */
  sound?: SfxKind | null;
  /** CSS colour of the pixel burst. */
  burstColor?: string;
  /** The press is accepted but the pup says no: shake instead of burst. */
  refuse?: boolean;
}

const SHARDS = 8;
let burstId = 0;

/**
 * Every tappable thing in the game goes through here so presses feel the same:
 * a springy squash, a burst of pixel shards from the touch point, a sound and a buzz.
 */
export default function PressButton({
  onClick,
  sound = "tap",
  burstColor = "var(--accent)",
  refuse = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  const { play } = useSfx();
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const [bursts, setBursts] = useState<Burst[]>([]);

  const spawnBurst = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || refuse || reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const shards = Array.from({ length: SHARDS }, (_, i): [number, number] => {
      const angle = (i / SHARDS) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 22 + Math.random() * 18;
      return [Math.cos(angle) * dist, Math.sin(angle) * dist];
    });
    const burst = { id: burstId++, x: e.clientX - rect.left, y: e.clientY - rect.top, shards };
    setBursts((b) => [...b.slice(-2), burst]);
  };

  const handleClick = () => {
    if (refuse) {
      play("nope");
      void shake.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.42 } });
    } else if (sound) {
      play(sound);
    }
    onClick?.();
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      animate={shake}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 520, damping: 17, mass: 0.7 }}
      onPointerDown={spawnBurst}
      onClick={handleClick}
      className={`relative ${className}`}
      {...rest}
    >
      {children}
      <span aria-hidden className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {bursts.map((b) =>
            b.shards.map(([dx, dy], i) => (
              <motion.span
                key={`${b.id}-${i}`}
                className="absolute block size-[5px]"
                style={{ left: b.x - 2.5, top: b.y - 2.5, background: burstColor }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onAnimationComplete={
                  i === 0 ? () => setBursts((all) => all.filter((x) => x.id !== b.id)) : undefined
                }
              />
            )),
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
