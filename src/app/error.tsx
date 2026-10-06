"use client";

import PressButton from "@/components/ui/PressButton";
import Notice from "@/components/ui/Notice";

/** Shown when the page fails on the server, e.g. the database is unreachable. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Notice title="Something went wrong">
      <p className="mb-5 break-words text-muted">{error.message || "Could not load your pup."}</p>
      <PressButton
        onClick={retry}
        burstColor="var(--on-accent)"
        className="w-full rounded-full bg-accent py-3.5 font-semibold text-on-accent"
      >
        Try again
      </PressButton>
    </Notice>
  );
}
