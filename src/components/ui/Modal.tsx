"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect, useEffectEvent, type ReactNode } from "react";
import { useSfx } from "./SfxProvider";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet on phones (drag down to dismiss), floating card from 640px up. */
export default function Modal({ open, title, onClose, children }: Props) {
  const { play } = useSfx();
  const drag = useDragControls();

  // Callers pass inline closures that change every game tick; keep them out of the deps.
  const onOpen = useEffectEvent(() => play("open"));
  const onEscape = useEffectEvent((e: KeyboardEvent) => e.key === "Escape" && onClose());

  useEffect(() => {
    if (!open) return;
    onOpen();
    const onKey = (e: KeyboardEvent) => onEscape(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-30 flex items-end justify-center bg-[rgb(10_14_20/0.45)] backdrop-blur-[3px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="bezel w-full max-w-[440px] !rounded-b-none !pb-0 sm:!rounded-[28px] sm:!pb-1.5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bezel-core max-h-[85dvh] overflow-y-auto !rounded-b-none px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:!rounded-[22px]">
              <div
                aria-hidden
                className="-mx-5 mb-2 flex cursor-grab touch-none justify-center pb-2 pt-1 sm:hidden"
                onPointerDown={(e) => drag.start(e)}
              >
                <span className="h-1.5 w-10 rounded-full bg-line" />
              </div>
              <h2 className="mb-5 font-display text-[12px] leading-relaxed">{title}</h2>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
