"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVG icons */
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Modal from "@/components/ui/Modal";
import PressButton from "@/components/ui/PressButton";
import { STAT_KEYS } from "@/lib/game/engine";
import { TIME_SCALE } from "@/lib/game/constants";
import type { OfflineReport } from "@/store/usePetStore";

dayjs.extend(relativeTime);

const LABEL = { hunger: "Food", hygiene: "Clean", energy: "Energy", happiness: "Joy" } as const;

export default function OfflineReportModal({ report, onClose }: { report: OfflineReport | null; onClose: () => void }) {
  return (
    <Modal open={report !== null} title="Welcome back!" onClose={onClose}>
      {report && (
        <div className="space-y-5">
          <p className="text-[16px] leading-snug">
            You left {dayjs(report.before.lastUpdated).fromNow()}.
            {TIME_SCALE !== 1 && (
              <span className="mt-1 block text-[14px] text-muted">
                At x{TIME_SCALE} speed that was {dayjs(0).from(report.elapsedMs * TIME_SCALE, true)} of pet time.
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {STAT_KEYS.map((k) => {
              const before = Math.round(report.before.stats[k]);
              const after = Math.round(report.after.stats[k]);
              const diff = after - before;
              return (
                <div key={k} className="rounded-[18px] bg-canvas px-3.5 py-3 ring-1 ring-line">
                  <div className="flex items-center gap-2 text-[14px] text-muted">
                    <img src={`/sprites/icons/${k}.svg`} alt="" width={20} height={20} />
                    {LABEL[k]}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-display text-[12px] tabular-nums">
                      {before} → {after}
                    </span>
                    <span
                      className={`text-[14px] font-semibold tabular-nums ${diff < 0 ? "text-bad" : diff > 0 ? "text-good" : "text-muted"}`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {report.after.level !== report.before.level && (
            <p
              className={`rounded-full px-4 py-2 text-center font-display text-[11px] ${
                report.after.level > report.before.level ? "bg-good/15 text-good" : "bg-bad/15 text-bad"
              }`}
            >
              LV {report.before.level} → LV {report.after.level}
            </p>
          )}

          <PressButton
            sound="close"
            onClick={onClose}
            burstColor="var(--on-accent)"
            className="w-full rounded-full bg-accent py-3.5 text-[16px] font-semibold text-on-accent"
          >
            Let&apos;s play
          </PressButton>
        </div>
      )}
    </Modal>
  );
}
