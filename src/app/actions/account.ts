"use server";

import { eq } from "drizzle-orm";
import { signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySession } from "@/lib/dal";

/**
 * Permanently deletes the signed-in user. Accounts, sessions and the pet go with it
 * (ON DELETE CASCADE). The caller reloads the page afterwards.
 */
export async function deleteAccount() {
  const session = await verifySession();
  if (!session) return;
  await db.delete(users).where(eq(users.id, session.userId));
  // The session row is already gone; this clears the cookie.
  await signOut({ redirect: false });
}
