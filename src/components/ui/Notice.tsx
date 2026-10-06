"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Centred card for full-screen messages: sign-in, setup, errors. */
export default function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bezel w-full max-w-[440px]"
      >
        <div className="bezel-core px-6 py-7 text-[16px] leading-relaxed">
          <h1 className="mb-4 font-display text-[13px] leading-relaxed">{title}</h1>
          {children}
        </div>
      </motion.div>
    </main>
  );
}
