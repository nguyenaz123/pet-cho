import type { Metadata } from "next";
import LegalPage, { Contact } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Data Deletion · Pixel Pet" };

export default function DataDeletionPage() {
  return (
    <LegalPage title="Delete your data" updated="October 6, 2026">
      <p>You can delete your Pixel Pet account and everything stored with it at any time.</p>

      <h2>In the game</h2>
      <ul>
        <li>Sign in to Pixel Pet.</li>
        <li>Open your Profile (the outfit button at the top).</li>
        <li>At the bottom, tap Delete account and confirm.</li>
      </ul>
      <p>
        This immediately and permanently deletes your profile (Facebook ID, name, picture), your sign-in sessions, the
        access token and your pet. It cannot be undone.
      </p>

      <h2>By email</h2>
      <p>
        If you can no longer sign in, ask us to delete your data. Tell us the name you use on Facebook and your pet&apos;s
        name so we can find your account. We delete it within 30 days and confirm by reply.
      </p>
      <Contact />

      <h2>Removing the app from Facebook</h2>
      <p>
        You can also remove Pixel Pet from your Facebook account under Settings &amp; privacy → Settings → Apps and
        websites. That stops Facebook sharing data with us; to also delete what we already store, use one of the options
        above.
      </p>
    </LegalPage>
  );
}
