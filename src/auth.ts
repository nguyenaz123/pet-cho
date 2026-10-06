import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

/**
 * Auth.js (NextAuth v5). Reads AUTH_SECRET, AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET from env.
 * Sessions live in the database (not a JWT), so signing out or deleting a row revokes access at once.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    // The game only needs a name and avatar. Auth.js asks for "email" by default, which
    // Facebook rejects unless that permission is added to the app; user.email stays null.
    Facebook({ authorization: { params: { scope: "public_profile" } } }),
  ],
  session: { strategy: "database" },
  callbacks: {
    // Expose the user id so server code can scope data to the signed-in user.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
