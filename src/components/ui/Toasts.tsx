"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { Toast } from "@/store/usePetStore";

const TOAST_MS = 2_800;
const TONE = {
  info: "bg-raised text-ink",
  good: "bg-raised text-good",
  bad: "bg-bad text-white",
} as const;

export default function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onDismiss(toast.id)}
      initial={{ y: -24, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -12, opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`pointer-events-auto max-w-[360px] rounded-full px-5 py-2.5 text-center text-[15px] font-medium leading-snug shadow-[0_10px_30px_-10px_rgb(var(--shadow-rgb)/0.35)] ring-1 ring-line ${TONE[toast.tone]}`}
    >
      {toast.text}
    </motion.button>
  );
}
