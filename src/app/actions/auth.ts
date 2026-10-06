"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithFacebook() {
  await signIn("facebook", { redirectTo: "/" });
}

/** The caller reloads the page afterwards so no game state from this user survives. */
export async function signOutUser() {
  await signOut({ redirect: false });
}
