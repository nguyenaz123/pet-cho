"use client";

/* eslint-disable @next/next/no-img-element -- Facebook avatar on an external CDN */
import Link from "next/link";
import { useState } from "react";
import { deleteAccount } from "@/app/actions/account";
import { signOutUser } from "@/app/actions/auth";
import PressButton from "@/components/ui/PressButton";
import { usePetStore } from "@/store/usePetStore";

export interface AccountUser {
  name: string | null;
  image: string | null;
}

type Busy = null | "signing-out" | "deleting";

/** Who is signed in, the way out, and account deletion. Lives at the bottom of the profile sheet. */
export default function AccountSection({ user }: { user: AccountUser }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const signOut = async () => {
    setBusy("signing-out");
    // Flush the pup first: the save needs the session that is about to be deleted.
    await usePetStore.getState().save();
    await signOutUser();
    // A full reload drops every bit of this user's game state from memory.
    window.location.replace("/");
  };

  const remove = async () => {
    setBusy("deleting");
    await deleteAccount();
    window.location.replace("/");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-[18px] bg-canvas p-2 pl-3 ring-1 ring-line">
        <Avatar user={user} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{user.name ?? "Pet owner"}</p>
          <p className="text-[13px] text-muted">Signed in with Facebook</p>
        </div>
        <PressButton
          sound="close"
          onClick={() => void signOut()}
          disabled={busy !== null}
          className="shrink-0 rounded-full bg-surface px-4 py-2 text-[14px] font-semibold ring-1 ring-line disabled:opacity-60"
        >
          {busy === "signing-out" ? "Saving..." : "Sign out"}
        </PressButton>
      </div>

      {confirmingDelete ? (
        <div role="alertdialog" aria-label="Delete account" className="rounded-[18px] p-3 ring-1 ring-bad">
          <p className="mb-3 text-[14px] leading-snug">
            Delete your account and your pup forever? This can&apos;t be undone.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <PressButton
              sound="close"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy !== null}
              className="rounded-full bg-surface py-2 text-[14px] font-semibold ring-1 ring-line disabled:opacity-60"
            >
              Keep it
            </PressButton>
            <PressButton
              onClick={() => void remove()}
              disabled={busy !== null}
              burstColor="var(--on-accent)"
              className="rounded-full bg-bad py-2 text-[14px] font-semibold text-on-accent disabled:opacity-60"
            >
              {busy === "deleting" ? "Deleting..." : "Delete"}
            </PressButton>
          </div>
        </div>
      ) : (
        <div className="flex justify-between px-1 text-[13px] text-muted">
          <span className="space-x-3">
            <Link href="/privacy" target="_blank" className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" target="_blank" className="underline-offset-2 hover:underline">
              Terms
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy !== null}
            className="text-bad underline-offset-2 hover:underline"
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, size }: { user: AccountUser; size: number }) {
  if (!user.image) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-full bg-raised font-display text-[12px] ring-1 ring-line"
      >
        {(user.name ?? "?").charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={user.image}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-full object-cover ring-1 ring-line"
    />
  );
}
