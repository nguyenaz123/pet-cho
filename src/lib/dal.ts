import "server-only";
import { cache } from "react";
import { auth } from "@/auth";

/** Server env the app cannot run without. */
const REQUIRED_ENV = ["AUTH_SECRET", "AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET", "DATABASE_URL"] as const;

export const missingEnv = () => REQUIRED_ENV.filter((key) => !process.env[key]);

export interface SessionUser {
  userId: string;
  name: string | null;
  image: string | null;
}

/**
 * Data Access Layer entry point: every server read/write of user data starts here.
 * Memoised per request, so calling it from several places costs one session lookup.
 */
export const verifySession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { userId: user.id, name: user.name ?? null, image: user.image ?? null };
});
