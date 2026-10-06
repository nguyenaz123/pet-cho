"use client";

/* eslint-disable @next/next/no-img-element -- tiny pixel SVG sprite */
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signInWithFacebook } from "@/app/actions/auth";
import Notice from "@/components/ui/Notice";
import { DEFAULT_BREED, breedSprite } from "@/lib/game/breeds";

export default function LoginScreen() {
  return (
    <Notice title="Pixel Pet">
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <img src={breedSprite(DEFAULT_BREED, "idle")} alt="" width={96} height={96} className="[image-rendering:pixelated]" />
        <p className="text-muted">Sign in to adopt your puppy. Your pup is saved to your account, so it follows you to any device.</p>
      </div>
      <form action={signInWithFacebook}>
        <FacebookButton />
      </form>
      <p className="mt-4 text-center text-[13px] text-muted">
        By continuing you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </Notice>
  );
}

function FacebookButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] py-3.5 font-semibold text-white transition-[transform,opacity] active:scale-[0.97] disabled:opacity-60"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
      </svg>
      {pending ? "Opening Facebook..." : "Continue with Facebook"}
    </button>
  );
}
